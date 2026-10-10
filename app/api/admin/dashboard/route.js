// import { NextResponse } from "next/server";
// import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
// import {
//   buildEmployeeMasterDashboard,
//   hasDashboardPermission,
// } from "@/lib/dashboard/employeeMasterDashboard";

// export async function GET() {
//   try {
//     const guard = await requireScopedAccess(
//       "ems.employees",
//       "view"
//     );

//     if (!guard.ok) {
//       return guard.response;
//     }

//     if (!hasDashboardPermission(guard, "ems.dashboard.view")) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "คุณไม่มีสิทธิ์ดู Employee Master Dashboard",
//         },
//         { status: 403 }
//       );
//     }

//     const dashboard = await buildEmployeeMasterDashboard(guard);

//     // employees ใช้เฉพาะฝั่ง Export ไม่ส่งก้อนเต็มให้หน้า Dashboard
//     const {
//       employees,
//       active_user_account_employee_ids,
//       ...publicDashboard
//     } = dashboard;

//     return NextResponse.json({
//       success: true,
//       data: publicDashboard,
//     });
//   } catch (error) {
//     console.error("EMPLOYEE_MASTER_DASHBOARD_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: "ไม่สามารถโหลด Employee Master Dashboard ได้",
//       },
//       { status: 500 }
//     );
//   }
// }




import { NextResponse } from "next/server";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import {
  buildEmployeeMasterDashboard,
  hasDashboardPermission,
} from "@/lib/dashboard/employeeMasterDashboard";

// Aggregate only employees already returned by the scoped dashboard builder.
// Never expose employee rows from this endpoint.
function monthlyWorkforceTrend(employees, now = new Date()) {
  if (!Array.isArray(employees)) return [];
  const timezone = "Asia/Bangkok";
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit",
  }).formatToParts(now);
  const year = Number(local.find((part) => part.type === "year")?.value);
  const month = Number(local.find((part) => part.type === "month")?.value);
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 12 + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return { month: key, month_label: new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date), new_count: 0, resigned_count: 0 };
  });
  const indexByMonth = new Map(months.map((row) => [row.month, row]));
  const keyOf = (value) => {
    if (!value) return null;
    const raw = String(value);
    const match = raw.match(/^(\d{4})-(\d{2})-/);
    if (match) return `${match[1]}-${match[2]}`;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit" }).formatToParts(date);
    return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
  };
  for (const employee of employees) {
    const hire = indexByMonth.get(keyOf(employee?.hire_date));
    if (hire) hire.new_count += 1;
    const resigned = indexByMonth.get(keyOf(employee?.resignation_date));
    if (resigned) resigned.resigned_count += 1;
  }
  return months;
}

export async function GET() {
  try {
    const guard = await requireScopedAccess("ems.employees", "view");
    if (!guard.ok) return guard.response;
    if (!hasDashboardPermission(guard, "ems.dashboard.view")) {
      return NextResponse.json({ success: false, error: "คุณไม่มีสิทธิ์ดู Employee Master Dashboard" }, { status: 403 });
    }
    const dashboard = await buildEmployeeMasterDashboard(guard);
    const { employees, active_user_account_employee_ids, ...publicDashboard } = dashboard;
    return NextResponse.json({
      success: true,
      data: {
        ...publicDashboard,
        workforce_trend: monthlyWorkforceTrend(employees),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("EMPLOYEE_MASTER_DASHBOARD_ERROR:", error);
    return NextResponse.json({ success: false, error: "ไม่สามารถโหลด Employee Master Dashboard ได้" }, { status: 500 });
  }
}
