import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseServer";

const REDACT = /password|passphrase|secret|token|authorization|cookie|api[_-]?key|private[_-]?key|citizen[_-]?id|passport|bank[_-]?(?:account|number)|salary|ssn|social[_-]?security/i;
export function redactAudit(value, depth=0) {
 if (value === null || value === undefined) return null;
 if(depth>=6) return "[TRUNCATED]";
 if(Array.isArray(value)) return value.slice(0,80).map(v=>redactAudit(v,depth+1));
 if(typeof value === "object") return Object.fromEntries(Object.entries(value).slice(0,80).map(([key,v])=>[key,REDACT.test(key)?"[REDACTED]":redactAudit(v,depth+1)]));
 if(typeof value === "string") return value.slice(0,2000);
 return value;
}
export function getAuditRequestContext(req){
 const headers=req?.headers;
 // Configure reverse proxy to overwrite X-Forwarded-For, never blindly trust a client supplied value.
 const forwarded=headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim();
 const ip=headers?.get?.("cf-connecting-ip")||forwarded||null;
 const candidate=headers?.get?.("x-request-id")||randomUUID();
 return {ip_address:ip,user_agent:headers?.get?.("user-agent")?.slice(0,500)||null,request_id:/^[0-9a-f-]{36}$/i.test(candidate)?candidate:randomUUID()};
}
/** Server-only writer. Never accepts actor identity from request body. */
export async function writeEnterpriseAudit({actor={},event_type,system_code="HRMS",module_name="AUTH",event_status="SUCCESS",severity="INFO",description=null,old_data=null,new_data=null,reference_table=null,reference_id=null,scope_snapshot=null,request=null,session_id=null,http_status=null,endpoint=null,http_method=null}){
 const ctx=request?getAuditRequestContext(request):{};
 const row={
 user_account_id:actor.user_account_id||null,employee_id:actor.employee_id||null,
 username:actor.username||null,role_code:actor.role_code||null,
 module_name,system_code,action_type:event_type,event_type,event_status,severity,description,
 reference_table,reference_id,
 old_data:redactAudit(old_data),new_data:redactAudit(new_data),
 scope_snapshot:redactAudit(scope_snapshot),session_id:session_id||null,http_status,endpoint,http_method,...ctx,
 };
 const {error}=await supabaseAdmin.from("activity_logs").insert(row);
 if(error) {console.error("ENTERPRISE_AUDIT_WRITE_FAILED",{event_type,code:error.code,message:error.message});return {ok:false,error};}
 return {ok:true};
}
