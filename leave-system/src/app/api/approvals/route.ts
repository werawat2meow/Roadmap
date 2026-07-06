import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type FilterParams = {
  org?: string;
  department?: string;
  division?: string;
  unit?: string;
};

export async function GET(req: Request) {
  try {
    const token = await getTokenPayload();
    if (!token?.employee_id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const filter: FilterParams = {
      org: url.searchParams.get("org") || undefined,
      department: url.searchParams.get("department") || undefined,
      division: url.searchParams.get("division") || undefined,
      unit: url.searchParams.get("unit") || undefined,
    };

    const meEmployeeId = token.employee_id;
    const meEmail = (token as any)?.email ?? null;
    const meEmpNo = (token as any)?.employee_code ?? null;
    const role = String((token as any)?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN" || role === "MASTER_ADMIN";

    const approverOr: any[] = [{ employeeId: meEmployeeId }];
    if (meEmail) approverOr.push({ email: meEmail });
    if (meEmpNo) approverOr.push({ empNo: meEmpNo });

    const approver = await prisma.leaveApprover.findFirst({
      where: { OR: approverOr },
      select: {
        id: true,
        branchId: true,
        departmentId: true,
        divisionId: true,
        unitId: true,
      },
    });

    const scopes: string[] = [];
    if (approver?.branchId) scopes.push("org");
    if (approver?.departmentId) scopes.push("department");
    if (approver?.divisionId) scopes.push("division");
    if (approver?.unitId) scopes.push("unit");

    if (!isAdmin && !approver) {
      return NextResponse.json({ ok: true, data: [], scopes });
    }

    let where: any = { status: "PENDING" };

    if (!isAdmin) {
      const assigned = await prisma.leaveEmployeeApprover.findMany({
        where: { approverId: approver!.id },
        select: { employeeId: true },
      });

      const assignedEmployeeIds = assigned.map((x) => x.employeeId);
      where = {
        status: "PENDING",
        OR: [
          { approverId: approver!.id },
          assignedEmployeeIds.length > 0
            ? { employeeId: { in: assignedEmployeeIds } }
            : { employeeId: "__none__" },
        ],
      };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        approver: {
          select: {
            id: true,
            prefix: true,
            firstNameTh: true,
            lastNameTh: true,
            empNo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const employeeIds = Array.from(new Set(leaves.map((l) => l.employeeId)));
    const { data: employees, error: empErr } = await supabaseAdmin
      .from("employees")
      .select(
        "id, employee_code, first_name_th, last_name_th, employee_photo_url, branch_id, department_id, division_id, unit_id, branches(branch_name), departments(department_name), divisions(division_name), units(unit_name), positions(position_level)"
      )
      .in("id", employeeIds);

    if (empErr) {
      console.error("SUPABASE_EMP_QUERY_ERROR:", empErr);
      return NextResponse.json({ error: "employee lookup failed" }, { status: 500 });
    }

    const empMap = new Map<string, any>();
    for (const e of employees || []) empMap.set(e.id, e);

    let mapped = leaves.map((l) => {
      const e = empMap.get(l.employeeId);
      const empNo = e?.employee_code || "";
      return {
        id: l.id,
        userId: 0,
        approverId: l.approverId,
        my: l.approverId === approver?.id,
        kind: l.kind,
        startDate: l.startDate,
        endDate: l.endDate,
        reason: l.reason,
        status: l.status,
        approverReason: l.approverReason,
        approverSignature: l.approverSignature,
        createdAt: l.createdAt,
        attachmentUrl: l.attachmentUrl,
        user: {
          name: `${e?.first_name_th || ""} ${e?.last_name_th || ""}`.trim(),
          employee: {
            id: 0,
            empNo,
            firstName: e?.first_name_th || "",
            lastName: e?.last_name_th || "",
            org: (e?.branches as any)?.branch_name || "",
            department: (e?.departments as any)?.department_name || "",
            division: (e?.divisions as any)?.division_name || "",
            unit: (e?.units as any)?.unit_name || "",
            levelP: (e?.positions as any)?.position_level || "",
            photoUrl: e?.employee_photo_url || `/uploads/avatars/${empNo}.jpg`,
          },
        },
      };
    });

    mapped = mapped.filter((r) => {
      const emp = r.user.employee;
      if (filter.org && emp.org !== filter.org) return false;
      if (filter.department && emp.department !== filter.department) return false;
      if (filter.division && emp.division !== filter.division) return false;
      if (filter.unit && emp.unit !== filter.unit) return false;
      return true;
    });

    return NextResponse.json({ ok: true, data: mapped, scopes });
  } catch (error) {
    console.error("GET /api/approvals error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
};