import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import {
  buildEmployeeMasterDashboard,
  hasDashboardPermission,
  toEmployeeExportRows,
} from "@/lib/dashboard/employeeMasterDashboard";

function appendJsonSheet(workbook, name, rows, widths = []) {
  const sheet = XLSX.utils.json_to_sheet(rows);

  if (widths.length) {
    sheet["!cols"] = widths.map((wch) => ({ wch }));
  }

  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function distributionRows(rows = []) {
  return rows.map((item, index) => ({
    "ลำดับ": index + 1,
    "รายการ": item?.label || "ไม่ระบุ",
    "จำนวนพนักงาน": Number(item?.count || 0),
  }));
}

export async function GET() {
  try {
    const guard = await requireScopedAccess(
      "ems.employees",
      "view"
    );

    if (!guard.ok) {
      return guard.response;
    }

    if (!hasDashboardPermission(guard, "ems.dashboard.export")) {
      return NextResponse.json(
        {
          success: false,
          error: "คุณไม่มีสิทธิ์ Export Employee Master Dashboard",
        },
        { status: 403 }
      );
    }

    const dashboard = await buildEmployeeMasterDashboard(guard);
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      { "ตัวชี้วัด": "พนักงานในขอบเขต", "จำนวน": dashboard.kpi.employees_total },
      { "ตัวชี้วัด": "กำลังทำงาน", "จำนวน": dashboard.kpi.working },
      { "ตัวชี้วัด": "นับเป็น Headcount", "จำนวน": dashboard.kpi.headcount },
      { "ตัวชี้วัด": "ทดลองงาน", "จำนวน": dashboard.kpi.probation },
      { "ตัวชี้วัด": "เข้าใหม่เดือนนี้", "จำนวน": dashboard.kpi.new_this_month },
      { "ตัวชี้วัด": "เข้าใหม่ปีนี้", "จำนวน": dashboard.kpi.new_this_year },
      { "ตัวชี้วัด": "ลาออกเดือนนี้", "จำนวน": dashboard.kpi.resigned_this_month },
      { "ตัวชี้วัด": "ลาออกปีนี้", "จำนวน": dashboard.kpi.resigned_this_year },
      { "ตัวชี้วัด": "มีบัญชีผู้ใช้งาน", "จำนวน": dashboard.kpi.user_account_coverage },
    ];

    appendJsonSheet(workbook, "Summary", summaryRows, [28, 16]);

    const readinessRows = [
      {
        "หมวด": "Organization Mapping",
        "พร้อม": dashboard.readiness.organization.value,
        "ทั้งหมด": dashboard.readiness.organization.total,
        "เปอร์เซ็นต์": dashboard.readiness.organization.percent,
      },
      {
        "หมวด": "Job Architecture",
        "พร้อม": dashboard.readiness.job_architecture.value,
        "ทั้งหมด": dashboard.readiness.job_architecture.total,
        "เปอร์เซ็นต์": dashboard.readiness.job_architecture.percent,
      },
      {
        "หมวด": "Cost Structure",
        "พร้อม": dashboard.readiness.cost_structure.value,
        "ทั้งหมด": dashboard.readiness.cost_structure.total,
        "เปอร์เซ็นต์": dashboard.readiness.cost_structure.percent,
      },
      {
        "หมวด": "Payroll",
        "พร้อม": dashboard.readiness.payroll.value,
        "ทั้งหมด": dashboard.readiness.payroll.total,
        "เปอร์เซ็นต์": dashboard.readiness.payroll.percent,
      },
      {
        "หมวด": "Contact / Email",
        "พร้อม": dashboard.readiness.contact.value,
        "ทั้งหมด": dashboard.readiness.contact.total,
        "เปอร์เซ็นต์": dashboard.readiness.contact.percent,
      },
      {
        "หมวด": "User Account",
        "พร้อม": dashboard.readiness.user_account.value,
        "ทั้งหมด": dashboard.readiness.user_account.total,
        "เปอร์เซ็นต์": dashboard.readiness.user_account.percent,
      },
    ];

    appendJsonSheet(workbook, "Data Readiness", readinessRows, [28, 14, 14, 14]);

    appendJsonSheet(
      workbook,
      "By Company",
      distributionRows(dashboard.distributions.companies),
      [10, 40, 18]
    );

    appendJsonSheet(
      workbook,
      "By Branch",
      distributionRows(dashboard.distributions.branches),
      [10, 40, 18]
    );

    appendJsonSheet(
      workbook,
      "By Department",
      distributionRows(dashboard.distributions.departments),
      [10, 40, 18]
    );

    appendJsonSheet(
      workbook,
      "By Employment Type",
      distributionRows(dashboard.distributions.employment_types),
      [10, 40, 18]
    );

    appendJsonSheet(
      workbook,
      "By Position Level",
      distributionRows(dashboard.distributions.position_levels),
      [10, 40, 18]
    );

    appendJsonSheet(
      workbook,
      "Employees",
      toEmployeeExportRows(dashboard),
      [16, 30, 34, 24, 26, 28, 26, 26, 22, 26, 28, 28, 24, 16, 16, 16]
    );

    const workbookBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
    const timePart = now.toISOString().slice(11, 16).replace(":", "");
    const fileName = `employee-master-dashboard-${datePart}-${timePart}.xlsx`;

    return new NextResponse(workbookBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_MASTER_DASHBOARD_EXPORT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถ Export Employee Master Dashboard ได้",
      },
      { status: 500 }
    );
  }
}
