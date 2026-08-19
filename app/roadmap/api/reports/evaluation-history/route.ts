import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "";
  const evaluationType =
    type === "promote"
      ? "Promote"
      : type.charAt(0).toUpperCase() + type.slice(1);

  const { data: typeRow, error: typeError } = await supabaseAdmin
    .from("rm_evaluation_types")
    .select("id")
    .eq("name", evaluationType)
    .limit(1)
    .single();

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

  const { data: evalRows, error: evalError } = await supabaseAdmin
    .from("rm_evaluations")
    .select(
      "id,employee_id,status,created_at,totalScore,maxScore,evaluation_type_id,approved_by",
    )
    .eq("evaluation_type_id", typeRow.id)
    .eq("status", "Completed")
    .order("created_at", { ascending: false });

  if (evalError) {
    console.error("Failed to load evaluations", evalError);
    return NextResponse.json(
      { success: false, error: evalError.message },
      { status: 500 },
    );
  }

  const employeeIds = [
    ...new Set((evalRows || []).map((r: any) => r.employee_id)),
  ];
  if (employeeIds.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: employeeRows, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select(
      `
    id,
    first_name_th,
    last_name_th,
    email,
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
      employeeId: item.employee_id,
      name: `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),
      email: employee.email || "",
      branch: employee.branches?.branch_name || "",
      department: employee.departments?.department_name || "",
      division: employee.divisions?.division_name || "",
      unit: employee.units?.unit_name || "",
      level: positionLevel?.level_code || positionLevel?.level_name || "",
      evaluationType,
      latestDate: item.created_at,
      score: totalScore,
      maxScore,
      scorePercent,
      status: item.status,
      approvedByName: item.approved_by
        ? approverNameByUserId.get(item.approved_by) || "ไม่ระบุ"
        : "ไม่ระบุ",
    };
  });

  return NextResponse.json({ success: true, data: mapped });
}
