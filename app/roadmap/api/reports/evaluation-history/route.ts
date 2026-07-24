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
    .select("id,employee_id,status,created_at,totalScore,evaluation_type_id")
    .eq("evaluation_type_id", typeRow.id)
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
      departments(department_name),
      divisions(division_name),
      units(unit_name),
      positions(position_level)
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

  const mapped = (evalRows || []).map((item: any) => {
    const employee = employeeMap.get(item.employee_id) || {};
    const totalScore = item.totalScore ?? 0;
    const maxScore = item.maxScore ?? 100;
    const scorePercent = maxScore > 0 
    ? `${Math.round((totalScore / maxScore) * 100)}%`
      : "0%";

    return {
      id: item.id,
      employeeId: item.employee_id,
      name: `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),
      email: employee.email || "",
      department: employee.departments?.department_name || "",
      division: employee.divisions?.division_name || "",
      unit: employee.units?.unit_name || "",
      level: employee.positions?.position_level || "",
      evaluationType,
      latestDate: item.created_at,
      score: totalScore,
      maxScore,
      scorePercent,
      status: item.status,
    };
  });

  return NextResponse.json({ success: true, data: mapped });
}
