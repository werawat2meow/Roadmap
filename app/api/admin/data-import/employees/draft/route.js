import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {parseEmployeeMigrationWorkbook,REQUIRED_EMPLOYEE_COLUMNS,validateEmployeeMigration} from "@/lib/imports/employeeMigration";
import {actorId,checkAccess,previewRow,getRows} from "@/lib/imports/employeeMigrationDraft";
export const runtime="nodejs";
const fail=(s,c=400)=>NextResponse.json({success:false,error:s},{status:c});
export async function POST(req){
 try{
  const guard=await checkAccess("create"); if(!guard.ok) return guard.response;
  const form=await req.formData();const file=form.get("file");
  if(!file || !/\.xlsx?$/i.test(file.name||"") || file.size>10*1024*1024)return fail("กรุณาเลือกไฟล์ Excel ขนาดไม่เกิน 10 MB");
  const {headers,rows}=parseEmployeeMigrationWorkbook(await file.arrayBuffer());
  const missing=REQUIRED_EMPLOYEE_COLUMNS.filter(x=>!headers.includes(x));if(missing.length)return fail(`ไม่พบคอลัมน์: ${missing.join(", ")}`);
  if(!rows.length||rows.length>5000)return fail("ต้องมีพนักงาน 1-5000 รายการ");
  const result=await validateEmployeeMigration({parsedRows:rows,scopeGuard:guard});
  const {data:job,error}=await supabaseAdmin.from("data_import_jobs").insert({import_type:"employee_migration",file_name:file.name,status:result.summary.invalid?"draft":"ready",total_rows:rows.length,valid_rows:result.summary.valid,invalid_rows:result.summary.invalid,created_by:actorId(guard)}).select("id").single();if(error)throw error;
  try {
   for(let i=0;i<rows.length;i+=100){
    const batch=rows.slice(i,i+100).map((r,n)=>({import_job_id:job.id,row_no:r.row_no,employee_code:result.rows[i+n].employee_code,external_employee_id:result.rows[i+n].external_employee_id||null,action:result.rows[i+n].action,status:result.rows[i+n].valid?"ready":"invalid",error_messages:result.rows[i+n].errors,warning_messages:result.rows[i+n].warnings,source_data:r.raw,mapped_data:{}}));
    const {error:e}=await supabaseAdmin.from("data_import_rows").insert(batch);if(e)throw e;
   }
  } catch(e){await supabaseAdmin.from("data_import_jobs").delete().eq("id",job.id);throw e;}
  const saved=await getRows(job.id);return NextResponse.json({success:true,job_id:job.id,job_status:result.summary.invalid?"draft":"ready",summary:result.summary,rows:result.rows.map((row,i)=>({...previewRow(row),id:saved[i]?.id}))});
 }catch(e){console.error("EMPLOYEE_MIGRATION_DRAFT_CREATE",e);return fail(e.message||"ไม่สามารถบันทึก Draft ได้",500)}
}
