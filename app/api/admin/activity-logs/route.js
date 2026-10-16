import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { buildAuditQuery, parseFilters } from "@/lib/audit/query";
export async function GET(req){
 try{
  const guard=await requireScopedAccess("access.activity_logs","view"); if(!guard.ok)return guard.response;
  const filters=parseFilters(req.url);const from=(filters.page-1)*filters.pageSize;
  const {data,count,error}=await buildAuditQuery(supabaseAdmin,filters).range(from,from+filters.pageSize-1);
  if(error)throw error;
  return NextResponse.json({success:true,data:data||[],pagination:{page:filters.page,pageSize:filters.pageSize,total:count||0}});
 }catch(error){console.error("AUDIT_LIST_ERROR",error);return NextResponse.json({success:false,error:error.message?.includes("ไม่ถูกต้อง")?error.message:"ไม่สามารถโหลด Audit Logs ได้"},{status:error.message?.includes("ไม่ถูกต้อง")?400:500});}
}
