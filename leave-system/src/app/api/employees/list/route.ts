import { NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const token = await getTokenPayload();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [supaResult, approverList] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select(`
        id, employee_code, first_name_th, last_name_th,
        branches(branch_name),
        departments(department_name),
        positions(position_name)
      `)
      .eq("status", "active")
      .order("employee_code"),
    prisma.leaveApprover.findMany({ select: { employeeId: true } }),
  ]);

  if (supaResult.error) return NextResponse.json({ error: supaResult.error.message }, { status: 500 });

  const approverSet = new Set(approverList.map((a) => a.employeeId));
  const employees = (supaResult.data ?? []).map((e) => ({
    ...e,
    isApprover: approverSet.has(e.id),
  }));

  return NextResponse.json(employees);
}