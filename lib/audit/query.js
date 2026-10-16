export const AUDIT_COLUMNS = "id,user_id,user_account_id,employee_id,username,role_code,module_name,system_code,action_type,event_type,event_status,severity,reference_table,reference_id,description,old_data,new_data,scope_snapshot,ip_address,user_agent,request_id,session_id,http_method,endpoint,http_status,created_at";
export function positiveInt(raw, fallback, max) { const n = Number(raw); return Number.isSafeInteger(n) && n > 0 ? Math.min(n, max) : fallback; }
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function parseFilters(url) {
  const p = new URL(url).searchParams;
  const o = {page:positiveInt(p.get("page"),1,1000000),pageSize:positiveInt(p.get("pageSize"),20,100),module_name:(p.get("module_name")||"").trim().slice(0,100),action_type:(p.get("action_type")||"").trim().slice(0,100),event_status:(p.get("event_status")||"").trim().slice(0,40),system_code:(p.get("system_code")||"").trim().slice(0,100),user_account_id:(p.get("user_account_id")||"").trim(),search:(p.get("search")||"").trim().slice(0,120),date_from:p.get("date_from")||"",date_to:p.get("date_to")||""};
  if((o.date_from&&!DATE.test(o.date_from))||(o.date_to&&!DATE.test(o.date_to))||(o.date_from&&o.date_to&&o.date_from>o.date_to)) throw new Error("ช่วงวันที่ไม่ถูกต้อง");
  if(o.user_account_id && !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(o.user_account_id)) throw new Error("รหัสบัญชีไม่ถูกต้อง");
  return o;
}
function endExclusiveBangkok(date) { const d = new Date(`${date}T00:00:00+07:00`); d.setUTCDate(d.getUTCDate()+1); return d.toISOString(); }
export function buildAuditQuery(db, filters, columns=AUDIT_COLUMNS) {
 let q=db.from("activity_logs").select(columns,{count:"exact"}).order("created_at",{ascending:false}).order("id",{ascending:false});
 for(const field of ["module_name","action_type","event_status","system_code","user_account_id"]) if(filters[field]) q=q.eq(field,filters[field]);
 if(filters.date_from) q=q.gte("created_at",`${filters.date_from}T00:00:00+07:00`);
 if(filters.date_to) q=q.lt("created_at",endExclusiveBangkok(filters.date_to));
 if(filters.search){const safe=filters.search.replace(/[\%_]/g,"\$&").replace(/[(),.]/g," ");q=q.or(`module_name.ilike.%${safe}%,action_type.ilike.%${safe}%,description.ilike.%${safe}%,username.ilike.%${safe}%`);}
 return q;
}
