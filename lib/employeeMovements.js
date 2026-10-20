import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireScopedAccess } from '@/lib/auth/requireScopedAccess';
import { getVerifiedAuditActor } from '@/lib/audit/authActor';

export const db = supabaseAdmin;
export function fail(message,status=400){return NextResponse.json({success:false,error:message},{status});}
export function safeError(err){ console.error('EMPLOYEE_MOVEMENTS_ERROR',err); return fail('ไม่สามารถดำเนินการข้อมูลความเคลื่อนไหวพนักงานได้',500); }
export async function gate(req,action='view'){
 const guard=await requireScopedAccess('ems.employee_movements',action,{scopeType:'employee'});
 if(!guard.ok)return {response:guard.response};
 const actor=getVerifiedAuditActor(req);
 if(!actor?.user_account_id)return {response:fail('กรุณาเข้าสู่ระบบใหม่',401)};
 return {guard,actor};
}
const ORG_FIELDS='id,company_id,branch_group_id,branch_id,department_id,division_id,unit_id';
export async function authorizedEmployee(guard,id){
 if(!id)return null;
 const {data,error}=await db.from('employees').select(ORG_FIELDS).eq('id',id).maybeSingle();
 if(error)throw error;
 if(!data)return null;
 if(guard.hasAllScope)return data;
 if(typeof guard.canAccessEmployee==='function')return guard.canAccessEmployee(data)?data:null;
 // Fail closed, never silently bypass missing scope implementation.
 return null;
}
// Query the employee roster with the existing authorization guard's employee scoping.
// 5k hard limit: fail explicitly instead of returning partially scoped or silently truncated data.
export async function visibleEmployeeIds(guard){
 if(guard.hasAllScope)return null;
 if(typeof guard.applyEmployeeScope!=='function')throw Error('Employee scope guard not available');
 const ids=[];
 for(let start=0;start<=5000;start+=500){
  const {data,error}=await guard.applyEmployeeScope(db.from('employees').select(ORG_FIELDS).order('id').range(start,start+499));
  if(error)throw error;
  ids.push(...(data||[]).map(x=>x.id));
  if((data||[]).length<500)return ids;
 }
 throw Error('Employee scope exceeds 5000 entries; implement server-side scoped SQL view before scaling');
}
export const EVENT_TYPES=['ONBOARDING','STARTED','PROBATION','PROBATION_PASSED','RESIGNATION','TERMINATION'];
export const FLOW={
 DRAFT:['SUBMITTED','CANCELLED'],
 SUBMITTED:['MANAGER_ACKNOWLEDGED','HR_REVIEW','EXCEPTION_REVIEW','CANCELLED'],
 MANAGER_ACKNOWLEDGED:['HR_REVIEW','EXCEPTION_REVIEW'],
 HR_REVIEW:['NOTICE_PERIOD','CLEARANCE','COMPLETED','EXCEPTION_REVIEW'],
 EXCEPTION_REVIEW:['APPROVED_EXCEPTION','NOTICE_PERIOD','CLEARANCE'],
 APPROVED_EXCEPTION:['NOTICE_PERIOD','CLEARANCE'],
 NOTICE_PERIOD:['CLEARANCE','COMPLETED'],
 CLEARANCE:['COMPLETED'],
 COMPLETED:[],CANCELLED:[]
};
export function nextAllowed(from,to){return (FLOW[from]||[]).includes(to);}
export function parseDate(s){if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return false; const d=new Date(`${s}T00:00:00Z`);return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s;}
export function pageParams(url){const s=new URL(url).searchParams;return {s,page:Math.max(1,Number.parseInt(s.get('page')||'1',10)||1),pageSize:Math.min(100,Math.max(1,Number.parseInt(s.get('pageSize')||'20',10)||20))};}
export async function auditAction(movementId,actor,from,to,action,remarks){
 const {error}=await db.from('employee_movement_actions').insert({movement_id:movementId,actor_user_id:actor.user_account_id,actor_username:actor.username,from_status:from,to_status:to,action_code:action,remarks});
 if(error)throw error;
}
