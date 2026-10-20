import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { withApiToken, isoDate, safeSearch, jsonError } from '@/lib/integration/assetsEmployeeApi';

// Deliberately exclude private contact information, identity documents, salary and bank data.
const SELECT = `
  id,employee_code,first_name_th,middle_name_th,last_name_th,nickname_th,
  hire_date,resignation_date,employee_status_id,company_id,branch_id,department_id,position_id,position_level_id,
  employee_statuses:employee_statuses!employees_employee_status_id_fkey(id,status_code,status_name),
  branches:branches!employees_branch_id_fkey(id,branch_name),
  departments:departments!employees_department_id_fkey(id,department_name),
  positions:positions!employees_position_id_fkey(id,position_name),
  position_levels:position_levels!employees_position_level_id_fkey(level_code,level_name)
`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapEmployee(e) {
  return {
    id: e.id,
    emp_id: e.employee_code,
    full_name: [e.first_name_th, e.middle_name_th, e.last_name_th].filter(Boolean).join(' '),
    nickname: e.nickname_th || '',
    level: e.position_levels?.level_code || null,
    status_id: e.employee_status_id,
    status_code: e.employee_statuses?.status_code || null,
    status_name: e.employee_statuses?.status_name || null,
    brand: { id: e.branch_id, name: e.branches?.branch_name || null },
    department: { id: e.department_id, name: e.departments?.department_name || null },
    position: { id: e.position_id, name: e.positions?.position_name || null },
    hire_date: e.hire_date,
    last_working_day: e.resignation_date,
  };
}

export async function GET(req) {
  return withApiToken(req, async ({ url }) => {
    const s = url.searchParams;
    const rawPage = s.get('page') || '1';
    const rawPageSize = s.get('pageSize') || '20';
    if (!/^\d+$/.test(rawPage) || !/^\d+$/.test(rawPageSize)) return jsonError('page และ pageSize ไม่ถูกต้อง');
    const page = Number(rawPage);
    const pageSize = Number(rawPageSize);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return jsonError('page ต้อง >= 1 และ pageSize ต้องอยู่ระหว่าง 1–100');
    }
    const from = s.get('from') || s.get('start_date') || '';
    const to = s.get('to') || s.get('end_date') || '';
    if ((from && !isoDate(from)) || (to && !isoDate(to)) || (from && to && from > to)) {
      return jsonError('ช่วงวันที่ไม่ถูกต้อง ใช้ YYYY-MM-DD');
    }
    const id = s.get('id')?.trim() || '';
    const code = s.get('employee_code')?.trim() || '';
    const status = s.get('status')?.trim() || '';
    const branchId = s.get('branch_id')?.trim() || '';
    const deptId = s.get('department_id')?.trim() || '';
    const keyword = safeSearch(s.get('keyword') || s.get('search'));
    if (id && !UUID.test(id)) return jsonError('id ต้องเป็น UUID');
    for (const value of [branchId, deptId]) if (value && !UUID.test(value)) return jsonError('รหัสสังกัด/แผนกต้องเป็น UUID');

    let query = supabaseAdmin.from('employees').select(SELECT, { count: 'exact' })
      .eq('is_deleted', false).order('hire_date', { ascending: false }).order('id');
    if (id) query = query.eq('id', id);
    if (code) query = query.eq('employee_code', code);
    if (branchId) query = query.eq('branch_id', branchId);
    if (deptId) query = query.eq('department_id', deptId);
    if (from) query = query.gte('hire_date', from);
    if (to) query = query.lte('hire_date', to);
    if (keyword) {
      query = query.or(`employee_code.ilike.%${keyword}%,first_name_th.ilike.%${keyword}%,last_name_th.ilike.%${keyword}%`);
    }
    if (status) {
      let statusQuery = supabaseAdmin.from('employee_statuses').select('id');
      if (UUID.test(status)) statusQuery = statusQuery.eq('id', status);
      else statusQuery = statusQuery.eq('status_code', status.toUpperCase());
      const { data: matches, error: statusError } = await statusQuery;
      if (statusError) throw statusError;
      const ids = (matches || []).map(row => row.id);
      if (!ids.length) return NextResponse.json({ success: true, data: [], pagination: { page, pageSize, total: 0 } });
      query = query.in('employee_status_id', ids);
    }
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw error;
    return NextResponse.json({
      success: true, data: (data || []).map(mapEmployee),
      pagination: { page, pageSize, total: count || 0 },
    });
  });
}
