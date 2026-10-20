import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

const toNumber = (value: any) => Number(value || 0);

const getEmployeeName = (emp: any) =>
  [emp.first_name_th, emp.last_name_th].filter(Boolean).join(" ");

function getCompletedMonths(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate
    .slice(0, 10)
    .split("-")
    .map(Number);

  const [endYear, endMonth, endDay] = endDate
    .slice(0, 10)
    .split("-")
    .map(Number);

  const months =
    (endYear - startYear) * 12 +
    (endMonth - startMonth) -
    (endDay < startDay ? 1 : 0);

  return Math.max(0, months);
}

function getAnnualEntitlement(
  startWorkDate: string | null,
  today: string,
  annualDays: number,
) {
  const emptyResult = {
    eligible: false,
    completedMonths: 0,
    completedYears: 0,
    completedMonthsInCycle: 0,
    fullCycleDays: 0,
    accruedDays: 0,
    grossDays: 0,
    cycleStart: null as string | null,
  };

  if (!startWorkDate || annualDays <= 0) {
    return emptyResult;
  }

  const startDate = startWorkDate.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate > today) {
    return emptyResult;
  }

  const completedMonths = getCompletedMonths(startDate, today);

  // ทำงานไม่ครบ 12 เดือน ยังไม่มีสิทธิ์ใช้พักร้อน
  if (completedMonths < 12) {
    return {
      ...emptyResult,
      completedMonths,
    };
  }

  const completedYears = Math.floor(completedMonths / 12);
  const completedMonthsInCycle = completedMonths % 12;

  // ตั้ง 12 หารจำนวนสิทธิ์ ได้จำนวนเดือนต่อสิทธิ์ 1 วัน
  const monthsPerLeaveDay = 12 / annualDays;

  // เอาเดือนที่ทำงานครบในรอบใหม่มาหาร แล้วปัดขึ้น
  const accruedDays = Math.min(
    annualDays,
    Math.ceil(completedMonthsInCycle / monthsPerLeaveDay),
  );

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);

  const cycleYear = startYear + completedYears;

  // กรณีเริ่มงาน 29 ก.พ. ปีที่ไม่มีวันที่ 29 ใช้วันสุดท้ายของ ก.พ.
  const lastDayOfMonth = new Date(
    Date.UTC(cycleYear, startMonth, 0),
  ).getUTCDate();

  const anniversaryDay = Math.min(startDay, lastDayOfMonth);

  const cycleStart = [
    cycleYear,
    String(startMonth).padStart(2, "0"),
    String(anniversaryDay).padStart(2, "0"),
  ].join("-");

  return {
    eligible: true,
    completedMonths,
    completedYears,
    completedMonthsInCycle,
    fullCycleDays: annualDays,
    accruedDays,
    grossDays: annualDays + accruedDays,
    cycleStart,
  };
}

