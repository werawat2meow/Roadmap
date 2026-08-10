import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reviewerId = url.searchParams.get("reviewerId");
  const status = url.searchParams.get("status");
  const evaluationId = url.searchParams.get("evaluationId");

  if (!reviewerId) {
    return NextResponse.json(
      { success: false, error: "Missing reviewerId query parameter" },
      { status: 400 },
    );
  }

  let query = supabaseAdmin
    .from("rm_evaluations")
    .select(
      `id,employee_id,status,created_at,totalScore,companyScore,departmentScore,expectationScore,examScore,maxScore,managerComment,evaluation_type_id,extra_data,currentSalary,newSalary,evaluation_period,evaluation_period_continued,special_compensation,new_designation,new_level,rm_evaluation_types(name),rm_evaluation_scores(category_item_id,score,remark,is_included),rm_evaluation_reviewers!inner(manager_id)`,
    )
    .eq("rm_evaluation_reviewers.manager_id", reviewerId);

  if (status) {
    query = query.eq("status", status);
  }

  if (evaluationId) {
    query = query.eq("id", evaluationId);
  }

  const { data: evaluationRecords, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("Failed to load evaluatemgr history", error, reviewerId);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  const records = evaluationRecords || [];
  const employeeIds = [
    ...new Set(records.map((record: any) => record.employee_id)),
  ];

  let employeeRows: any[] = [];
  if (employeeIds.length > 0) {
    const { data: rows, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, first_name_th, last_name_th, employee_code")
      .in("id", employeeIds);

    if (employeeError) {
      console.error("Failed to load employee names", employeeError);
    } else {
      employeeRows = rows || [];
    }
  }

  const employeeMap = new Map(
    employeeRows.map((employee: any) => [employee.id, employee]),
  );

  const formattedRecords = records.map((item: any) => ({
    ...item,
    employee: employeeMap.get(item.employee_id) ?? null,
    evaluationType: item.rm_evaluation_types?.name ?? null,
  }));

  return NextResponse.json({ success: true, data: formattedRecords });
}
