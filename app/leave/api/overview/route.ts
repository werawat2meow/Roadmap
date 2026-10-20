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

function getBangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

function getEmployeeName(employee: any) {
  return [employee?.first_name_th, employee?.last_name_th]
    .filter(Boolean)
    .join(" ") || "-";
}

function isDateInRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export async function GET() {
  try {
    const today = getBangkokDate();
    const year = today.slice(0, 4);
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const [
      employeesResult,
      requestsResult,
      blackoutsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("employees")
        .select(`
          id,
          employee_code,
          first_name_th,
          last_name_th,
          department_id,
          departments(department_name)
        `)
        .eq("is_deleted", false),

      supabaseAdmin
        .from("leave_requests")
        .select(`
          id,
          employeeId,
          kind,
          startDate,
          endDate,
          requestedDays,
          status,
          reason
        `)
        .lte("startDate", yearEnd)
        .gte("endDate", yearStart)
        .order("startDate", { ascending: false }),

      supabaseAdmin
        .from("leave_blackouts")
        .select(`
          id,
          startDate,
          endDate,
          reason,
          active,
          leave_blackout_targets(targetType, targetId)
        `)
        .eq("active", true)
        .order("startDate", { ascending: true }),
    ]);

    if (employeesResult.error) {
      throw employeesResult.error;
    }

    if (requestsResult.error) {
      throw requestsResult.error;
    }

    if (blackoutsResult.error) {
      throw blackoutsResult.error;
    }

    const employees = employeesResult.data || [];
    const requests = requestsResult.data || [];
    const blackouts = blackoutsResult.data || [];

    const [branchesResult, departmentsResult, divisionsResult, unitsResult] =
      await Promise.all([
        supabaseAdmin.from("branches").select("id, branch_name"),
        supabaseAdmin.from("departments").select("id, department_name"),
        supabaseAdmin.from("divisions").select("id, division_name"),
        supabaseAdmin.from("units").select("id, unit_name"),
      ]);

    const targetLookup: Record<string, Map<string, string>> = {
      ORG: new Map((branchesResult.data || []).map((x: any) => [String(x.id), x.branch_name])),
      DEPARTMENT: new Map((departmentsResult.data || []).map((x: any) => [String(x.id), x.department_name])),
      DIVISION: new Map((divisionsResult.data || []).map((x: any) => [String(x.id), x.division_name])),
      UNIT: new Map((unitsResult.data || []).map((x: any) => [String(x.id), x.unit_name])),
    };

    const employeeMap = new Map(
      employees.map((employee: any) => [
        employee.id,
        {
          ...employee,
          name: getEmployeeName(employee),
          department:
            employee.departments?.department_name || "ไม่ระบุแผนก",
        },
      ]),
    );

    const pendingRequests = requests.filter(
      (request: any) => request.status === "PENDING",
    );

    const approvedRequests = requests.filter(
      (request: any) => request.status === "APPROVED",
    );

    const todayLeaves = approvedRequests
      .filter((request: any) =>
        isDateInRange(
          today,
          String(request.startDate).slice(0, 10),
          String(request.endDate).slice(0, 10),
        ),
      )
      .map((request: any) => {
        const employee = employeeMap.get(request.employeeId);

        return {
          id: request.id,
          employeeCode: employee?.employee_code || "-",
          employeeName: employee?.name || "-",
          department: employee?.department || "-",
          kind: request.kind,
          kindLabel: leaveKindLabels[request.kind] || request.kind || "-",
          startDate: request.startDate,
          endDate: request.endDate,
        };
      });

    const monthlyUsage = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      name: new Date(Number(year), index, 1).toLocaleDateString("th-TH", {
        month: "short",
      }),
      total: 0,
    }));

    approvedRequests.forEach((request: any) => {
      const month = Number(String(request.startDate).slice(5, 7));

      if (month >= 1 && month <= 12) {
        monthlyUsage[month - 1].total += Number(request.requestedDays) || 0;
      }
    });

    const departmentMap = new Map<string, any>();

    employees.forEach((employee: any) => {
      const department =
        employee.departments?.department_name || "ไม่ระบุแผนก";

      if (!departmentMap.has(department)) {
        departmentMap.set(department, {
          name: department,
          employeeCount: 0,
          onLeaveToday: 0,
          leaveDays: 0,
          pendingCount: 0,
        });
      }

      departmentMap.get(department).employeeCount += 1;
    });

    requests.forEach((request: any) => {
      const employee = employeeMap.get(request.employeeId);
      const department = employee?.department || "ไม่ระบุแผนก";
      const current = departmentMap.get(department);

      if (!current) {
        return;
      }

      if (request.status === "APPROVED") {
        current.leaveDays += Number(request.requestedDays) || 0;
      }

      if (request.status === "PENDING") {
        current.pendingCount += 1;
      }

      if (
        request.status === "APPROVED" &&
        isDateInRange(
          today,
          String(request.startDate).slice(0, 10),
          String(request.endDate).slice(0, 10),
        )
      ) {
        current.onLeaveToday += 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          employeeCount: employees.length,
          pendingCount: pendingRequests.length,
          onLeaveTodayCount: todayLeaves.length,
          restrictedDateCount: blackouts.length,
          approvedLeaveDays: approvedRequests.reduce(
            (total: number, request: any) =>
              total + (Number(request.requestedDays) || 0),
            0,
          ),
        },
        monthlyUsage,
        departments: Array.from(departmentMap.values()).sort(
          (a, b) => b.leaveDays - a.leaveDays,
        ),
        todayLeaves,
        upcomingBlackouts: blackouts
          .filter(
            (blackout: any) =>
              String(blackout.startDate).slice(0, 10) >= today,
          )
          .slice(0, 5)
          .map((blackout: any) => ({
            id: blackout.id,
            startDate: blackout.startDate,
            endDate: blackout.endDate,
            reason: blackout.reason || "ไม่ระบุเหตุผล",
            targets: (blackout.leave_blackout_targets || []).map((target: any) => ({
              type: target.targetType,
              name: targetLookup[target.targetType]?.get(String(target.targetId)) || "ไม่พบข้อมูลหน่วยงาน",
            })),
          })),
      },
    });
  } catch (error: any) {
    console.error("Leave overview error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถโหลดข้อมูล Overview ได้",
      },
      { status: 500 },
    );
  }
}
