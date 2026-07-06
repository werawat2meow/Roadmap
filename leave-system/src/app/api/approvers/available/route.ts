import { NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const token = await getTokenPayload();
    if (!token?.employee_id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const employeeId = token.employee_id;

    // หาผู้อนุมัติที่ผูกกับพนักงานโดยตรงจาก LeaveEmployeeApprover
    const assignments = await prisma.leaveEmployeeApprover.findMany({
      where: { employeeId },
      include: {
        approver: {
          select: {
            id: true,
            prefix: true,
            firstNameTh: true,
            lastNameTh: true,
            empNo: true,
            email: true,
          },
        },
      },
    });

    let approvers: typeof assignments[number]["approver"][] = [];

    if (assignments.length > 0) {
      approvers = assignments.map((a) => a.approver);
    } else {
      // fallback: ดึงผู้อนุมัติที่อยู่ในสังกัดเดียวกัน หรือ allowCrossOrg = true
      const { data: emp } = await supabaseAdmin
        .from("employees")
        .select("branch_id")
        .eq("id", employeeId)
        .maybeSingle();

      const branchId = emp?.branch_id as string | null;

      const where: any = branchId
        ? { OR: [{ branchId }, { allowCrossOrg: true }] }
        : { allowCrossOrg: true };

      approvers = await prisma.leaveApprover.findMany({
        where,
        orderBy: [{ firstNameTh: "asc" }],
        select: {
          id: true,
          prefix: true,
          firstNameTh: true,
          lastNameTh: true,
          empNo: true,
          email: true,
        },
      });
    }

    const result = approvers.map((a) => ({
      id: a.id,
      name: `${a.prefix ?? ""}${a.firstNameTh} ${a.lastNameTh}`,
      empNo: a.empNo,
      department: "",
      division: "",
      unit: "",
      level: "",
      email: a.email,
      label: `${a.prefix ?? ""}${a.firstNameTh} ${a.lastNameTh}`,
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /approvers/available error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
