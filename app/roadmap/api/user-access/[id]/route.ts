import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

// 🛠️ 1. แก้ไขฟังก์ชัน GET: ปรับชนิดข้อมูล params ให้เป็น Promise
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // ใช้ await ถอดเอาค่า id ออกมาจาก Promise ตามเงื่อนไขของ Next.js 16
  const { id } = await params;
  
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
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ success: false, error: 'User access not found' }, { status: 404 });
  }

  const employee = data.employees?.[0];

  const mapped = {
    id: data.id,
    employee_id: data.employee_id,
    name: `${employee?.first_name_th || ''} ${employee?.last_name_th || ''}`.trim(),
    email: employee?.email || '',
    role: data.role,
    menus: (data.rm_user_menu_permissions || [])
      .filter((perm: any) => perm.is_allowed)
      .map((perm: any) => perm.menu_name),
  };

  return NextResponse.json({ success: true, data: mapped });
}

// 🛠️ 2. แก้ไขฟังก์ชัน PUT: ปรับชนิดข้อมูล params ให้เป็น Promise เช่นกัน
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // ใช้ await เพื่อแกะเอาค่า id จาก Promise มาใช้งาน
  const { id: idFromParams } = await params;
  
  const body = await req.json();
  const { employee_id, role, menus } = body as {
    employee_id: string;
    role: string;
    menus: string[];
  };

  let accessId =
    typeof idFromParams === 'string' && idFromParams.trim().length > 0 && idFromParams !== 'undefined'
      ? idFromParams
      : undefined;

  if (!accessId && employee_id) {
    const { data: existingAccess, error: accessError } = await supabaseAdmin
      .from('rm_user_access')
      .select('id')
      .eq('employee_id', employee_id)
      .single();

    if (accessError) {
      return NextResponse.json(
        { success: false, error: accessError.message },
        { status: 500 }
      );
    }

    accessId = existingAccess?.id;
  }

  if (!accessId) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid id' },
      { status: 400 }
    );
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('rm_user_access')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', accessId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from('rm_user_menu_permissions')
    .delete()
    .eq('user_access_id', accessId);

  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  const inserts = (menus || []).map((menu) => ({
    user_access_id: accessId,
    menu_name: menu,
    is_allowed: true,
  }));

  if (inserts.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('rm_user_menu_permissions')
      .insert(inserts);

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, data: { ...data, menus: menus || [] } });
}
