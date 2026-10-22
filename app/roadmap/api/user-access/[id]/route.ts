import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const DEFAULT_ROADMAP_MENUS = [
  "Overview",
  "Employee",
  "Evaluate HR",
];

const normalizeMenus = (menus: string[] = []) =>
  Array.from(new Set([...DEFAULT_ROADMAP_MENUS, ...menus]));

const getRelation = (value: any) =>
  Array.isArray(value) ? value[0] : value;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("rm_user_access")
    .select(`
      id,
      user_account_id,
      employee_id,
      role,
      user_accounts (
        id,
        username
      ),
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
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "User access not found" },
      { status: 404 },
    );
  }

  const employee = getRelation(data.employees);
  const account = getRelation(data.user_accounts);

  const menus = normalizeMenus(
    (data.rm_user_menu_permissions || [])
      .filter((permission: any) => permission.is_allowed)
      .map((permission: any) => permission.menu_name),
  );

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      user_account_id: data.user_account_id,
      employee_id: data.employee_id,
      name:
        `${employee?.first_name_th || ""} ${
          employee?.last_name_th || ""
        }`.trim() || account?.username || "",
      email: employee?.email || "",
      role: data.role,
      menus,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const userAccountId =
    typeof body.user_account_id === "string" &&
    body.user_account_id.length > 0
      ? body.user_account_id
      : null;

  const employeeId =
    typeof body.employee_id === "string" &&
    body.employee_id.length > 0
      ? body.employee_id
      : null;

  const role =
    typeof body.role === "string" && body.role.length > 0
      ? body.role
      : "ยังไม่กำหนด";

  const menus = normalizeMenus(
    Array.isArray(body.menus) ? body.menus : [],
  );

  const { data, error: updateError } = await supabaseAdmin
    .from("rm_user_access")
    .update({
      user_account_id: userAccountId,
      employee_id: employeeId,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 },
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("rm_user_menu_permissions")
    .delete()
    .eq("user_access_id", id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 },
    );
  }

  const menuRows = menus.map((menu) => ({
    user_access_id: id,
    menu_name: menu,
    is_allowed: true,
  }));

  const { error: insertError } = await supabaseAdmin
    .from("rm_user_menu_permissions")
    .insert(menuRows);

  if (insertError) {
    return NextResponse.json(
      { success: false, error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      user_account_id: userAccountId,
      employee_id: employeeId,
      role,
      menus,
    },
  });
}
