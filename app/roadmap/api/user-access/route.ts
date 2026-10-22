import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const DEFAULT_ROADMAP_MENUS = [
  "Overview",
  "Employee",
  "Evaluate HR",
];

const normalizeMenus = (menus: string[] = []) =>
  Array.from(new Set([...DEFAULT_ROADMAP_MENUS, ...menus]));

async function getPortalRoadmapAccounts() {
  const { data: roadmapPermission, error: permissionError } =
    await supabaseAdmin
      .from("permissions")
      .select("id")
      .eq("permission_code", "roadmap.portal.view")
      .eq("is_active", true)
      .maybeSingle();

  if (permissionError) {
    throw permissionError;
  }

  if (!roadmapPermission?.id) {
    return [];
  }

  const { data: rolePermissions, error: rolePermissionError } =
    await supabaseAdmin
      .from("role_permissions")
      .select("role_id, roles!inner(is_active)")
      .eq("permission_id", roadmapPermission.id)
      .eq("roles.is_active", true);

  if (rolePermissionError) {
    throw rolePermissionError;
  }

  const roadmapRoleIds = new Set(
    (rolePermissions || [])
      .map((row: any) => row.role_id)
      .filter(Boolean),
  );

  if (roadmapRoleIds.size === 0) {
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: accounts, error: accountsError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        username,
        employee_id,
        role_id,
        employees!user_accounts_employee_id_fkey (
          id,
          first_name_th,
          last_name_th,
          email
        )
      `)
      .eq("is_active", true),

    supabaseAdmin
      .from("user_access_assignments")
      .select("user_account_id, role_id")
      .eq("status", "active")
      .lte("effective_from", today)
      .or(`effective_to.is.null,effective_to.gte.${today}`),
  ]);

  if (accountsError) {
    throw accountsError;
  }

  if (assignmentsError) {
    throw assignmentsError;
  }

  const rolesByAccount = new Map<string, Set<string>>();

  for (const account of accounts || []) {
    rolesByAccount.set(
      account.id,
      new Set(account.role_id ? [account.role_id] : []),
    );
  }

  for (const assignment of assignments || []) {
    const roles = rolesByAccount.get(assignment.user_account_id);

    if (roles && assignment.role_id) {
      roles.add(assignment.role_id);
    }
  }

  return (accounts || []).filter((account: any) => {
    const roles = rolesByAccount.get(account.id) || new Set<string>();

    return [...roles].some((roleId) => roadmapRoleIds.has(roleId));
  });
}

export async function GET() {
  try {
    const portalAccounts = await getPortalRoadmapAccounts();

    const { data: accessRows, error: accessError } = await supabaseAdmin
      .from("rm_user_access")
      .select(`
        id,
        user_account_id,
        employee_id,
        role,
        rm_user_menu_permissions (
          menu_name,
          is_allowed
        )
      `);

    if (accessError) {
      return NextResponse.json(
        { success: false, error: accessError.message },
        { status: 500 },
      );
    }

    const accessByAccount = new Map(
      (accessRows || [])
        .filter((row: any) => row.user_account_id)
        .map((row: any) => [row.user_account_id, row]),
    );

    const mappedUsers = portalAccounts.map((account: any) => {
      const access = accessByAccount.get(account.id);

      const employee = Array.isArray(account.employees)
        ? account.employees[0]
        : account.employees;

      const configuredMenus =
        access?.rm_user_menu_permissions
          ?.filter((item: any) => item.is_allowed)
          .map((item: any) => item.menu_name) || [];

      const displayName =
        `${employee?.first_name_th || ""} ${
          employee?.last_name_th || ""
        }`.trim() || account.username;

      return {
        id: access?.id ?? null,
        user_account_id: account.id,
        employee_id: account.employee_id ?? null,
        name: displayName,
        email: employee?.email || "",
        role: access?.role || "ยังไม่กำหนด",
        menus: normalizeMenus(configuredMenus),
        portalRoadmapAllowed: true,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unable to load Portal Roadmap users",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userAccountId =
      typeof body.user_account_id === "string"
        ? body.user_account_id
        : "";

    const employeeId =
      typeof body.employee_id === "string" && body.employee_id.length > 0
        ? body.employee_id
        : null;

    const role =
      typeof body.role === "string" && body.role.length > 0
        ? body.role
        : "ยังไม่กำหนด";

    const menus = normalizeMenus(
      Array.isArray(body.menus) ? body.menus : [],
    );

    if (!userAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "user_account_id is required",
        },
        { status: 400 },
      );
    }

    const { data: existingAccess, error: existingError } =
      await supabaseAdmin
        .from("rm_user_access")
        .select("id")
        .eq("user_account_id", userAccountId)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 },
      );
    }

    let accessId: string;
    let accessRow: any;

    if (existingAccess?.id) {
      const { data, error } = await supabaseAdmin
        .from("rm_user_access")
        .update({
          employee_id: employeeId,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccess.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        );
      }

      accessId = data.id;
      accessRow = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("rm_user_access")
        .insert({
          user_account_id: userAccountId,
          employee_id: employeeId,
          role,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        );
      }

      accessId = data.id;
      accessRow = data;
    }

    const { error: deleteMenuError } = await supabaseAdmin
      .from("rm_user_menu_permissions")
      .delete()
      .eq("user_access_id", accessId);

    if (deleteMenuError) {
      return NextResponse.json(
        { success: false, error: deleteMenuError.message },
        { status: 500 },
      );
    }

    const menuRows = menus.map((menu) => ({
      user_access_id: accessId,
      menu_name: menu,
      is_allowed: true,
    }));

    const { error: insertMenuError } = await supabaseAdmin
      .from("rm_user_menu_permissions")
      .insert(menuRows);

    if (insertMenuError) {
      return NextResponse.json(
        { success: false, error: insertMenuError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...accessRow,
        user_account_id: userAccountId,
        employee_id: employeeId,
        role,
        menus,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unable to save Roadmap access",
      },
      { status: 500 },
    );
  }
}
