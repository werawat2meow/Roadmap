import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import {
  getDefaultScheduleMonth,
  getLeaveSchedulePeriod,
} from "@/lib/leave-schedule-period";
import { readAllScheduleRows } from "@/lib/leave-schedule-query";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readPositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (value === null) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("เลขหน้าหรือจำนวนรายการไม่ถูกต้อง");
  }

  return parsed;
}

export async function GET(req: Request) {
  try {
    const auth = await requirePermission("leave.view");

    if (!auth.ok) {
      return auth.response;
    }

    const params = new URL(req.url).searchParams;
    const defaultMonth = getDefaultScheduleMonth();

    const year = Number(
      params.get("year") ?? defaultMonth.year,
    );

    const month = Number(
      params.get("month") ?? defaultMonth.month,
    );

    let period;

    try {
      period = getLeaveSchedulePeriod(year, month);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "ปีหรือเดือนไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    let page: number;
    let pageSize: number;

    try {
      page = readPositiveInteger(params.get("page"), 1);

      pageSize = Math.min(
        readPositiveInteger(params.get("pageSize"), 30),
        100,
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "เลขหน้าหรือจำนวนรายการไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const scopeFilters = [
      ["branchId", "branch_id"],
      ["departmentId", "department_id"],
      ["divisionId", "division_id"],
      ["unitId", "unit_id"],
    ] as const;

    for (const [parameter] of scopeFilters) {
      const value = params.get(parameter);

      if (value && !UUID_PATTERN.test(value)) {
        return NextResponse.json(
          {
            success: false,
            error: `รหัสตัวกรอง ${parameter} ไม่ถูกต้อง`,
          },
          { status: 400 },
        );
      }
    }

    // อ่านพนักงานเฉพาะขอบเขตที่บัญชีนี้ได้รับอนุญาต
    let employeeQuery = supabaseAdmin
      .from("employees")
      .select(
        `
          id,
          employee_code,
          first_name_th,
          last_name_th,
          branch_id,
          department_id,
          division_id,
          unit_id,
          branches(branch_name),
          departments(department_name),
          divisions(division_name),
          units(unit_name)
        `,
        { count: "exact" },
      )
      .eq("is_deleted", false)
      .eq("status", "active");

    employeeQuery = applyEmployeeScope(
      employeeQuery,
      auth.access,
      { permission: "leave.view" },
    );

    for (const [parameter, column] of scopeFilters) {
      const value = params.get(parameter);

      if (value) {
        employeeQuery = employeeQuery.eq(column, value);
      }
    }

    const keyword = (params.get("keyword") || "")
      .trim()
      .replace(/[(),%\\]/g, "")
      .slice(0, 100);

    if (keyword) {
      employeeQuery = employeeQuery.or(
        [
          `employee_code.ilike.%${keyword}%`,
          `first_name_th.ilike.%${keyword}%`,
          `last_name_th.ilike.%${keyword}%`,
        ].join(","),
      );
    }

    const offset = (page - 1) * pageSize;

    const {
      data: employeeRows,
      error: employeeError,
      count,
    } = await employeeQuery
      .order("employee_code")
      .order("id")
      .range(offset, offset + pageSize - 1);

    if (employeeError) throw employeeError;

    const employees = employeeRows || [];
    const employeeIds = employees.map((item) => item.id);

    // GET อ่านรอบที่มีอยู่เท่านั้น ไม่สร้างรอบใหม่ตอนเปิดหน้า
    const {
      data: savedPeriod,
      error: periodError,
    } = await supabaseAdmin
      .from("leave_work_schedule_periods")
      .select("id, start_date, end_date")
      .eq("start_date", period.startDate)
      .eq("end_date", period.endDate)
      .maybeSingle();

    if (periodError) throw periodError;

    const [configsResult, scheduleRows] = await Promise.all([
      employeeIds.length
        ? supabaseAdmin
            .from("leave_employee_configs")
            .select(
              `
                employeeId,
                weeklyHoliday,
                work_start_time,
                work_end_time
              `,
            )
            .in("employeeId", employeeIds)
        : Promise.resolve({
            data: [],
            error: null,
          }),

      savedPeriod && employeeIds.length
        ? readAllScheduleRows(
            supabaseAdmin
              .from("leave_work_schedule_days")
              .select(`
                id,
                employee_id,
                work_date,
                day_type,
                state,
                revision,
                shift_id,
                shift_name_snapshot,
                source,
                note,
                published_at,
                leave_work_schedule_intervals (
                  id,
                  sequence,
                  starts_at,
                  ends_at
                )
              `)
              .eq("period_id", savedPeriod.id)
              .in("employee_id", employeeIds)
              .in("state", ["DRAFT", "PUBLISHED"])
              .order("id"),
          )
        : Promise.resolve([]),
    ]);

    if (configsResult.error) throw configsResult.error;

    const configsByEmployee = new Map(
      (configsResult.data || []).map((config) => [
        config.employeeId,
        config,
      ]),
    );

    const mappedEmployees = employees.map((employee) => {
      const config = configsByEmployee.get(employee.id);

      return {
        id: employee.id,
        employeeCode: employee.employee_code || "",
        name: [
          employee.first_name_th,
          employee.last_name_th,
        ]
          .filter(Boolean)
          .join(" "),

        branchId: employee.branch_id,
        departmentId: employee.department_id,
        divisionId: employee.division_id,
        unitId: employee.unit_id,

        // ชื่อหน่วยงานใช้ข้อมูล relation ที่อ่านมา
        organization: {
          branch: employee.branches,
          department: employee.departments,
          division: employee.divisions,
          unit: employee.units,
        },

        defaults: {
          weeklyHoliday: config?.weeklyHoliday || "",
          startTime:
            config?.work_start_time?.slice(0, 5) || "",
          endTime:
            config?.work_end_time?.slice(0, 5) || "",
        },
      };
    });

    const mappedSchedules = scheduleRows.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      workDate: row.work_date,
      dayType: row.day_type,
      state: row.state,
      revision: row.revision,
      shiftId: row.shift_id,
      shiftName: row.shift_name_snapshot,
      source: row.source,
      note: row.note || "",
      publishedAt: row.published_at,

      intervals: (
        row.leave_work_schedule_intervals || []
      )
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .map((interval) => ({
          id: interval.id,
          sequence: interval.sequence,
          startsAt: interval.starts_at,
          endsAt: interval.ends_at,
        })),
    }));

    return NextResponse.json({
      success: true,

      period: {
        ...period,
        id: savedPeriod?.id || null,
      },

      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },

      employees: mappedEmployees,
      schedules: mappedSchedules,
    });
  } catch (error: unknown) {
    console.error("Load work schedules failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "โหลดตารางงานไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}