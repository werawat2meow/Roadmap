// src/app/api/employees/me/route.ts
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

type Entitlement = {
  vacation: number;
  business: number;
  sick: number;
  ordainDays: number;
  maternity: number;
  birthday: number;
  unpaid: number;
  annualHolidays: number;
};

function dayDiffInclusive(a: Date, b: Date) {
  const A = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()));
  const B = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
  const ONE = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((+B - +A) / ONE) + 1);
}

function toN(x: unknown): number {
  if (typeof x === "number" && isFinite(x)) return x;
  if (x && typeof (x as any).toNumber === "function") {
    const v = (x as any).toNumber();
    return typeof v === "number" && isFinite(v) ? v : 0;
  }
  const n = Number(x);
  return isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const token = await getTokenPayload();
    if (!token?.employee_id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const employeeId = token.employee_id;

    // ดึงข้อมูลพนักงานจาก Supabase
    const { data: emp, error: empError } = await supabaseAdmin
      .from("employees")
      .select(
        `id, employee_code, first_name_th, last_name_th, email, hire_date,
        employee_photo_url, citizen_id, passport_no, gender, branch_id, department_id, division_id, unit_id,
        branches(branch_name), departments(department_name),
        divisions(division_name), units(unit_name),
        positions(position_level)`
      )
      .eq("id", employeeId)
      .maybeSingle();

    if (empError) throw new Error(empError.message);
    if (!emp) {
      return NextResponse.json({ error: "employee not found" }, { status: 404 });
    }

    const levelP: string = (emp.positions as any)?.position_level ?? "";

    const year = new Date().getUTCFullYear();
    const from = new Date(Date.UTC(year, 0, 1));
    const to = new Date(Date.UTC(year + 1, 0, 1));

    // สิทธิ์การลา
    let entitled: Entitlement = {
      vacation: 0, business: 0, sick: 0, ordainDays: 0,
      maternity: 0, birthday: 0, unpaid: 0, annualHolidays: 0,
    };

    const lr = await prisma.leaveRights.findUnique({
      where: { employeeId_year: { employeeId, year } },
    });

    if (lr) {
      entitled.vacation = toN(lr.vacationLeave);
      entitled.business = toN(lr.businessLeave);
      entitled.sick = toN(lr.sickLeave);
      entitled.ordainDays = toN(lr.ordainLeave);
      entitled.maternity = toN(lr.maternityLeave);
      entitled.birthday = toN(lr.birthdayLeave);
      entitled.unpaid = toN(lr.unpaidLeave);
      entitled.annualHolidays = toN(lr.holidayLeave);
    } else if (levelP) {
      // fallback เป็น template ตาม levelP
      const template = await prisma.leaveRightsTemplate.findFirst({
        where: { prefix: levelP },
      });
      if (template) {
        entitled.vacation = toN(template.vacationLeaveDays);
        entitled.business = toN(template.businessLeaveDays);
        entitled.sick = toN(template.sickLeaveDays);
        entitled.ordainDays = toN(template.ordainLeaveDays);
        entitled.maternity = toN(template.maternityLeaveDays);
        entitled.birthday = toN(template.birthdayLeaveDays);
        entitled.unpaid = toN(template.unpaidLeaveDays);
        entitled.annualHolidays = toN(template.holidayLeaveDays);
      }
    }

    // วันลาที่ใช้ไปในปีนี้ (PENDING + APPROVED)
    const leaveRecords = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { gte: from, lt: to },
      },
      select: { kind: true, startDate: true, endDate: true, session: true, requestedDays: true },
    });

    const used: Entitlement = {
      vacation: 0, business: 0, sick: 0, ordainDays: 0,
      maternity: 0, birthday: 0, unpaid: 0, annualHolidays: 0,
    };

    for (const l of leaveRecords) {
      const days = toN(l.requestedDays) || dayDiffInclusive(new Date(l.startDate), new Date(l.endDate));
      switch (l.kind) {
        case "ANNUAL": used.vacation += days; break;
        case "SICK": used.sick += days; break;
        case "BUSINESS": used.business += days; break;
        case "UNPAID": used.unpaid += days; break;
        case "BIRTHDAY": used.birthday += days; break;
        case "ORDAIN": used.ordainDays += days; break;
        case "MATERNITY": used.maternity += days; break;
        case "ANNUAL_HOLIDAY": used.annualHolidays += days; break;
      }
    }

    const remaining: Entitlement = {
      vacation: Math.max(0, entitled.vacation - used.vacation),
      business: Math.max(0, entitled.business - used.business),
      sick: Math.max(0, entitled.sick - used.sick),
      ordainDays: Math.max(0, entitled.ordainDays - used.ordainDays),
      maternity: Math.max(0, entitled.maternity - used.maternity),
      birthday: Math.max(0, entitled.birthday - used.birthday),
      unpaid: Math.max(0, entitled.unpaid - used.unpaid),
      annualHolidays: entitled.annualHolidays,
    };

    // ผู้อนุมัติที่ผูกกับพนักงาน
    const assignments = await prisma.leaveEmployeeApprover.findMany({
      where: { employeeId },
      include: { approver: { select: { id: true, firstNameTh: true, lastNameTh: true, empNo: true } } },
    });

    const approvers = assignments.map((a) => ({
      id: a.approver.id,
      firstNameTh: a.approver.firstNameTh ?? "",
      lastNameTh: a.approver.lastNameTh ?? "",
      empNo: a.approver.empNo ?? "",
    }));

    return NextResponse.json({
      employee: {
        empNo: emp.employee_code ?? "",
        email: emp.email ?? "",
        prefix: (emp as any).gender === "male" ? "นาย" : (emp as any).gender === "female" ? "นางสาว" : "",
        firstName: emp.first_name_th ?? "",
        lastName: emp.last_name_th ?? "",
        org: (emp.branches as any)?.branch_name ?? "",
        department: (emp.departments as any)?.department_name ?? "",
        division: (emp.divisions as any)?.division_name ?? "",
        section: (emp.units as any)?.unit_name ?? "",
        levelP,
        idCard: (emp as any).citizen_id || (emp as any).passport_no || "",
        photoUrl: emp.employee_photo_url ?? null,
        weeklyHoliday: null,
        startDate: emp.hire_date ?? null,
        approvers,
      },
      rights: { entitled, used, remaining, levelFrom: levelP || null },
    });
  } catch (e: any) {
    console.error("GET /api/employees/me error:", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}

export async function PATCH() {
  // weeklyHoliday ไม่มีในฐานข้อมูลปัจจุบัน — คืนค่า OK เพื่อ backward compatibility
  return NextResponse.json({ employee: { weeklyHoliday: null } });
}
