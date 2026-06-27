import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('rm_user_access')
    .select(`
      id,
      employee_id,
      role,
      employees (
        id,
        first_name_th,
        last_name_th,
        email
      ),
      rm_user_menu_permissions (
        menu_name,
        is_allowed
      )
    `);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const mapped = (data || []).map((item: any) => ({
    id: item.id,
    employee_id: item.employee_id,
    name: `${item.employees?.first_name_th || ''} ${item.employees?.last_name_th || ''}`.trim(),
    email: item.employees?.email || '',
    role: item.role,
    menus: (item.rm_user_menu_permissions || [])
      .filter((perm: any) => perm.is_allowed)
      .map((perm: any) => perm.menu_name),
  }));

  return NextResponse.json({ success: true, data: mapped });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { employee_id, role, menus } = body as {
    employee_id: string;
    role: string;
    menus: string[];
  };

  if (!employee_id || !role) {
    return NextResponse.json(
      { success: false, error: 'employee_id and role are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('rm_user_access')
    .insert([{ employee_id, role }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const insertRows = (menus || []).map((menu: string) => ({
    user_access_id: data.id,
    menu_name: menu,
    is_allowed: true,
  }));

  if (insertRows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('rm_user_menu_permissions')
      .insert(insertRows);

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, data: { ...data, menus: menus || [] } });
}