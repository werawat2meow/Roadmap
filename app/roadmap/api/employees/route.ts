import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select(`
      id,
      employee_code,
      email,
      first_name_th,
      last_name_th,
      nick_name,
      status,
      branch_id,
      department_id,
      division_id,
      position_id,
      branches(branch_name),
      departments(department_name),
      divisions(division_name),
      positions(position_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const mapped = (data || []).map((item: any) => ({
    id: item.id,
    employeeCode: item.employee_code,
    email: item.email ?? '',
    name: `${item.first_name_th || ''} ${item.last_name_th || ''}`.trim(),
    avatar: item.nick_name ? item.nick_name.slice(0, 2).toUpperCase() : '',
    department: item.departments?.department_name || '',
    role: item.positions?.position_name || '',
    status: item.status || 'Active',
  }));

  return NextResponse.json({ success: true, data: mapped });
}