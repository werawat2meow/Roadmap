import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getReportPeriodDate } from "../reportPeriod";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "";
  const month = url.searchParams.get("month") || "";
  const year = url.searchParams.get("year") || "";
  const evaluationType =
    type === "annual-evaluation"
      ? "Annual evaluation"
      : type === "promote"
      ? "Promote"
      : type.charAt(0).toUpperCase() + type.slice(1);

  const { data: typeRow, error: typeError } = await supabaseAdmin
    .from("rm_evaluation_types")
    .select("id")
    .eq("name", evaluationType)
    .limit(1)
    .maybeSingle();

  if (typeError) {
    console.error("Failed to load evaluation type", typeError);
    return NextResponse.json(
      { success: false, error: typeError.message },
      { status: 500 },
    );
  }

  if (!typeRow?.id) {
    return NextResponse.json({ success: true, data: [] });
  }

  const query = supabaseAdmin
    .from("rm_evaluations")
    .select(
      "id,employee_id,status,created_at,approved_at,totalScore,maxScore,evaluation_type_id,approved_by,evaluator_id,currentSalary,newSalary,new_designation,new_level,extra_data,evaluation_period,evaluation_period_continued,approval_note,salary_effective_month",
    )
    .eq("evaluation_type_id", typeRow.id)
    .in("status", ["Completed", "SalaryUpdated"]);

  const monthNum = Number(month);
  const yearNum = Number(year);
  const filterMonth = month && Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12;
  const filterYear = year && Number.isInteger(yearNum) && yearNum > 0;
  const reportQuery = query
    .order("created_at", { ascending: false })
    .order("id");
  // The period is stored as text; read every page before filtering its end date.
  const pageSize = 1000;
  const { data, error: evalError } = await reportQuery.range(0, pageSize - 1);

  if (evalError) {
    console.error("Failed to load evaluations", evalError);
    return NextResponse.json(
      { success: false, error: evalError.message },
      { status: 500 },
    );
  }

  let evalRows = data || [];
  for (let offset = pageSize; evalRows.length === offset; offset += pageSize) {
    const { data: page, error } = await reportQuery.range(offset, offset + pageSize - 1);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    evalRows.push(...(page || []));
  }
  if (filterMonth || filterYear) {
    evalRows = evalRows.filter((row) => {
      const date = getReportPeriodDate(row);
      return date && (!filterMonth || Number(date.slice(5, 7)) === monthNum) &&
        (!filterYear || Number(date.slice(0, 4)) === yearNum);
    });
  }
  evalRows.sort((a, b) => (getReportPeriodDate(b) || "").localeCompare(getReportPeriodDate(a) || ""));

  const employeeIds = [
    ...new Set([
      ...(evalRows || []).map((r: any) => r.employee_id),
      ...(evalRows || []).map((r: any) => r.evaluator_id),
    ]),
  ].filter(Boolean);
  if (employeeIds.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: employeeRows, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select(
      `
    id,
    employee_code,
    first_name_th,
    last_name_th,
    email,
    probation_status,
    probation_end_date,
    confirmation_date,
    branches(branch_name),
    departments(department_name),
    divisions(division_name),
    units(unit_name),
    positions(
      position_name,
      position_level_mappings(
        position_levels(
          level_code,
          level_name
        ),
        is_default
      )
    )
  `,
    )
    .in("id", employeeIds);

  if (employeeError) {
    console.error("Failed to load employee info", employeeError);
    return NextResponse.json(
      { success: false, error: employeeError.message },
      { status: 500 },
    );
  }

  const employeeMap = new Map(
    (employeeRows || []).map((emp: any) => [emp.id, emp]),
  );

  const approverIds = [
    ...new Set((evalRows || []).map((r: any) => r.approved_by).filter(Boolean)),
  ];

  const approverNameByUserId = new Map<string, string>();
  const requesterNameByUserId = new Map<string, string>();

  if (approverIds.length > 0) {
    const { data: approverUsers, error: approverUserError } =
      await supabaseAdmin
        .from("user_accounts")
        .select("id,employee_id")
        .in("id", approverIds);

    if (approverUserError) {
      console.error("Failed to load approvers", approverUserError);
      return NextResponse.json(
        { success: false, error: approverUserError.message },
        { status: 500 },
      );
    }

    const approverEmployeeIds = [
      ...new Set(
        approverUsers.map((user: any) => user.employee_id).filter(Boolean),
      ),
    ];

    const { data: approverEmployees, error: approverEmpError } =
      await supabaseAdmin
        .from("employees")
        .select("id, first_name_th, last_name_th")
        .in("id", approverEmployeeIds);

    if (approverEmpError) {
      console.error("Failed to load approver employee info", approverEmpError);
      return NextResponse.json(
        { success: false, error: approverEmpError.message },
        { status: 500 },
      );
    }

    const approverEmpMap = new Map(
      approverEmployees.map((emp: any) => [
        emp.id,
        `${emp.first_name_th || ""} ${emp.last_name_th || ""}`.trim(),
      ]),
    );

    approverUsers.forEach((user: any) => {
      const name = approverEmpMap.get(user.employee_id) || "ไม่ระบุ";
      approverNameByUserId.set(user.id, name);
    });
  }

  const requesterIds = [
    ...new Set(
      (evalRows || []).map((r: any) => r.evaluator_id).filter(Boolean),
    ),
  ];

  if (requesterIds.length > 0) {
    const { data: requesterUsers, error: requesterUserError } =
      await supabaseAdmin
        .from("user_accounts")
        .select("id,employee_id")
        .in("id", requesterIds);

    if (requesterUserError) {
      console.error("Failed to load requesters", requesterUserError);
      return NextResponse.json(
        { success: false, error: requesterUserError.message },
        { status: 500 },
      );
    }

    const requesterEmployeeIds = [
      ...new Set(
        requesterUsers.map((user: any) => user.employee_id).filter(Boolean),
      ),
    ];

    const { data: requesterEmployees, error: requesterEmpError } =
      await supabaseAdmin
        .from("employees")
        .select("id, first_name_th, last_name_th")
        .in("id", requesterEmployeeIds);

    if (requesterEmpError) {
      console.error(
        "Failed to load requester employee info",
        requesterEmpError,
      );
      return NextResponse.json(
        { success: false, error: requesterEmpError.message },
        { status: 500 },
      );
    }

    const requesterEmpMap = new Map(
      requesterEmployees.map((emp: any) => [
        emp.id,
        `${emp.first_name_th || ""} ${emp.last_name_th || ""}`.trim(),
      ]),
    );

    requesterUsers.forEach((user: any) => {
      const name = requesterEmpMap.get(user.employee_id) || "ไม่ระบุ";
      requesterNameByUserId.set(user.id, name);
    });
  }

  const mapped = (evalRows || []).map((item: any) => {
    const employee = employeeMap.get(item.employee_id) || {};
    const totalScore = item.totalScore ?? 0;
    const maxScore = item.maxScore ?? 100;
    const scorePercent =
      maxScore > 0 ? `${Math.round((totalScore / maxScore) * 100)}%` : "0%";
    const positionLevel =
      employee.positions?.position_level_mappings?.find(
        (m: any) => m?.is_default,
      )?.position_levels ||
      employee.positions?.position_level_mappings?.[0]?.position_levels;

    return {
      id: item.id,
      employeeId: employee.employee_code || item.employee_id,
      name: `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),
      email: employee.email || "",
      branch: employee.branches?.branch_name || "",
      department: employee.departments?.department_name || "",
      division: employee.divisions?.division_name || "",
      unit: employee.units?.unit_name || "",
      level: positionLevel?.level_code || positionLevel?.level_name || "",
      position: employee.positions?.position_name || "",
      requesterName: item.evaluator_id
        ? `${employeeMap.get(item.evaluator_id)?.first_name_th || ""} ${employeeMap.get(item.evaluator_id)?.last_name_th || ""}`.trim() ||
          "ไม่ระบุ"
        : "ไม่ระบุ",
      currentSalary: item.currentSalary ?? 0,
      newSalary: item.newSalary ?? 0,
      newDesignation: item.new_designation || "",
      newLevel: item.new_level || "",
      diff: (item.newSalary ?? 0) - (item.currentSalary ?? 0),
      evaluationType,
      latestDate: getReportPeriodDate(item),
      approvedAt: item.approved_at ?? null,
      score: totalScore,
      maxScore,
      scorePercent,
      status: item.status,
      approvalNote: item.approval_note ?? null,
      salaryEffectiveMonth: item.salary_effective_month ?? null,
      approvedByName: item.approved_by
        ? approverNameByUserId.get(item.approved_by) || "ไม่ระบุ"
        : "ไม่ระบุ",
      rawEmployeeId: item.employee_id,
      evaluationPeriodContinued: item.evaluation_period_continued ?? "",
      isProbationExtended: Boolean(
        item.evaluation_period_continued ||
        item.extra_data?.isProbationExtended,
      ),
      probationExtendPeriod:
        item.evaluation_period_continued ||
        item.extra_data?.probationExtendPeriod ||
        "",
      probationExtendedLateData:
        item.extra_data?.probationExtendedLateData ?? [],
      employeeProbationStatus: employee.probation_status ?? null,
      employeeProbationEndDate: employee.probation_end_date ?? null,
      employeeConfirmationDate: employee.confirmation_date ?? null,
      canConfirmProbation:
        evaluationType === "Probation" &&
        item.status === "Completed" &&
        !item.evaluation_period_continued &&
        !item.extra_data?.isProbationExtended &&
        !employee.confirmation_date,
    };
  });

  return NextResponse.json({ success: true, data: mapped });
}
