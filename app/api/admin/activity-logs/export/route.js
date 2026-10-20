import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { buildAuditQuery, parseFilters } from "@/lib/audit/query";
import { attachAuditEmployeeNames } from "@/lib/audit/employeeNames";
import { writeEnterpriseAudit } from "@/lib/audit/logger";
import { getVerifiedAuditActor } from "@/lib/audit/authActor";
const LIMIT=10000;const BATCH=500;
const FIELDS=["created_at","username","employee_full_name","user_account_id","system_code","module_name","event_type","action_type","event_status","severity","description","reference_table","reference_id","ip_address","role_code","request_id","http_method","endpoint","http_status"];
const SELECT_FIELDS=[...FIELDS.filter(field=>field!=="employee_full_name"),"employee_id"];
function cell(v){const s=v==null?"":String(v);const safe=/^[\t\r\n ]*[=+@-]/.test(s)?`'${s}`:s;return `"${safe.replace(/"/g,'""')}"`;}
export async function GET(req){
 try{
  const guard=await requireScopedAccess("access.activity_logs","view");if(!guard.ok)return guard.response;
  const actor=getVerifiedAuditActor(req);
  if (!actor) return NextResponse.json({success:false,error:"ไม่พบผู้ใช้ที่ยืนยันตัวตน"},{status:401});
  const f=parseFilters(req.url);const rows=[];
  for(let start=0;start<LIMIT;start+=BATCH){
   const {data,error}=await buildAuditQuery(supabaseAdmin,f,SELECT_FIELDS.join(",")).range(start,start+BATCH-1);
   if(error)throw error;
   rows.push(...(data||[]));if(!data||data.length<BATCH)break;
  }
  // Fail closed rather than silently returning an incomplete export.
  if(rows.length===LIMIT){const {data,error}=await buildAuditQuery(supabaseAdmin,f,"id").range(LIMIT,LIMIT);if(error)throw error;if(data?.length)return NextResponse.json({success:false,error:"ผลลัพธ์เกิน 10,000 รายการ กรุณาลดช่วงวันที่ก่อน Export"},{status:413});}
  const enrichedRows = await attachAuditEmployeeNames(rows);
  const csv="\uFEFF"+[FIELDS.map(cell).join(","),...enrichedRows.map(row=>FIELDS.map(key=>cell(row[key])).join(","))].join("\r\n");
  await writeEnterpriseAudit({actor,event_type:"AUDIT_EXPORT",module_name:"AUDIT",system_code:"HRMS",event_status:"SUCCESS",description:`Export audit CSV ${rows.length} rows`,new_data:{filters:f,row_count:rows.length},request:req,endpoint:"/api/admin/activity-logs/export",http_method:"GET"});
  return new Response(csv,{
    status:200,
    headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":`attachment; filename="hrms-audit-${new Date().toISOString().slice(0,10)}.csv"`,
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff"
    }
  });
 }catch(error){console.error("AUDIT_EXPORT_ERROR",error);return NextResponse.json({success:false,error:error.message?.includes("ไม่ถูกต้อง")?error.message:"ไม่สามารถ Export Audit Log ได้"},{status:500});}
}
