import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

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
      .order("startDate", { ascending: false });

    if (from) {
      requestQuery = requestQuery.gte("endDate", from);
    }

    if (to) {
      requestQuery = requestQuery.lte("startDate", to);
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

    const { data: requests, error: requestError } = await requestQuery;

    if (requestError) throw requestError;

    const employeeIds = Array.from(
      new Set(
        (requests || []).map((item: any) => item.employeeId).filter(Boolean),
      ),
    );

    const approverIds = Array.from(
      new Set(
        (requests || []).map((item: any) => item.approverId).filter(Boolean),
      ),
    );

    const [employeesRes, approversRes, configsRes] = await Promise.all([
      employeeIds.length > 0
        ? supabaseAdmin
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
            .in("id", employeeIds)
        : Promise.resolve({ data: [], error: null }),

      approverIds.length > 0
        ? supabaseAdmin
            .from("leave_approvers")
            .select(
              `
          id,
          firstNameTh,
          lastNameTh,
          empNo
        `,
            )
            .in("id", approverIds)
        : Promise.resolve({ data: [], error: null }),

      employeeIds.length > 0
        ? supabaseAdmin
            .from("leave_employee_configs")
            .select("employeeId, weeklyHoliday, work_start_time, work_end_time")
            .in("employeeId", employeeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (employeesRes.error) throw employeesRes.error;
    if (approversRes.error) throw approversRes.error;
    if (configsRes.error) throw configsRes.error;

    const employeeById = new Map(
      (employeesRes.data || []).map((emp: any) => [emp.id, emp]),
    );

    const approverById = new Map(
      (approversRes.data || []).map((approver: any) => [approver.id, approver]),
    );
    const configByEmployeeId = new Map(
      (configsRes.data || []).map((config: any) => [config.employeeId, config]),
    );

    let rows = (requests || []).map((item: any) => {
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
