import { NextResponse } from 'next/server';
import { db, gate, safeError, authorizedEmployee } from '@/lib/employeeMovements';

// Reporting workflow only: never alters employees.employee_status_id.
export async function POST(req) {
  try {
    const a = await gate(req, 'edit');
    if (a.response) return a.response;
    const body = await req.json();
    const action = body?.action;
    const ids = [...new Set(Array.isArray(body?.employee_ids) ? body.employee_ids : [])];
    if (!['MARK_SENT', 'CLOSE'].includes(action) || !ids.length || ids.length > 100 ||
        ids.some(id => typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id))) {
      return NextResponse.json({ success: false, error: 'คำสั่งหรือรายการไม่ถูกต้อง (1–100 คน)' }, { status: 400 });
    }
    for (const id of ids) {
      if (!await authorizedEmployee(a.guard, id)) {
        return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์จัดการพนักงานบางราย' }, { status: 403 });
      }
    }
    const { data: employees, error: ee } = await db.from('employees')
      .select('id,resignation_date,employee_status_id,is_deleted').in('id', ids);
    if (ee) throw ee;
    const { data: statuses, error: se } = await db.from('employee_statuses').select('id,status_code');
    if (se) throw se;
    const codes = Object.fromEntries((statuses || []).map(s => [s.id,s.status_code]));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Bangkok', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
    if ((employees || []).length !== ids.length || employees.some(e => e.is_deleted ||
      !['RESIGNED','RETIRED','TERMINATED'].includes(codes[e.employee_status_id]) ||
      !e.resignation_date || e.resignation_date > today)) {
      return NextResponse.json({ success:false, error:'ดำเนินการได้เฉพาะผู้พ้นสภาพที่ถึงวัน Last Day แล้ว และมีสถานะสิ้นสุดการจ้างงาน' },{ status:400 });
    }
    const { data: records, error: re } = await db.from('employee_exit_report_tracking')
      .select('employee_id,report_state,sent_at,closed_at').in('employee_id',ids);
    if (re) throw re;
    const map = Object.fromEntries((records || []).map(r=>[r.employee_id,r]));
    if (ids.some(id => action === 'MARK_SENT' ? ['SENT','CLOSED'].includes(map[id]?.report_state) : map[id]?.report_state !== 'SENT')) {
      return NextResponse.json({success:false,error:action==='CLOSE'?'ต้องยืนยันส่งรายงานก่อนปิดงาน':'รายการบางส่วนส่งรายงานหรือปิดงานแล้ว'}, {status:400});
    }
    const now = new Date().toISOString();
    const changes = ids.map(employee_id => ({
      employee_id,
      report_state: action === 'MARK_SENT' ? 'SENT' : 'CLOSED',
      sent_at: action === 'MARK_SENT' ? now : map[employee_id].sent_at,
      sent_by: action === 'MARK_SENT' ? a.actor.user_account_id : null,
      closed_at: action === 'CLOSE' ? now : null,
      closed_by: action === 'CLOSE' ? a.actor.user_account_id : null,
      updated_at: now,
    }));
    // Preserve original sent_by on closing, rather than replacing it.
    if (action === 'CLOSE') {
      const {data: sent, error: err}=await db.from('employee_exit_report_tracking').select('employee_id,sent_by').in('employee_id',ids);
      if(err)throw err;
      const by=Object.fromEntries((sent||[]).map(x=>[x.employee_id,x.sent_by]));
      for(const c of changes)c.sent_by=by[c.employee_id];
    }
    const {error: ue}=await db.from('employee_exit_report_tracking').upsert(changes,{onConflict:'employee_id'});
    if (ue) throw ue;
    const {error: le}=await db.from('employee_exit_report_logs').insert(ids.map(employee_id=>({employee_id,action_code:action,actor_user_account_id:a.actor.user_account_id})));
    if(le)throw le;
    return NextResponse.json({success:true,updated:ids.length});
  } catch (e) { return safeError(e); }
}
