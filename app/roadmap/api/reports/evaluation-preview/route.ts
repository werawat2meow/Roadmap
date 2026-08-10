import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const formatDate = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const calculateGrade = (totalScore: number | null, maxScore: number | null) => {
  const percent =
    maxScore && maxScore > 0
      ? Math.round((Number(totalScore) / maxScore) * 100)
      : 0;
  if (percent >= 85) return "A";
  if (percent >= 75) return "B";
  if (percent >= 65) return "C";
  if (percent >= 50) return "D";
  return "F";
};

const normalizeRows = (rows: any[] | undefined, minRows = 6) => {
  const normalized = Array.isArray(rows)
    ? rows.map((row) => ({
        itemId: row.itemId ?? "",
        topic: row.topic ?? "",
        maxScore: row.maxScore ?? "",
        score: row.score ?? "",
        remark: row.note ?? row.remark ?? "",
      }))
    : [];

  while (normalized.length < minRows) {
    normalized.push({
      itemId: "",
      topic: "",
      maxScore: "",
      score: "",
      remark: "",
    });
  }

  return normalized;
};

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
    evaluation_type_id,
    totalScore,
    companyScore,
    departmentScore,
    expectationScore,
    examScore,
    maxScore,
    currentSalary,
    newSalary,
    new_designation,
    new_level,
    evaluation_period,
    evaluation_period_continued,
    special_compensation,
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

  const { data: roundRows, error: roundError } = await supabaseAdmin
    .from("rm_evaluations")
    .select("id")
    .eq("employee_id", evaluation.employee_id)
    .eq("evaluation_type_id", evaluation.evaluation_type_id)
    .lte("created_at", evaluation.created_at);

  const evaluationRound =
    Array.isArray(roundRows) && roundRows.length > 0
      ? roundRows.length
      : 1;

  if (roundError) {
    console.error("Failed to count evaluation round", roundError);
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select(
      `
      id,
      employee_code,
      first_name_th,
      last_name_th,
      nick_name,
      hire_date,
      branches(branch_name),
      departments(department_name),
      divisions(division_name),
      units(unit_name),
      positions(
        position_name,
        position_level_mappings(
          is_default,
          position_levels(
            level_code,
            level_name
          )
        )
      )
  `,
    )
    .eq("id", evaluation.employee_id)
    .single();
  const emp = employee as any;

  if (employeeError || !employee) {
    console.error("Failed to load employee for preview", employeeError);
    return NextResponse.json(
      { success: false, error: employeeError?.message || "No employee found" },
      { status: 500 },
    );
  }

  const extraData = evaluation.extra_data ?? {};

  const companyRows = normalizeRows(extraData.companyRows, 6);
  const departmentRows = normalizeRows(extraData.departmentRows, 6);
  const expectationRows = normalizeRows(extraData.expectationRows, 6);

  const categoryIds = Array.from(
    new Set(
      (evaluation.rm_evaluation_scores || [])
        .map((row: any) => row.category_item_id)
        .filter(Boolean),
    ),
  );

  const categoryMap = new Map<
    string,
    { topic: string; weight: string | number }
  >();
  if (categoryIds.length > 0) {
    const { data: categoryItems, error: categoryError } = await supabaseAdmin
      .from("rm_category_items")
      .select("id, topic, weight")
      .in("id", categoryIds);

    if (!categoryError && Array.isArray(categoryItems)) {
      categoryItems.forEach((item: any) => {
        categoryMap.set(item.id, {
          topic: item.topic || "",
          weight: item.weight ?? 0,
        });
      });
    }
  }

  const hasRowData = (row: any) =>
    Boolean(
      row.topic?.toString().trim() ||
      row.maxScore?.toString().trim() ||
      row.score?.toString().trim() ||
      row.remark?.toString().trim(),
    );

  const companyItems = companyRows
    .filter(hasRowData)
    .map((row: any, idx: number) => ({
      id: row.itemId || `${row.topic}-${idx}` || `company-${idx}`,
      topic: row.topic || categoryMap.get(row.itemId || "")?.topic || "",
      weight: row.maxScore ?? "",
      score: row.score ?? "",
      remark: row.remark || "",
    }));

  const departmentItems = departmentRows
    .filter(hasRowData)
    .map((row: any, idx: number) => ({
      id: row.itemId || `${row.topic}-${idx}` || `department-${idx}`,
      topic: row.topic || categoryMap.get(row.itemId || "")?.topic || "",
      weight: row.maxScore ?? "",
      score: row.score ?? "",
      remark: row.remark || "",
    }));

  const expectationItems = expectationRows
    .filter(hasRowData)
    .map((row: any, idx: number) => ({
      id: row.itemId || `${row.topic}-${idx}` || `expectation-${idx}`,
      topic: row.topic || categoryMap.get(row.itemId || "")?.topic || "",
      weight: row.maxScore ?? "",
      score: row.score ?? "",
      remark: row.remark || "",
    }));

  const formatMonthYear = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    });
  };

  // const scoreRows = (evaluation.rm_evaluation_scores || []).map((row: any) => {
  //   const meta = categoryMap.get(row.category_item_id) || {
  //     topic: "",
  //     weight: "",
  //   };
  //   return {
  //     topic: meta.topic || row.category_item_id || "",
  //     weight: meta.weight ?? "",
  //     score: row.score ?? "",
  //     remark: row.remark ?? "",
  //     isIncluded: row.is_included ?? false,
  //   };
  // });

  const positionLevel =
    emp.positions?.position_level_mappings?.find((m: any) => m?.is_default)
      ?.position_levels ||
    emp.positions?.position_level_mappings?.[0]?.position_levels;

  const positionName = emp.positions?.position_name || "";
  const level = positionLevel?.level_code || positionLevel?.level_name || "";

  const evalTypeRow = evaluation.rm_evaluation_types as
    | { name?: string }
    | Array<{ name?: string }>
    | null
    | undefined;

  const evaluationType = Array.isArray(evalTypeRow)
    ? (evalTypeRow[0]?.name ?? "")
    : (evalTypeRow?.name ?? "");
  const payload = {
    id: emp.employee_code || evaluation.employee_id,
    employeeId: evaluation.employee_id,
    employeeCode: emp.employee_code || "",
    employeeName:
      `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),
    nickName: employee.nick_name || "",
    position: positionName,
    level,
    department: emp.departments?.department_name || "",
    division: emp.divisions?.division_name || "",
    unit: emp.units?.unit_name || "",
    company: emp.branches?.branch_name || "",
    startDate: formatDate(employee.hire_date),
    evaluationType,
    status: evaluation.status || "",
    evaluationPeriod:
      evaluation.evaluation_period ?? extraData.evaluationPeriod ?? "",
    evaluationPeriodContinued:
      evaluation.evaluation_period_continued ??
      extraData.evaluationPeriodContinued ??
      "",
    newDesignation:
      evaluation.new_designation ?? extraData.newDesignation ?? "",
    newLevel: evaluation.new_level ?? extraData.newLevel ?? "",
    specialCompensation:
      evaluation.special_compensation ?? extraData.specialCompensation ?? "",
    companyItems,
    departmentItems,
    expectationItems,
    summaryData: extraData.summaryData || {},
    disciplineData: extraData.disciplineData || {},
    companyScore: evaluation.companyScore ?? 0,
    departmentScore: evaluation.departmentScore ?? 0,
    expectationScore: evaluation.expectationScore ?? 0,
    totalScore: evaluation.totalScore ?? 0,
    examScore: evaluation.examScore ?? 0,
    maxScore: evaluation.maxScore ?? 0,
    grade: calculateGrade(evaluation.totalScore, evaluation.maxScore),
    currentSalary: evaluation.currentSalary ?? "",
    newSalary: evaluation.newSalary ?? "",
    managerComment: evaluation.managerComment || "",
    evaluationRound,
    submittedMonth: formatMonthYear(evaluation.created_at),
  };
  return NextResponse.json({ success: true, data: payload });
}
