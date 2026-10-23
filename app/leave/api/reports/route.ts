import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { assessAttendanceRange } from "@/lib/leave-attendance-assessment";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import { readAllScheduleRows } from "@/lib/leave-schedule-query";

const leaveKindLabels: Record<string, string> = {
  ANNUAL: "ลาพักร้อน",
  SICK: "ลาป่วย",
  BUSINESS: "ลากิจ",
  ANNUAL_HOLIDAY: "วันหยุดประจำปี",
  BIRTHDAY: "ลาวันเกิด",
  ORDAIN: "ลาบวช",
  MATERNITY: "ลาคลอด",
  UNPAID: "ลาไม่รับค่าจ้าง",
};

const statusLabels: Record<string, string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getEmployeeName(emp: any) {
  return [emp?.first_name_th, emp?.last_name_th].filter(Boolean).join(" ");
}

function getApproverName(approver: any) {
  return [approver?.firstNameTh, approver?.lastNameTh]
    .filter(Boolean)
    .join(" ");
}

function uniqueOptions(rows: any[], key: string) {
  const map = new Map<string, string>();

  rows.forEach((row) => {
    const value = row[key];

    if (value && value !== "-") {
      map.set(value, value);
    }
  });

  return Array.from(map.values()).map((value) => ({
    value,
    label: value,
  }));
}

