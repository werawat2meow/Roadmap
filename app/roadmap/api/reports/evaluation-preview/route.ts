import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const evaluationId = url.searchParams.get("id");

  if (!evaluationId) {
    return NextResponse.json(
      { success: false, error: "Missing evaluation id" },
      { status: 400 },
    );
  }

  const { data: evaluation, error: evaluationError } = await supabaseAdmin
    .from("rm_evaluations")
    .select(
      `
      id,
      employee_id,
      status,
      created_at,
      totalScore,
      companyScore,
      departmentScore,
      expectationScore,
      examScore,
      maxScore,
      currentSalary,
      newSalary,
      managerComment,
      extra_data,
      rm_evaluation_types(name),
      rm_evaluation_scores(category_item_id, score, remark, is_included)
    `,
    )
    .eq("id", evaluationId)
    .single();

  if (evaluationError || !evaluation) {
    console.error("Failed to load evaluation preview", evaluationError);
    return NextResponse.json(
      {
        success: false,
        error: evaluationError?.message || "No evaluation found",
      },
      { status: 500 },
    );
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select(
      `
      id,
      first_name_th,
      last_name_th,
      email,
      departments(department_name),
      divisions(division_name),
      units(unit_name),
      positions(position_level)
    `,
    )
    .eq("id", evaluation.employee_id)
    .single();

  if (employeeError || !employee) {
    console.error("Failed to load employee for preview", employeeError);
    return NextResponse.json(
      { success: false, error: employeeError?.message || "No employee found" },
      { status: 500 },
    );
  }

  const departmentName = employee.departments?.[0]?.department_name || "";
  const divisionName = employee.divisions?.[0]?.division_name || "";
  const unitName = employee.units?.[0]?.unit_name || "";
  const positionLevel = employee.positions?.[0]?.position_level || "";

  const payload = {
    id: evaluation.id,
    employeeId: evaluation.employee_id,
    employeeName:
      `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),
    email: employee.email,
    department: departmentName,
    division: divisionName,
    unit: unitName,
    level: positionLevel,
    status: evaluation.status,
    createdAt: evaluation.created_at,
    totalScore: evaluation.totalScore,
    companyScore: evaluation.companyScore,
    departmentScore: evaluation.departmentScore,
    expectationScore: evaluation.expectationScore,
    examScore: evaluation.examScore,
    maxScore: evaluation.maxScore,
    currentSalary: evaluation.currentSalary,
    newSalary: evaluation.newSalary,
    managerComment: evaluation.managerComment,
    extraData: evaluation.extra_data,
    scoreRows: evaluation.rm_evaluation_scores || [],
  };

  return NextResponse.json({ success: true, data: payload });
}
