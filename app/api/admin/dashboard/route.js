import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-key"
  );

  const userId = decoded?.user_id;
  if (!userId) return null;

  const { data: userAccount, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      role_id,
      is_active,
      roles (
        id,
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !userAccount || !userAccount.is_active) return null;

  let permissions = [];

  if (userAccount.role_id) {
    const { data: permissionRows } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permissions (
          permission_code,
          is_active
        )
      `)
      .eq("role_id", userAccount.role_id);

    permissions =
      permissionRows
        ?.map((row) => row.permissions)
        ?.filter((perm) => perm?.is_active)
        ?.map((perm) => perm.permission_code) || [];
  }

  return {
    id: userAccount.id,
    role_id: userAccount.role_id,
    role_code: userAccount.roles?.role_code || null,
    role_name: userAccount.roles?.role_name || null,
    permissions,
  };
}

function hasPermission(user, permissionCode) {
  if (!user) return false;

  return (
    Array.isArray(user.permissions) &&
    user.permissions.includes(permissionCode)
  );
}

function mapActivities(items, entity, labelKey, createdLabel, updatedLabel) {
  return (items || []).flatMap((item) => {
    const activities = [];

    if (item.created_at) {
      activities.push({
        id: `${entity}-${item.id}-created`,
        entity,
        action: "created",
        title: createdLabel(item[labelKey] || "-"),
        activity_at: item.created_at,
      });
    }

    if (
      item.updated_at &&
      item.created_at &&
      new Date(item.updated_at).getTime() !==
        new Date(item.created_at).getTime()
    ) {
      activities.push({
        id: `${entity}-${item.id}-updated`,
        entity,
        action: "updated",
        title: updatedLabel(item[labelKey] || "-"),
        activity_at: item.updated_at,
      });
    }

    return activities;
  });
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser, "dashboard.view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") || 10));

    const [
      employeesResult,
      userAccountsResult,
      rolesResult,
      permissionsResult,
      companiesResult,
      branchesResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
      positionsResult,
      employeesActivityResult,
      userAccountsActivityResult,
      rolesActivityResult,
      permissionsActivityResult,
      companiesActivityResult,
      branchesActivityResult,
      departmentsActivityResult,
      divisionsActivityResult,
      unitsActivityResult,
      positionsActivityResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("employees")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("user_accounts")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("roles")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("permissions")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("companies")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("branches")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("departments")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("divisions")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("units")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("positions")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("employees")
        .select(`
          id,
          employee_code,
          first_name_th,
          last_name_th,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("user_accounts")
        .select(`
          id,
          username,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("roles")
        .select(`
          id,
          role_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("permissions")
        .select(`
          id,
          permission_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("companies")
        .select(`
          id,
          company_name_th,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("branches")
        .select(`
          id,
          branch_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("departments")
        .select(`
          id,
          department_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("divisions")
        .select(`
          id,
          division_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("units")
        .select(`
          id,
          unit_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("positions")
        .select(`
          id,
          position_name,
          created_at,
          updated_at
        `)
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    const results = [
      employeesResult,
      userAccountsResult,
      rolesResult,
      permissionsResult,
      companiesResult,
      branchesResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
      positionsResult,
      employeesActivityResult,
      userAccountsActivityResult,
      rolesActivityResult,
      permissionsActivityResult,
      companiesActivityResult,
      branchesActivityResult,
      departmentsActivityResult,
      divisionsActivityResult,
      unitsActivityResult,
      positionsActivityResult,
    ];

    const firstError = results.find((item) => item.error);
    if (firstError?.error) {
      throw firstError.error;
    }

    const employeeActivities = mapActivities(
      (employeesActivityResult.data || []).map((item) => ({
        ...item,
        employee_name:
          `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim() ||
          item.employee_code ||
          "-",
      })),
      "employees",
      "employee_name",
      (name) => `เพิ่มพนักงาน ${name}`,
      (name) => `แก้ไขข้อมูลพนักงาน ${name}`
    );

    const userAccountActivities = mapActivities(
      userAccountsActivityResult.data || [],
      "user_accounts",
      "username",
      (name) => `สร้างบัญชีผู้ใช้งาน ${name}`,
      (name) => `แก้ไขบัญชีผู้ใช้งาน ${name}`
    );

    const roleActivities = mapActivities(
      rolesActivityResult.data || [],
      "roles",
      "role_name",
      (name) => `เพิ่มบทบาท ${name}`,
      (name) => `แก้ไขบทบาท ${name}`
    );

    const permissionActivities = mapActivities(
      permissionsActivityResult.data || [],
      "permissions",
      "permission_name",
      (name) => `เพิ่ม Permission ${name}`,
      (name) => `แก้ไข Permission ${name}`
    );

    const companyActivities = mapActivities(
      companiesActivityResult.data || [],
      "companies",
      "company_name_th",
      (name) => `เพิ่มบริษัท ${name}`,
      (name) => `แก้ไขบริษัท ${name}`
    );

    const branchActivities = mapActivities(
      branchesActivityResult.data || [],
      "branches",
      "branch_name",
      (name) => `เพิ่มสาขา ${name}`,
      (name) => `แก้ไขสาขา ${name}`
    );

    const departmentActivities = mapActivities(
      departmentsActivityResult.data || [],
      "departments",
      "department_name",
      (name) => `เพิ่มแผนก ${name}`,
      (name) => `แก้ไขแผนก ${name}`
    );

    const divisionActivities = mapActivities(
      divisionsActivityResult.data || [],
      "divisions",
      "division_name",
      (name) => `เพิ่มฝ่าย ${name}`,
      (name) => `แก้ไขฝ่าย ${name}`
    );

    const unitActivities = mapActivities(
      unitsActivityResult.data || [],
      "units",
      "unit_name",
      (name) => `เพิ่มหน่วย ${name}`,
      (name) => `แก้ไขหน่วย ${name}`
    );

    const positionActivities = mapActivities(
      positionsActivityResult.data || [],
      "positions",
      "position_name",
      (name) => `เพิ่มตำแหน่ง ${name}`,
      (name) => `แก้ไขตำแหน่ง ${name}`
    );

    const sortedActivities = [
      ...employeeActivities,
      ...userAccountActivities,
      ...roleActivities,
      ...permissionActivities,
      ...companyActivities,
      ...branchActivities,
      ...departmentActivities,
      ...divisionActivities,
      ...unitActivities,
      ...positionActivities,
    ].sort(
      (a, b) =>
        new Date(b.activity_at).getTime() - new Date(a.activity_at).getTime()
    );

    const totalActivities = sortedActivities.length;

    const recentActivities = sortedActivities.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    return NextResponse.json({
      success: true,
      data: {
        employees: employeesResult.count || 0,
        user_accounts: userAccountsResult.count || 0,
        roles: rolesResult.count || 0,
        permissions: permissionsResult.count || 0,
        companies: companiesResult.count || 0,
        branches: branchesResult.count || 0,
        departments: departmentsResult.count || 0,
        divisions: divisionsResult.count || 0,
        units: unitsResult.count || 0,
        positions: positionsResult.count || 0,
        recent_activities: recentActivities,
        recent_activities_total: totalActivities,
        recent_activities_page: page,
        recent_activities_page_size: pageSize,
      },
    });
  } catch (error) {
    console.error("GET_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}