export async function GET() {
  try {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const currentYear = Number(today.slice(0, 4));
    const [
      employeesRes,
      rightsRes,
      requestsRes,
      holidaysRes,
      ordainHistoryRes,
    ] = await Promise.all([
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
          hire_date,
          start_work_date,
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
        .select("employeeId, kind, startDate, requestedDays, status")
        .eq("status", "APPROVED")
        .gte("startDate", `${currentYear}-01-01T00:00:00+07:00`)
        .lt("startDate", `${currentYear + 1}-01-01T00:00:00+07:00`),

      supabaseAdmin
        .from("leave_holidays")
        .select("date")
        .gte("date", `${currentYear}-01-01`)
        .lt("date", `${currentYear + 1}-01-01`),

      supabaseAdmin
        .from("leave_requests")
        .select("employeeId, startDate")
        .eq("kind", "ORDAIN")
        .eq("status", "APPROVED"),
    ]);

    if (employeesRes.error) throw employeesRes.error;
    if (rightsRes.error) throw rightsRes.error;
    if (requestsRes.error) throw requestsRes.error;
    if (holidaysRes.error) throw holidaysRes.error;
    if (ordainHistoryRes.error) throw ordainHistoryRes.error;

    const ordainUsedEmployeeIds = new Set(
      (ordainHistoryRes.data || [])
        .filter((request) => String(request.startDate).slice(0, 10) <= today)
        .map((request) => request.employeeId),
    );

    // นับวันหยุดที่ประกาศในปีนี้ เฉพาะวันที่ผ่านแล้วรวมวันนี้
    // หากประกาศวันเดียวกันหลายรายการ ให้นับเป็น 1 วัน
    const earnedHolidayDays = new Set(
      (holidaysRes.data || [])
        .map((holiday) => String(holiday.date).slice(0, 10))
        .filter((date) => date <= today),
    ).size;

    const rightsByEmployeeId = new Map(
      (rightsRes.data || []).map((item: any) => [item.employeeId, item]),
    );

    const usedByEmployeeId = new Map<string, Record<string, number>>();

    const holidayUsedBeforeExpiry = new Map<string, number>();

    // ใช้เวลาไทย เพื่อรวมรายการที่เริ่มลาวันที่ 30 กันยายนด้วย
    const holidayExpiryExclusive = Date.parse(
      `${currentYear}-10-01T00:00:00+07:00`,
    );

    for (const request of requestsRes.data || []) {
      if (
        request.kind === "ANNUAL_HOLIDAY" &&
        Date.parse(request.startDate) < holidayExpiryExclusive
      ) {
        holidayUsedBeforeExpiry.set(
          request.employeeId,
          (holidayUsedBeforeExpiry.get(request.employeeId) || 0) +
            toNumber(request.requestedDays),
        );
      }
    }

    (requestsRes.data || []).forEach((req: any) => {
      const current = usedByEmployeeId.get(req.employeeId) || {};
      current[req.kind] =
        (current[req.kind] || 0) + toNumber(req.requestedDays);
      usedByEmployeeId.set(req.employeeId, current);
    });

    const data = (employeesRes.data || []).map((emp: any) => {
      const rights = rightsByEmployeeId.get(emp.id) || {};
      const used = usedByEmployeeId.get(emp.id) || {};
      const annualEntitlement = getAnnualEntitlement(
        emp.start_work_date,
        today,
        toNumber(rights.annualLeave),
      );
      const holidayCarry = toNumber(rights.carryForwardHoliday);

      const holidayUsedBeforeOctober = holidayUsedBeforeExpiry.get(emp.id) || 0;

      // ยอดยกมาตั้งต้น หักจำนวนที่ใช้ไปก่อนหมดอายุ
      const unusedHolidayCarry = Math.max(
        0,
        holidayCarry - holidayUsedBeforeOctober,
      );

      // ใช้ได้ถึง 30 กันยายน หมดอายุตั้งแต่ 1 ตุลาคม
      const expiredHolidayCarry =
        today >= `${currentYear}-10-01` ? unusedHolidayCarry : 0;

      const availableHolidayTotal =
        earnedHolidayDays + holidayCarry - expiredHolidayCarry;

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
          total: availableHolidayTotal,
          base: earnedHolidayDays,

          // เก็บยอดตั้งต้นไว้ให้ช่องกรอก HR อ่านค่าเดิมได้
          carryForward: holidayCarry,

          expired: expiredHolidayCarry,
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
        birthday: {
          total: toNumber(rights.birthdayLeave),
          used: toNumber(used.BIRTHDAY),
        },
        ordain: {
          total: ordainUsedEmployeeIds.has(emp.id)
            ? 0
            : toNumber(rights.ordainLeave),
          used: 0,
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
        annualEntitlement,
        leaves,
      };
    });

    return NextResponse.json({
      success: true,
      year: currentYear,
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

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "กรุณาเข้าสู่ระบบ" },
        { status: auth.status || 401 },
      );
    }

    const { data: role, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_code")
      .eq("id", auth.user.role_id)
      .maybeSingle();

    if (roleError) throw roleError;

    const allowedRoles = ["SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"];

    if (!role || !allowedRoles.includes(role.role_code)) {
      return NextResponse.json(
        { success: false, error: "คุณไม่มีสิทธิ์แก้ไขยอดยกมา" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const currentYear = Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
      }).format(new Date()),
    );

    const { employeeId, year, carryForwardAnnual, carryForwardHoliday } = body;

    if (typeof employeeId !== "string" || !employeeId || year !== currentYear) {
      return NextResponse.json(
        {
          success: false,
          error: "ข้อมูลพนักงานหรือปีไม่ถูกต้อง กรุณาโหลดหน้าใหม่",
        },
        { status: 400 },
      );
    }

    function isValidCarryForward(value: unknown): value is number {
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 9999.5 &&
        Number.isInteger(value * 2)
      );
    }

    if (
      !isValidCarryForward(carryForwardAnnual) ||
      !isValidCarryForward(carryForwardHoliday)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ยอดยกมาต้องไม่ติดลบ และเพิ่มครั้งละ 0.5 วัน",
        },
        { status: 400 },
      );
    }

    // อัปเดตเฉพาะยอดยกมา ไม่เขียนทับสิทธิ์ประเภทอื่น
    const { data: updated, error } = await supabaseAdmin
      .from("leave_rights")
      .update({
        carryForwardAnnual,
        carryForwardHoliday,
      })
      .eq("employeeId", employeeId)
      .eq("year", currentYear)
      .select("employeeId, carryForwardAnnual, carryForwardHoliday")
      .maybeSingle();

    if (error) throw error;

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error:
            "พนักงานคนนี้ยังไม่มีข้อมูลสิทธิ์ประจำปี กรุณาสร้างสิทธิ์ก่อนบันทึกยอดยกมา",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    console.error("Update leave carry forward failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "บันทึกยอดยกมาไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}
