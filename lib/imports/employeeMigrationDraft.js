import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { validateEmployeeMigration } from "@/lib/imports/employeeMigration";

export const MIGRATION_KEYS = ["legacy_employee_codes","selected_primary_code","code_strategy","person_reference","first_name_th","last_name_th","nickname_th","company_code","branch_group_code","branch_code","department_code","division_code","unit_code","position_family_code","position_level_code","position_code","salary_band_code","employment_type_code","employee_status_code","status","start_work_date","base_salary","employee_code_type","job_code","gender_code","business_unit_code","cost_center_code","profit_center_code","payroll_company_code","payroll_type_code","payroll_group_code","salary_structure_code"];
export function actorId(guard) { return guard?.access?.user_account_id || guard?.access?.user?.id || guard?.user?.id || null; }
export async function checkAccess(action="view") { return requireScopedAccess("data.import",action,{scopeType:"employee"}); }
export function canRead(guard,job) { return guard.hasAllScope || (!!actorId(guard) && job.created_by === actorId(guard)); }
export async function getJob(guard,id) {
 const {data,error}=await supabaseAdmin.from("data_import_jobs").select("*").eq("id",id).eq("import_type","employee_migration").maybeSingle();
 if(error) throw error;
 if(!data || !canRead(guard,data)) return null;
 return data;
}
export async function getRows(id) {
 const all=[];
 for(let start=0;;start+=500){
  const {data,error}=await supabaseAdmin.from("data_import_rows").select("*").eq("import_job_id",id).order("row_no").range(start,start+499);
  if(error) throw error;
  all.push(...(data||[])); if((data||[]).length<500) break;
 }
 return all;
}
export async function validateRows(staged,guard) {
 const parsedRows=staged.map(r=>({row_no:r.row_no,raw:{...(r.source_data||{}),...(r.mapped_data||{})}}));
 return validateEmployeeMigration({parsedRows,scopeGuard:guard});
}
export function previewRow(row) {return {id:row.id,row_no:row.row_no,employee_code:row.employee_code,external_employee_id:row.external_employee_id,employee_name:[row.first_name_th,row.last_name_th].filter(Boolean).join(" "),company_code:row.company_code,branch_code:row.branch_code,department_code:row.department_code,position_code:row.position_code,base_salary:row.base_salary,action:row.action,valid:row.valid,errors:row.errors,warnings:row.warnings, mapping:Object.fromEntries(MIGRATION_KEYS.map(k=>[k,row[k]??""])),legacy_employee_codes:row.legacy_employee_codes,selected_primary_code:row.selected_primary_code,code_strategy:row.code_strategy};}
export async function updateDraftValidation(jobId,guard,stored) {
 const result=await validateRows(stored,guard);
 for (let i=0;i<stored.length;i+=100) {
  const portion=stored.slice(i,i+100);
  const updates=portion.map((r,k)=>({id:r.id,import_job_id:jobId,row_no:r.row_no,employee_code:r.employee_code,external_employee_id:r.external_employee_id,action:result.rows[i+k].action,status:result.rows[i+k].valid?"ready":"invalid",error_messages:result.rows[i+k].errors,warning_messages:result.rows[i+k].warnings,source_data:r.source_data,mapped_data:r.mapped_data,employee_id:r.employee_id}));
  const {error}=await supabaseAdmin.from("data_import_rows").upsert(updates,{onConflict:"id"}); if(error) throw error;
 }
 const {error}=await supabaseAdmin.from("data_import_jobs").update({status:result.summary.invalid?"draft":"ready",valid_rows:result.summary.valid,invalid_rows:result.summary.invalid,updated_at:new Date().toISOString()}).eq("id",jobId).in("status",["draft","ready"]); if(error) throw error;
 return result;
}
