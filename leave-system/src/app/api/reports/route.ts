import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTokenPayload } from "@/lib/authToken";

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenPayload();
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const org = searchParams.get("org");
    const dept = searchParams.get("dept");
    const division = searchParams.get("division");
    const unit = searchParams.get("unit");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const showConfirmed = searchParams.get("showConfirmed") === "true";

    const where: any = {
      status: "APPROVED",
      hrConfirmed: showConfirmed,
    };

    if (dateFrom || dateTo) {
      where.AND = [];
      if (dateFrom) where.AND.push({ startDate: { gte: new Date(dateFrom) } });
      if (dateTo) where.AND.push({ endDate: { lte: new Date(dateTo) } });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        approver: {
          select: {
            prefix: true,
            firstNameTh: true,
            lastNameTh: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const employeeIds = Array.from(new Set(leaves.map((leave) => leave.employeeId))).filter(Boolean);
    const employeeRows =
      employeeIds.length > 0
        ? await supabaseAdmin
            .from("employees")
            .select(
              `id, employee_code, first_name_th, last_name_th, branch_id, department_id, division_id, unit_id,
               branches(branch_name), departments(department_name), divisions(division_name), units(unit_name)`
            )
            .in("id", employeeIds)
        : { data: [], error: null };

    const employees = (employeeRows.data ?? []) as any[];
    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));

    const formattedLeaves = leaves
      .map((leave) => {
        const emp = employeeMap.get(leave.employeeId);
        const orgName = emp?.branches?.branch_name ?? "";
        const deptName = emp?.departments?.department_name ?? "";
        const divisionName = emp?.divisions?.division_name ?? "";
        const unitName = emp?.units?.unit_name ?? "";

        return {
          id: leave.id.toString(),
          empNo: emp?.employee_code ?? "",
          name: `${emp?.first_name_th ?? ""} ${emp?.last_name_th ?? ""}`.trim() || "",
          org: orgName,
          dept: deptName,
          division: divisionName,
          unit: unitName,
          leaveType: leave.kind,
          reason: leave.reason || "",
          from: leave.startDate.toISOString().split("T")[0],
          to: leave.endDate.toISOString().split("T")[0],
          levelP: "",
          status: leave.status.toLowerCase(),
          hrConfirmed: leave.hrConfirmed,
          approverName: leave.approver
            ? `${leave.approver.prefix || ""}${leave.approver.firstNameTh} ${leave.approver.lastNameTh}`.trim()
            : "ยังไม่ระบุผู้อนุมัติ",
        };
      })
      .filter((item) => {
        if (org && item.org !== org) return false;
        if (dept && item.dept !== dept) return false;
        if (division && item.division !== division) return false;
        if (unit && item.unit !== unit) return false;
        return true;
      });

    return NextResponse.json({ ok: true, data: formattedLeaves });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}