import { movementSharedViewGate } from "@/lib/employeeMovementAuditAccess";
import { NextResponse } from 'next/server';
import { db, gate, safeError, visibleEmployeeIds } from '@/lib/employeeMovements';
const ORG = [['company_id', 'companies', 'company_name_th'], ['branch_group_id', 'branch_groups', 'group_name'], ['branch_id', 'branches', 'branch_name'], ['department_id', 'departments', 'department_name'], ['division_id', 'divisions', 'division_name'], ['unit_id', 'units', 'unit_name']];
export async function GET(req) {
  try {
    const a = await movementSharedViewGate(req); if (a.response) return a.response;
    const ids = await visibleEmployeeIds(a.guard); const result = Object.fromEntries(ORG.map(([field]) => [field, []])); if (ids?.length === 0) return NextResponse.json({ success: true, data: { ...result, position_levels: [] } });
    // Only org references attached to employees in caller's scope; no broad organization data leak.
    const orgKeys = [...ORG.map(x => x[0]), 'position_level_id']; let employeeRows = [];
    for (let i = 0; i < 5000; i += 500) { let q = db.from('employees').select('id,' + orgKeys.join(',')).eq('is_deleted', false).order('id').range(i, i + 499); if (ids) q = q.in('id', ids); const { data, error } = await q; if (error) throw error; employeeRows.push(...(data || [])); if ((data || []).length < 500) break; }
    for (const [field, table, name] of ORG) {
      const keys = [...new Set(employeeRows.map(x => x[field]).filter(Boolean))]; if (!keys.length) continue;
      const { data, error } = await db.from(table).select('*').in('id', keys); if (error) throw error;
      result[field] = (data || []).map(x => ({ value: x.id, label: x[name] || x.name || x.id })).sort((a, b) => a.label.localeCompare(b.label, 'th'));
    }
    // ระดับ P: แสดงเฉพาะระดับที่พนักงานใน Employee Scope นี้ใช้งานจริง
    const levelIds = [...new Set(employeeRows.map(x => x.position_level_id).filter(Boolean))];
    const levelOptions = [];
    for (let index = 0; index < levelIds.length; index += 300) {
      const { data: levelRows, error: levelError } = await db.from('position_levels')
        .select('id,level_code,level_name,sort_order,status')
        .in('id', levelIds.slice(index, index + 300));
      if (levelError) throw levelError;
      for (const item of levelRows || []) {
        if (item.status && item.status !== 'active') continue;
        levelOptions.push({ value: item.level_code, label: item.level_code + (item.level_name ? ' - ' + item.level_name : ''), sort_order: item.sort_order ?? 0 });
      }
    }
    result.position_levels = levelOptions
      .filter(x => x.value)
      .sort((a,b) => a.sort_order - b.sort_order || a.value.localeCompare(b.value, 'th'))
      .map(({value,label}) => ({value,label}));
    return NextResponse.json({ success: true, data: result });
  } catch (e) { return safeError(e) }
}
