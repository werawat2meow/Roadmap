import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const currentYear = new Date().getFullYear();

const toNumber = (value: any) => Number(value || 0);

const getEmployeeName = (emp: any) =>
  [emp.first_name_th, emp.last_name_th].filter(Boolean).join(" ");

export async function GET() {
  try {
    const [employeesRes, rightsRes, requestsRes] = await Promise.all([
      supabaseAdmin
        .from("employees")
        .select(
          `
          id,
          employee_code,
          first_name_th,
          last_name_th,
          work_email,
          email,
          employee_photo_url,
          department_id,
          division_id,
          unit_id,
          position_level_id,
          is_deleted,
          status,
          departments(department_name),
          divisions(division_name),
          units(unit_name),
          position_levels(level_name)
        `,
        )
        .eq("is_deleted", false)
        .eq("status", "active")
        .order("employee_code", { ascending: true }),

      supabaseAdmin.from("leave_rights").select("*").eq("year", currentYear),

      supabaseAdmin
        .from("leave_requests")
        .select("employeeId, kind, requestedDays, status")
        .eq("status", "APPROVED"),
    ]);

    if (employeesRes.error) throw employeesRes.error;
    if (rightsRes.error) throw rightsRes.error;
    if (requestsRes.error) throw requestsRes.error;

    const rightsByEmployeeId = new Map(
      (rightsRes.data || []).map((item: any) => [item.employeeId, item]),
    );

    const usedByEmployeeId = new Map<string, Record<string, number>>();

    (requestsRes.data || []).forEach((req: any) => {
      const current = usedByEmployeeId.get(req.employeeId) || {};
      current[req.kind] =
        (current[req.kind] || 0) + toNumber(req.requestedDays);
      usedByEmployeeId.set(req.employeeId, current);
    });

    const data = (employeesRes.data || []).map((emp: any) => {
      const rights = rightsByEmployeeId.get(emp.id) || {};
      const used = usedByEmployeeId.get(emp.id) || {};

      const annualTotal =
        toNumber(rights.annualLeave) + toNumber(rights.carryForwardAnnual);

      const sickTotal = toNumber(rights.sickLeave);
      const businessTotal = toNumber(rights.businessLeave);

      const leaves = {
        annual: {
          total: annualTotal,
          base: toNumber(rights.annualLeave),
          carryForward: toNumber(rights.carryForwardAnnual),
          used: toNumber(used.ANNUAL),
        },
        holiday: {
          total:
            toNumber(rights.holidayLeave) +
            toNumber(rights.carryForwardHoliday),
          base: toNumber(rights.holidayLeave),
          carryForward: toNumber(rights.carryForwardHoliday),
          used: toNumber(used.ANNUAL_HOLIDAY),
        },
        sick: {
          total: sickTotal,
          used: toNumber(used.SICK),
        },
        business: {
          total: businessTotal,
          used: toNumber(used.BUSINESS),
        },
        vacation: {
          total: toNumber(rights.vacationLeave),
          used: 0,
        },
        birthday: {
          total: toNumber(rights.birthdayLeave),
          used: toNumber(used.BIRTHDAY),
        },
        ordain: {
          total: toNumber(rights.ordainLeave),
          used: toNumber(used.ORDAIN),
        },
        maternity: {
          total: toNumber(rights.maternityLeave),
          used: toNumber(used.MATERNITY),
        },
        unpaid: {
          total: toNumber(rights.unpaidLeave),
          used: toNumber(used.UNPAID),
        },
      };

      return {
        id: emp.id,
        employeeCode: emp.employee_code,
        name: getEmployeeName(emp),
        email: emp.work_email || emp.email || "",
        avatar:
          emp.employee_photo_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.employee_code}`,
        dept: emp.departments?.department_name || "-",
        division: emp.divisions?.division_name || "",
        unit: emp.units?.unit_name || "",
        level: emp.position_levels?.level_name || "-",
        leaves,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Load leave eligibility failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "โหลดข้อมูลสิทธิ์วันลาไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}
