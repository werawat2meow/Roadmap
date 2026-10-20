import { movementSharedViewGate } from "@/lib/employeeMovementAuditAccess";
import { NextResponse } from 'next/server';
import { db, gate, safeError } from '@/lib/employeeMovements';
export async function GET(req) {
  try {
    const a = await movementSharedViewGate(req); if (a.response) return a.response;
    const { data: statuses, error: se } = await db.from('employee_statuses').select('id,status_code,status_name,color,sort_order,status,is_working,is_headcount,is_payroll,is_benefit').order('sort_order').order('status_name');
    if (se) throw se;
    const counts = {};
    for (const item of statuses || []) {
      let q = db.from('employees').select('id', { count: 'exact', head: true }).eq('employee_status_id', item.id).eq('is_deleted', false);
      if (!a.guard.hasAllScope) {
        if (typeof a.guard.applyEmployeeScope !== 'function') return NextResponse.json({ success: false, error: 'Employee Scope unavailable' }, { status: 403 });
        q = a.guard.applyEmployeeScope(q);
      }
      const { count, error } = await q;
      if (error) throw error;
      counts[item.id] = count || 0;
    }
    return NextResponse.json({ success: true, data: statuses || [], counts });
  } catch (e) { return safeError(e) }
}
