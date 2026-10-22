import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {checkAccess,getJob,getRows,updateDraftValidation,previewRow,MIGRATION_KEYS} from "@/lib/imports/employeeMigrationDraft";
const fail=(s,c=400)=>NextResponse.json({success:false,error:s},{status:c});
export async function GET(req,{params}) {
 try{const guard=await checkAccess("view");if(!guard.ok)return guard.response;
 const {jobId}=await params;const job=await getJob(guard,jobId);if(!job)return fail("ไม่พบ Import Job หรือไม่มีสิทธิ์",404);
 const rows=await getRows(jobId);return NextResponse.json({success:true,job,rows:rows.map(r=>({id:r.id,row_no:r.row_no,employee_code:r.employee_code,external_employee_id:r.external_employee_id,action:r.action,valid:r.status==="ready"||r.status==="imported",errors:r.error_messages,warnings:r.warning_messages,employee_name:[r.source_data?.first_name_th,r.source_data?.last_name_th].filter(Boolean).join(" "),company_code:r.mapped_data?.company_code??r.source_data?.company_code,branch_code:r.mapped_data?.branch_code??r.source_data?.branch_code,department_code:r.mapped_data?.department_code??r.source_data?.department_code,position_code:r.mapped_data?.position_code??r.source_data?.position_code,base_salary:r.mapped_data?.base_salary??r.source_data?.base_salary,mapping:Object.fromEntries(MIGRATION_KEYS.map(k=>[k,r.mapped_data?.[k]??r.source_data?.[k]??""])),legacy_employee_codes:r.mapped_data?.legacy_employee_codes??r.source_data?.legacy_employee_codes??[],selected_primary_code:r.mapped_data?.selected_primary_code??r.source_data?.selected_primary_code??r.employee_code,code_strategy:r.mapped_data?.code_strategy??r.source_data?.code_strategy??"GENERATE"}))});
 }catch(e){return fail(e.message,500)}
}
export async function PATCH(req,{params}){
 try{const view=await checkAccess("view");if(!view.ok)return view.response;const create=await checkAccess("create");const edit=await checkAccess("edit");if(!create.ok&&!edit.ok)return fail("ไม่มีสิทธิ์แก้ Mapping",403);
 const {jobId}=await params;const job=await getJob(view,jobId);if(!job)return fail("ไม่พบ Job",404);if(!["draft","ready"].includes(job.status))return fail("Job นี้ไม่สามารถแก้ไขแล้ว",409);
 const body=await req.json();const updates=Array.isArray(body?.updates)?body.updates:[];if(!updates.length||updates.length>5000)return fail("ไม่มีข้อมูล Mapping ที่จะแก้ไข");
 const old=await getRows(jobId);const byId=new Map(old.map(r=>[r.id,r]));
 for(const item of updates){const row=byId.get(item.id);if(!row)return fail("Row ไม่อยู่ใน Job นี้",403);
  const changes=Object.fromEntries(Object.entries(item.mapping||{}).filter(([k,v])=>MIGRATION_KEYS.includes(k)&&((typeof v==="string"||typeof v==="number")&&String(v).length<=2000 || (k==="legacy_employee_codes"&&Array.isArray(v)&&v.length<=30&&v.every(x=>typeof x==="string"&&x.length<=100)))));
  row.mapped_data={...(row.mapped_data||{}),...changes};
 }
 // Full validation with original server scope before persisting edits.
 const {validateRows}=await import("@/lib/imports/employeeMigrationDraft");const validation=await validateRows(old,view);
 const touched=new Set(updates.map(r=>r.id));for(let i=0;i<old.length;i++){if(!touched.has(old[i].id))continue; const checked=validation.rows[i];if(checked.action==="insert"&&!create.ok)return fail("ไม่มีสิทธิ์เพิ่มพนักงาน",403);if(checked.action==="update"&&!edit.ok)return fail("ไม่มีสิทธิ์แก้พนักงาน",403);}
 for(const row of old){if(!touched.has(row.id))continue;const {error}=await supabaseAdmin.from("data_import_rows").update({mapped_data:row.mapped_data}).eq("id",row.id).eq("import_job_id",jobId);if(error)throw error;}
 const result=await updateDraftValidation(jobId,view,old);
 return NextResponse.json({success:true,summary:result.summary,rows:result.rows.map((r,i)=>({...previewRow(r),id:old[i].id}))});
 }catch(e){console.error("EMPLOYEE_MIGRATION_DRAFT_PATCH",e);return fail(e.message||"บันทึก Mapping ไม่สำเร็จ",500)}
}
