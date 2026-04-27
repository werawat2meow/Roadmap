import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";

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

export async function GET() {
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

    const [
      unitPositionsResult,
      activeEmployeesResult,
      employeesForStatusBreakdownResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("unit_positions")
        .select(`
          id,
          unit_id,
          position_id,
          headcount_target,
          status,
          units (
            id,
            unit_name
          ),
          positions (
            id,
            position_name
          )
        `)
        .eq("status", "active"),

      supabaseAdmin
        .from("employees")
        .select(`
          id,
          employee_code,
          first_name_th,
          last_name_th,
          unit_id,
          position_id,
          hire_date,
          status,
          employee_status_id,
          units (
            id,
            unit_name
          ),
          positions (
            id,
            position_name
          ),
          employee_statuses (
            id,
            status_name,
            color
          )
        `)
        .eq("status", "active"),

      supabaseAdmin
        .from("employees")
        .select(`
          id,
          unit_id,
          position_id,
          status,
          employee_status_id,
          employee_statuses (
            id,
            status_name,
            color
          )
        `),
    ]);

    const results = [
      unitPositionsResult,
      activeEmployeesResult,
      employeesForStatusBreakdownResult,
    ];

    const firstError = results.find((item) => item.error);
    if (firstError?.error) {
      throw firstError.error;
    }

    const unitPositions = unitPositionsResult.data || [];
    const activeEmployees = activeEmployeesResult.data || [];
    const employeesForStatusBreakdown =
      employeesForStatusBreakdownResult.data || [];

    const actualMap = activeEmployees.reduce((acc, employee) => {
      if (!employee.unit_id || !employee.position_id) return acc;

      const key = `${employee.unit_id}_${employee.position_id}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const manpowerRows = unitPositions.map((item) => {
      const key = `${item.unit_id}_${item.position_id}`;
      const actualHeadcount = actualMap[key] || 0;
      const targetHeadcount = item.headcount_target || 0;
      const vacantHeadcount = Math.max(targetHeadcount - actualHeadcount, 0);

      return {
        unit_id: item.unit_id,
        unit_name: item.units?.unit_name || "-",
        position_id: item.position_id,
        position_name: item.positions?.position_name || "-",
        headcount_target: targetHeadcount,
        headcount_actual: actualHeadcount,
        headcount_vacant: vacantHeadcount,
      };
    });

    // ทุกตำแหน่งที่ขาดทั้งหมด
    const shortageRows = manpowerRows
      .filter((item) => item.headcount_vacant > 0)
      .sort((a, b) => {
        if (b.headcount_vacant !== a.headcount_vacant) {
          return b.headcount_vacant - a.headcount_vacant;
        }

        if (a.unit_name !== b.unit_name) {
          return a.unit_name.localeCompare(b.unit_name);
        }

        return a.position_name.localeCompare(b.position_name);
      });

    const topShortageRows = shortageRows.slice(0, 10);

    const employeeStatusSummaryMap = {};
    const positionStatusMap = {};

    for (const employee of employeesForStatusBreakdown) {
      const statusName =
        employee.employee_statuses?.status_name ||
        (employee.status === "active"
          ? "Active"
          : employee.status === "resigned"
          ? "Resigned"
          : employee.status === "inactive"
          ? "Inactive"
          : "Unknown");

      if (!employeeStatusSummaryMap[statusName]) {
        employeeStatusSummaryMap[statusName] = {
          status_name: statusName,
          total: 0,
        };
      }

      employeeStatusSummaryMap[statusName].total += 1;

      if (!employee.unit_id || !employee.position_id) continue;

      const key = `${employee.unit_id}_${employee.position_id}`;

      if (!positionStatusMap[key]) {
        positionStatusMap[key] = {};
      }

      if (!positionStatusMap[key][statusName]) {
        positionStatusMap[key][statusName] = 0;
      }

      positionStatusMap[key][statusName] += 1;
    }

    const employeeStatusSummary = Object.values(employeeStatusSummaryMap).sort(
      (a, b) => b.total - a.total
    );

    const positionStatusBreakdowns = manpowerRows.map((row) => {
      const key = `${row.unit_id}_${row.position_id}`;
      const statuses = positionStatusMap[key] || {};

      return {
        unit_name: row.unit_name,
        position_name: row.position_name,
        headcount_target: row.headcount_target,
        headcount_actual: row.headcount_actual,
        headcount_vacant: row.headcount_vacant,
        ...statuses,
      };
    });

    const totalTarget = manpowerRows.reduce(
      (sum, item) => sum + item.headcount_target,
      0
    );
    const totalActual = manpowerRows.reduce(
      (sum, item) => sum + item.headcount_actual,
      0
    );
    const totalVacant = manpowerRows.reduce(
      (sum, item) => sum + item.headcount_vacant,
      0
    );
    const coverageRate =
      totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

    const summarySheetData = [
      ["Metric", "Value"],
      ["Target Headcount", totalTarget],
      ["Actual Headcount", totalActual],
      ["Vacant Headcount", totalVacant],
      ["Coverage Rate (%)", coverageRate],
      ["All Shortage Positions Count", shortageRows.length],
    ];

    // อันนี้คือทุกตำแหน่งที่ขาดทั้งหมดจากหน้า manpower
    const allShortageSheetData = shortageRows.map((item, index) => ({
      no: index + 1,
      unit_name: item.unit_name,
      position_name: item.position_name,
      headcount_target: item.headcount_target,
      headcount_actual: item.headcount_actual,
      headcount_vacant: item.headcount_vacant,
      coverage_rate_percent:
        item.headcount_target > 0
          ? Math.round((item.headcount_actual / item.headcount_target) * 100)
          : 0,
    }));

    const topShortageSheetData = topShortageRows.map((item, index) => ({
      rank: index + 1,
      unit_name: item.unit_name,
      position_name: item.position_name,
      headcount_target: item.headcount_target,
      headcount_actual: item.headcount_actual,
      headcount_vacant: item.headcount_vacant,
    }));

    const activeEmployeesSheetData = activeEmployees.map((item, index) => ({
      no: index + 1,
      employee_code: item.employee_code || "-",
      full_name:
        `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim() || "-",
      unit_name: item.units?.unit_name || "-",
      position_name: item.positions?.position_name || "-",
      hire_date: item.hire_date || "-",
      employee_status_name: item.employee_statuses?.status_name || "-",
      row_status: item.status || "-",
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    const wsAllShortages = XLSX.utils.json_to_sheet(allShortageSheetData);
    const wsTopShortages = XLSX.utils.json_to_sheet(topShortageSheetData);
    const wsEmployees = XLSX.utils.json_to_sheet(activeEmployeesSheetData);
    const wsEmployeeStatus = XLSX.utils.json_to_sheet(employeeStatusSummary);
    const wsPositionStatus = XLSX.utils.json_to_sheet(positionStatusBreakdowns);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    XLSX.utils.book_append_sheet(wb, wsAllShortages, "All Shortage Positions");
    XLSX.utils.book_append_sheet(wb, wsTopShortages, "Top Shortages");
    XLSX.utils.book_append_sheet(wb, wsEmployees, "Active Employees");
    XLSX.utils.book_append_sheet(wb, wsEmployeeStatus, "Employee Status");
    XLSX.utils.book_append_sheet(wb, wsPositionStatus, "Position Status");

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    });

    const fileName = `dashboard-manpower-report-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("EXPORT_DASHBOARD_EXCEL_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการ Export Excel" },
      { status: 500 }
    );
  }
}