import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTokenPayload } from "@/lib/authToken";

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenPayload();
    if (!token?.employee_id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const meEmployeeId = token.employee_id;
    const meEmpNo = String(token.employee_code || "").trim() || null;
    const role = String(
      (token as any)?.role || (token as any)?.role_code || ""
    ).toUpperCase();
    const isAdmin = role === "MASTER_ADMIN";

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const month =
      monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)
        ? monthParam
        : (() => {
            const n = new Date();
            return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(
              2,
              "0"
            )}`;
          })();

    const [y, m] = month.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const nextMonth = new Date(Date.UTC(y, m, 1));

    const orgFilter = searchParams.get("org") || undefined;
    const deptFilter = searchParams.get("department") || undefined;
    const divFilter = searchParams.get("division") || undefined;
    const unitFilter = searchParams.get("unit") || undefined;
    const onlyMyApprovalsParam = searchParams.get("onlyMyApprovals");
    const onlyMyApprovals =
      onlyMyApprovalsParam === "1" ||
      onlyMyApprovalsParam === "true" ||
      onlyMyApprovalsParam === "yes";

    const baseWhere: any = {
      startDate: { lt: nextMonth },
      endDate: { gte: start },
    };

    let where: any = { ...baseWhere };

    if (!isAdmin) {
      const approver = await prisma.leaveApprover.findFirst({
        where: {
          OR: [
            ...(meEmpNo ? [{ empNo: meEmpNo }] : []),
            { employeeId: meEmployeeId },
          ],
        },
        select: { id: true },
      });

      if (!approver) {
        return NextResponse.json({ ok: true, month, days: {} });
      }

      const assigned = await prisma.leaveEmployeeApprover.findMany({
        where: { approverId: approver.id },
        select: { employeeId: true },
      });

      const assignedEmployeeIds = assigned.map((x) => x.employeeId);

      if (onlyMyApprovals) {
        where = { ...baseWhere, approverId: approver.id };
      } else {
        const orClauses: any[] = [{ approverId: approver.id }];
        if (assignedEmployeeIds.length > 0) {
          orClauses.push({ employeeId: { in: assignedEmployeeIds } });
        }
        where = { ...baseWhere, OR: orClauses };
      }
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      select: {
        startDate: true,
        endDate: true,
        status: true,
        employeeId: true,
      },
      orderBy: { startDate: "asc" },
    });

    const employeeIds = Array.from(
      new Set(leaves.map((item) => item.employeeId))
    ).filter(Boolean);

    const { data: employees, error: empErr } = await supabaseAdmin
      .from("employees")
      .select(
        `id, employee_code, first_name_th, last_name_th,
         branches(branch_name), departments(department_name),
         divisions(division_name), units(unit_name)`
      )
      .in("id", employeeIds);

    if (empErr) {
      console.error("SUPABASE_EMP_QUERY_ERROR:", empErr);
      return NextResponse.json(
        { error: "employee lookup failed" },
        { status: 500 }
      );
    }

    const empMap = new Map<string, any>();
    for (const e of employees || []) {
      if (e?.id) empMap.set(e.id, e);
    }

    const days: Record<
      string,
      {
        approved: number;
        pending: number;
        rejected: number;
        people: Array<{ name: string; empNo: string; status: string }>;
      }
    > = {};
    const toISO = (d: Date) => d.toISOString().slice(0, 10);

    for (const lv of leaves) {
      const emp = empMap.get(lv.employeeId);
      if (!emp) continue;

      const name = `${emp.first_name_th ?? ""} ${emp.last_name_th ?? ""}`
        .trim()
        .slice(0, 100);
      const empNo = emp.employee_code ?? "";

      const s = new Date(lv.startDate);
      const e = new Date(lv.endDate);
      const os = s > start ? s : start;
      const oe =
        e < new Date(nextMonth.getTime() - 1)
          ? e
          : new Date(nextMonth.getTime() - 1);

      let cur = new Date(
        Date.UTC(os.getUTCFullYear(), os.getUTCMonth(), os.getUTCDate())
      );
      const endUTC = new Date(
        Date.UTC(oe.getUTCFullYear(), oe.getUTCMonth(), oe.getUTCDate())
      );

      while (cur.getTime() <= endUTC.getTime()) {
        const iso = toISO(cur);
        if (!days[iso]) {
          days[iso] = { approved: 0, pending: 0, rejected: 0, people: [] };
        }

        if (lv.status === "APPROVED") days[iso].approved += 1;
        else if (lv.status === "REJECTED") days[iso].rejected += 1;
        else days[iso].pending += 1;

        days[iso].people.push({
          name: name || empNo,
          empNo,
          status: lv.status,
        });

        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    return NextResponse.json({ ok: true, month, days });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}