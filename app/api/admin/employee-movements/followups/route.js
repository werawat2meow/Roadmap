import { NextResponse } from 'next/server';
import { db, gate, safeError, authorizedEmployee } from '@/lib/employeeMovements';
import { orientationEligible } from '@/lib/employeeMovementRoster';

// Existing permission set: edit or update, not a newly invented permission.
async function manageGate(req) {
  const a = await gate(req, 'edit');
  return a;
}
export async function POST(req) {
  try {
    const a = await manageGate(req); if (a.response) return a.response;
    const b = await req.json();
    const ids = [...new Set(Array.isArray(b.employee_ids) ? b.employee_ids : [])];
    if (!ids.length || ids.length > 100 || ids.some(x => typeof x !== 'string' || !/^[a-f0-9-]{36}$/i.test(x))) return NextResponse.json({ success: false, error: 'เลือกรายการ 1–100 รายการ' }, { status: 400 });
    if (!['COMPLETE_ORIENTATION', 'REOPEN_ORIENTATION'].includes(b.action)) return NextResponse.json({ success: false, error: 'คำสั่งไม่ถูกต้อง' }, { status: 400 });
    // Fail closed: validate ALL employees in scope before changing any row.
    for (const id of ids) if (!await authorizedEmployee(a.guard, id)) return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์จัดการพนักงานบางรายการ' }, { status: 403 });
    // Preparing an orientation is allowed only for PRE_HIRE employees.
    // Completing it requires the actual first day and a prior PENDING preparation.
    const { data: employees, error: employeeError } = await db.from('employees')
      .select('id,hire_date,resignation_date,employee_status_id,is_deleted').in('id', ids);
    if (employeeError) throw employeeError;
    const { data: statuses, error: statusError } = await db.from('employee_statuses')
      .select('id,status_code');
    if (statusError) throw statusError;
    const statusMap = Object.fromEntries((statuses || []).map(s => [s.id, s.status_code]));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const { data: current, error: ce } = await db.from('employee_movement_followups')
      .select('*').in('employee_id', ids);
    if (ce) throw ce;
    const previous = Object.fromEntries((current || []).map(x => [x.employee_id, x]));
    if ((employees || []).length !== ids.length || (employees || []).some(e => {
      const code = String(statusMap[e.employee_status_id] || '').toUpperCase();
      if (e.is_deleted || (e.resignation_date && e.resignation_date <= today)) return true;
      if (b.action === 'REOPEN_ORIENTATION') {
        return code !== 'PRE_HIRE' || (e.hire_date && e.hire_date < today) || previous[e.id]?.orientation_status === 'COMPLETED' || previous[e.id]?.orientation_status === 'PENDING';
      }
      return !orientationEligible({ ...e, status_code: code }, today)
        || previous[e.id]?.orientation_status !== 'PENDING';
    })) {
      return NextResponse.json({ success: false, error: b.action === 'REOPEN_ORIENTATION'
        ? 'เปลี่ยนเป็นรอ Orientation ได้เฉพาะพนักงานสถานะรอเริ่มงาน (PRE_HIRE)'
        : 'ยืนยันเสร็จได้เฉพาะพนักงานที่เริ่มงานวันนี้และอยู่ในขั้นรอ Orientation' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const changes = b.action === 'COMPLETE_ORIENTATION' ? { orientation_status: 'COMPLETED', completed_at: now, completed_by: a.actor.user_account_id } : { orientation_status: 'PENDING', completed_at: null, completed_by: null };
    const rows = ids.map(id => ({ employee_id: id, orientation_status: previous[id]?.orientation_status || 'PENDING', notification_state: previous[id]?.notification_state || 'PENDING', orientation_date: previous[id]?.orientation_date || null, orientation_location: previous[id]?.orientation_location || null, notes: previous[id]?.notes || null, completed_at: previous[id]?.completed_at || null, completed_by: previous[id]?.completed_by || null, ...changes, updated_at: now }));
    const { error } = await db.from('employee_movement_followups').upsert(rows, { onConflict: 'employee_id' }); if (error) throw error;
    const actionCode = b.action === 'COMPLETE_ORIENTATION' ? 'ORIENTATION_COMPLETED' : 'ORIENTATION_REOPENED';
    const { error: le } = await db.from('employee_movement_followup_logs').insert(ids.map(id => ({ employee_id: id, action_code: actionCode, actor_user_account_id: a.actor.user_account_id }))); if (le) throw le;
    return NextResponse.json({ success: true, updated: ids.length });
  } catch (e) { return safeError(e) }
}
