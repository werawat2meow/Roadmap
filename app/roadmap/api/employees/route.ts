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
      first_name_en,
      last_name_en,
      nick_name,
      status,
      hire_date,
      employee_photo_url,
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
    firstNameEn: item.first_name_en || '',
    lastNameEn: item.last_name_en || '',
    avatar: item.employee_photo_url || (item.nick_name ? item.nick_name.slice(0, 2).toUpperCase() : ''),
    department: item.departments?.department_name || '',
    division: item.divisions?.division_name || '',
    role: item.positions?.position_name || '',
    level: '',
    status: item.status || 'Active',
    hireDate: item.hire_date || null,
  }));

  return NextResponse.json({ success: true, data: mapped });
}