export async function GET(req: Request) {
  try {
    const auth = await requirePermission("leave.view");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const keyword = (searchParams.get("keyword") || "").trim().toLowerCase();

    const department = searchParams.get("department") || "";
    const division = searchParams.get("division") || "";
    const unit = searchParams.get("unit") || "";

    const kind = searchParams.get("kind") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const employeeKeyword = keyword;

    const start = new Date(`${from}T00:00:00+07:00`);
    const end = new Date(`${to}T00:00:00+07:00`);
    const validDate = (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };
    if (!validDate(from) || !validDate(to) || start > end ||
      (end.getTime() - start.getTime()) / 86400000 >= 366) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกช่วงวันที่ให้ถูกต้องและไม่เกิน 366 วัน" },
        { status: 400 },
      );
    }
    const endExclusive = new Date(end.getTime() + 86400000).toISOString();

    function getRequestQuery() {
    let requestQuery = supabaseAdmin
      .from("leave_requests")
      .select(
        `
        id,
        employeeId,
        approverId,
        kind,
        startDate,
        endDate,
        session,
        reason,
        requestedDays,
        status,
        createdAt
      `,
      )
      .order("startDate", { ascending: false })
      .order("id");

    if (from) {
      requestQuery = requestQuery.gte("endDate", start.toISOString());
    }

    if (to) {
      requestQuery = requestQuery.lt("startDate", endExclusive);
    }

    if (kind) {
      requestQuery = requestQuery.eq("kind", kind);
    }

    if (status) {
      requestQuery = requestQuery.eq("status", status);
    }

    if (source === "paper") {
      requestQuery = requestQuery.ilike("reason", "[Paper]%");
    }

    if (source === "system") {
      requestQuery = requestQuery.not("reason", "ilike", "[Paper]%");
    }

      return requestQuery;
    }

    let employeeQuery = supabaseAdmin
      .from("employees")
      .select(
        `
    id,
    employee_code,
    first_name_th,
    last_name_th,
    department_id,
    division_id,
    unit_id,
    departments(department_name),
    divisions(division_name),
    units(unit_name)
  `,
      )
      .eq("is_deleted", false);

    employeeQuery = applyEmployeeScope(employeeQuery, auth.access, {
      permission: "leave.view",
    });

    if (employeeKeyword) {
      employeeQuery = employeeQuery.or(
        `employee_code.ilike.%${employeeKeyword.replace(/[,().%_]/g, " ")}%,first_name_th.ilike.%${employeeKeyword.replace(/[,().%_]/g, " ")}%,last_name_th.ilike.%${employeeKeyword.replace(/[,().%_]/g, " ")}%`,
      );
    }

    const allEmployees = await readAllScheduleRows(employeeQuery.order("id"));

    // Limit the request query to employees accessible to this user.
    const requests = [];
    for (let offset = 0; offset < allEmployees.length; offset += 100) {
      const chunk = allEmployees.slice(offset, offset + 100).map((employee) => employee.id);
      requests.push(...await readAllScheduleRows(getRequestQuery().in("employeeId", chunk)));
    }
    requests.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));

    const employeeById = new Map(
      allEmployees.map((employee: any) => [employee.id, employee]),
    );
    const approverIds = [...new Set(requests.map((item) => item.approverId).filter(Boolean))];
    const approvers = [];
    for (let offset = 0; offset < approverIds.length; offset += 100) {
      approvers.push(...await readAllScheduleRows(
        supabaseAdmin.from("leave_approvers")
          .select("id,firstNameTh,lastNameTh,empNo")
          .in("id", approverIds.slice(offset, offset + 100)).order("id"),
      ));
    }
    const approverById = new Map(
      approvers.map((approver: any) => [approver.id, approver]),
    );
    // Retain response compatibility; Settings no longer determines attendance.
    const configByEmployeeId = new Map<string, {
      weeklyHoliday?: string; work_start_time?: string; work_end_time?: string;
    }>();
    const attendanceByEmployeeId = new Map<string, {
      date: string; checkIn: string | null; checkOut: string | null;
    }[]>();

    const employeeRows = (allEmployees || [])
      .filter((employee: any) => {
        const employeeDepartment = employee.departments?.department_name || "-";

        const employeeDivision = employee.divisions?.division_name || "-";

        const employeeUnit = employee.units?.unit_name || "-";

        if (department && employeeDepartment !== department) {
          return false;
        }

        if (division && employeeDivision !== division) {
          return false;
        }

        if (unit && employeeUnit !== unit) {
          return false;
        }

        return true;
      })
      .map((employee: any) => {
        const config = configByEmployeeId.get(employee.id) || {};

        return {
          employeeId: employee.id,
          employeeCode: employee.employee_code || "",
          employeeName: getEmployeeName(employee),
          department: employee.departments?.department_name || "-",
          division: employee.divisions?.division_name || "-",
          unit: employee.units?.unit_name || "-",
          weeklyHoliday: config.weeklyHoliday || "",
          workStartTime: config.work_start_time || "",
          workEndTime: config.work_end_time || "",
          attendance: attendanceByEmployeeId.get(employee.id) || [],
        };
      });

    const allowedEmployeeIds = new Set(employeeRows.map((employee) => employee.employeeId));
    const assessments = await assessAttendanceRange([...allowedEmployeeIds], from, to);
    const assessmentsByEmployee = new Map<string, typeof assessments>();
    for (const item of assessments) {
      const current = assessmentsByEmployee.get(item.employeeId) || [];
      current.push(item);
      assessmentsByEmployee.set(item.employeeId, current);
    }
    const employeesWithAssessment = employeeRows.map((employee) => ({
      ...employee,
      dailyResults: assessmentsByEmployee.get(employee.employeeId) || [],
    }));

    let rows = requests.filter((item) => allowedEmployeeIds.has(item.employeeId)).map((item: any) => {
      const emp = employeeById.get(item.employeeId);
      const approver = approverById.get(item.approverId);
      const config = configByEmployeeId.get(item.employeeId);

      const employeeName = getEmployeeName(emp);
      const employeeCode = emp?.employee_code || "";

      return {
        id: item.id,
        employeeId: item.employeeId,
        employeeCode,
        employeeName,
        department: emp?.departments?.department_name || "-",
        division: emp?.divisions?.division_name || "-",
        unit: emp?.units?.unit_name || "-",
        weeklyHoliday: config?.weeklyHoliday || "",
        workStartTime: config?.work_start_time || "",
        workEndTime: config?.work_end_time || "",
        kind: item.kind,
        kindLabel: leaveKindLabels[item.kind] || item.kind || "-",
        startDate: item.startDate,
        endDate: item.endDate,
        session: item.session || "FULL",
        requestedDays: toNumber(item.requestedDays),
        status: item.status,
        statusLabel: statusLabels[item.status] || item.status || "-",
        approverName: getApproverName(approver) || "-",
        reason: item.reason || "",
        source: String(item.reason || "").startsWith("[Paper]")
          ? "HR บันทึกย้อนหลัง"
          : "จากระบบ",
        createdAt: item.createdAt,
      };
    });

    if (keyword) {
      rows = rows.filter((row) => {
        return (
          row.employeeName.toLowerCase().includes(keyword) ||
          row.employeeCode.toLowerCase().includes(keyword)
        );
      });
    }

    if (department) {
      rows = rows.filter((row) => row.department === department);
    }

    if (division) {
      rows = rows.filter((row) => row.division === division);
    }

    if (unit) {
      rows = rows.filter((row) => row.unit === unit);
    }

    const employeeCount = new Set(rows.map((row) => row.employeeId)).size;
    const requestCount = rows.length;
    const totalDays = rows.reduce((sum, row) => sum + row.requestedDays, 0);

    const pendingCount = rows.filter((row) => row.status === "PENDING").length;
    const approvedCount = rows.filter(
      (row) => row.status === "APPROVED",
    ).length;
    const rejectedCount = rows.filter(
      (row) => row.status === "REJECTED",
    ).length;

    const leaveTypeMap = new Map<string, any>();

    rows.forEach((row) => {
      const current = leaveTypeMap.get(row.kind) || {
        kind: row.kind,
        label: row.kindLabel,
        count: 0,
        days: 0,
      };

      current.count += 1;
      current.days += row.requestedDays;

      leaveTypeMap.set(row.kind, current);
    });

    const departmentMap = new Map<string, any>();

    rows.forEach((row) => {
      const current = departmentMap.get(row.department) || {
        name: row.department,
        employeeIds: new Set<string>(),
        requestCount: 0,
        totalDays: 0,
      };

      current.employeeIds.add(row.employeeId);
      current.requestCount += 1;
      current.totalDays += row.requestedDays;

      departmentMap.set(row.department, current);
    });

    const departmentSummary = Array.from(departmentMap.values()).map(
      (item) => ({
        name: item.name,
        employeeCount: item.employeeIds.size,
        requestCount: item.requestCount,
        totalDays: item.totalDays,
      }),
    );

    return NextResponse.json({
      success: true,
      summary: {
        employeeCount,
        requestCount,
        totalDays,
        pendingCount,
        approvedCount,
        rejectedCount,
      },
      leaveTypeSummary: Array.from(leaveTypeMap.values()),
      departmentSummary,
      filterOptions: {
        departments: uniqueOptions(rows, "department"),
        divisions: uniqueOptions(rows, "division"),
        units: uniqueOptions(rows, "unit"),
      },
      data: rows,
      employees: employeesWithAssessment,
    });
  } catch (error: any) {
    console.error("Load leave reports failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "โหลดรายงานการลาไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}
