import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getLeaveSchedulePeriod } from "@/lib/leave-schedule-period";
import { createScheduleTemplateBuffer } from "@/lib/leave-schedule-import-excel";
import { readAllScheduleRows } from "@/lib/leave-schedule-query";
import { getScheduleShareLink, scheduleShareHeaders } from "@/lib/leave-schedule-share";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const link = await getScheduleShareLink(token);
    if (!link) return NextResponse.json({ success: false, error: "ลิงก์หมดอายุหรือถูกยกเลิก" }, { status: 404, headers: scheduleShareHeaders });
    const period = getLeaveSchedulePeriod(link.year, link.month);
    const search = new URL(request.url).searchParams;
    const template = search.get("view") === "templateFile";
    const page = Math.max(1, Math.min(100, Number(search.get("page")) || 1));
    const pageSize = template ? 500 : 30;

    let employeesQuery = supabaseAdmin.from("employees")
      .select(`id, employee_code, first_name_th, last_name_th,
        branch_id, department_id, division_id, unit_id,
        branches(branch_name), departments(department_name),
        divisions(division_name), units(unit_name)`, { count: "exact" })
      .eq("is_deleted", false).eq("status", "active")
      .eq("branch_id", link.branch_id)
      .eq("department_id", link.department_id);
    if (link.division_id) employeesQuery = employeesQuery.eq("division_id", link.division_id);
    if (link.unit_id) employeesQuery = employeesQuery.eq("unit_id", link.unit_id);
    const { data: employees = [], count, error: employeeError } = await employeesQuery
      .order("employee_code").order("id")
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (employeeError) throw employeeError;
    if ((count || 0) > 500) return NextResponse.json({ success: false, error: "ขอบเขตมีพนักงานเกิน 500 คน" }, { status: 400, headers: scheduleShareHeaders });
    const employeeRows = employees || [];

    if (template) {
      const buffer = await createScheduleTemplateBuffer({
        year: link.year, month: link.month,
        employees: employeeRows.map((employee) => ({
          employeeCode: employee.employee_code || "",
          name: [employee.first_name_th, employee.last_name_th].filter(Boolean).join(" "),
        })),
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          ...scheduleShareHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="schedule-template-${link.year}-${String(link.month).padStart(2, "0")}.xlsx"`,
        },
      });
    }

    const employeeIds = employeeRows.map((employee) => employee.id);
    const { data: savedPeriod, error: periodError } = await supabaseAdmin
      .from("leave_work_schedule_periods").select("id")
      .eq("start_date", period.startDate).eq("end_date", period.endDate).maybeSingle();
    if (periodError) throw periodError;
    const [configs, rows] = await Promise.all([
      employeeIds.length
        ? supabaseAdmin.from("leave_employee_configs")
            .select("employeeId, weeklyHoliday, work_start_time, work_end_time")
            .in("employeeId", employeeIds)
        : Promise.resolve({ data: [], error: null }),
      savedPeriod && employeeIds.length
        ? readAllScheduleRows(supabaseAdmin.from("leave_work_schedule_days")
            .select(`id, employee_id, work_date, day_type, state, revision,
              shift_name_snapshot, source, note,
              leave_work_schedule_intervals(id, sequence, starts_at, ends_at)`)
            .eq("period_id", savedPeriod.id).in("employee_id", employeeIds)
            .in("state", ["DRAFT", "PUBLISHED"]).order("id"))
        : Promise.resolve([]),
    ]);
    if (configs.error) throw configs.error;
    const configMap = new Map((configs.data || []).map((config) => [config.employeeId, config]));
    return NextResponse.json({
      success: true,
      period,
      expiresAt: link.expires_at,
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
      employees: employeeRows.map((employee) => {
        const config = configMap.get(employee.id);
        return {
          id: employee.id, employeeCode: employee.employee_code || "",
          name: [employee.first_name_th, employee.last_name_th].filter(Boolean).join(" "),
          branchId: employee.branch_id, departmentId: employee.department_id,
          divisionId: employee.division_id, unitId: employee.unit_id,
          organization: {
            branch: employee.branches, department: employee.departments,
            division: employee.divisions, unit: employee.units,
          },
          defaults: {
            weeklyHoliday: config?.weeklyHoliday || "",
            startTime: config?.work_start_time?.slice(0, 5) || "",
            endTime: config?.work_end_time?.slice(0, 5) || "",
          },
        };
      }),
      schedules: rows.map((row) => ({
        id: row.id, employeeId: row.employee_id, workDate: row.work_date,
        dayType: row.day_type, state: row.state, revision: row.revision,
        shiftName: row.shift_name_snapshot, source: row.source, note: row.note || "",
        intervals: (row.leave_work_schedule_intervals || [])
          .slice().sort((a, b) => a.sequence - b.sequence)
          .map((span) => ({ id: span.id, sequence: span.sequence, startsAt: span.starts_at, endsAt: span.ends_at })),
      })),
    }, { headers: scheduleShareHeaders });
  } catch (error) {
    console.error("Load shared schedule failed:", error);
    return NextResponse.json({ success: false, error: "โหลดตารางไม่สำเร็จ" }, { status: 500, headers: scheduleShareHeaders });
  }
}
