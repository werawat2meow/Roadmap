import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("rm_evaluations")
    .insert([
      {
        employee_id: body.employeeId,
        evaluator_id: body.evaluatorId,
        evaluation_type_id: body.evaluationTypeId,
        status: body.status,
        company_score: body.companyScore,
        department_score: body.departmentScore,
        expectation_score: body.expectationScore,
        total_score: body.totalScore,
        current_salary: body.currentSalary,
        new_salary: body.newSalary,
        manager_comment: body.managerComment,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data?.[0] ?? null }, { status: 201 });
}