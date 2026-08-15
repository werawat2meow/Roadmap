import { NextResponse } from "next/server";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import {
  buildEmployeeMasterDashboard,
  hasDashboardPermission,
} from "@/lib/dashboard/employeeMasterDashboard";

export async function GET() {
  try {
    const guard = await requireScopedAccess(
      "ems.employees",
      "view"
    );

    if (!guard.ok) {
      return guard.response;
    }

    if (!hasDashboardPermission(guard, "ems.dashboard.view")) {
      return NextResponse.json(
        {
          success: false,
          error: "คุณไม่มีสิทธิ์ดู Employee Master Dashboard",
        },
        { status: 403 }
      );
    }

    const dashboard = await buildEmployeeMasterDashboard(guard);

    // employees ใช้เฉพาะฝั่ง Export ไม่ส่งก้อนเต็มให้หน้า Dashboard
    const {
      employees,
      active_user_account_employee_ids,
      ...publicDashboard
    } = dashboard;

    return NextResponse.json({
      success: true,
      data: publicDashboard,
    });
  } catch (error) {
    console.error("EMPLOYEE_MASTER_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถโหลด Employee Master Dashboard ได้",
      },
      { status: 500 }
    );
  }
}
