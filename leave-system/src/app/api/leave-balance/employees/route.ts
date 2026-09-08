import { getApprovalViewerContext } from "@/lib/approval-scope";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTokenPayload } from "@/lib/authToken";
import { NextRequest, NextResponse } from "next/server";

type EmployeeRow = {
  id: string;
  employee_code: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  branches?: { branch_name: string | null }[] | null;
  departments?: { department_name: string | null }[] | null;
  divisions?: { division_name: string | null }[] | null;
  units?: { unit_name: string | null }[] | null;
  positions?: { position_level: string | null }[] | null;
};

function containsCI(value: string, q: string) {
  return value.toLowerCase().includes(q.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenPayload();
    const email = token?.username ?? (token as any)?.email;
    const role = String((token as any)?.role || (token as any)?.role_code || "").toUpperCase();
    const empNo = String((token as any)?.employee_code || "").trim() || undefined;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getApprovalViewerContext(email, role, empNo);
    const { searchParams } = new URL(req.url);
    const org = (searchParams.get("org") || "").trim();
    const department = (searchParams.get("department") || "").trim();
    const division = (searchParams.get("division") || "").trim();
    const unit = (searchParams.get("unit") || "").trim();
    const q = (searchParams.get("q") || "").trim();

    const { data: employees, error } = await supabaseAdmin
      .from("employees")
      .select(
        `
        id,
        employee_code,
        first_name_th,
        last_name_th,
        branches(branch_name),
        departments(department_name),
        divisions(division_name),
        units(unit_name),
        positions(position_level)
      `
      )
      .eq("status", "active")
      .order("employee_code", { ascending: true });

    if (error) {
      console.error("SUPABASE_EMP_QUERY_ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const baseEmployees = (employees ?? []) as EmployeeRow[];

    const mappedEmployees = baseEmployees.map((item) => ({
      id: item.id,
      empNo: item.employee_code ?? "",
      firstName: item.first_name_th ?? "",
      lastName: item.last_name_th ?? "",
      org: item.branches?.[0]?.branch_name ?? null,
      department: item.departments?.[0]?.department_name ?? null,
      division: item.divisions?.[0]?.division_name ?? null,
      unit: item.units?.[0]?.unit_name ?? null,
      levelP: item.positions?.[0]?.position_level ?? null,
      photoUrl: undefined,
    }));


	const scopedEmployees =
	ctx.viewerMode === "ADMIN"
		? mappedEmployees
		: mappedEmployees.filter((e) => ctx.assignedEmployeeIds.includes(e.id));

	const options = {
	org: Array.from(new Set(scopedEmployees.map((item) => item.org).filter(Boolean))).sort() as string[],
	department: Array.from(new Set(scopedEmployees.map((item) => item.department).filter(Boolean))).sort() as string[],
	division: Array.from(new Set(scopedEmployees.map((item) => item.division).filter(Boolean))).sort() as string[],
	unit: Array.from(new Set(scopedEmployees.map((item) => item.unit).filter(Boolean))).sort() as string[],
	};

    const filtered = scopedEmployees.filter((employee) => {
      if (org && employee.org !== org) return false;
      if (department && employee.department !== department) return false;
      if (division && employee.division !== division) return false;
      if (unit && employee.unit !== unit) return false;

      if (!q) return true;

      const haystack = [
        employee.empNo || "",
        employee.firstName || "",
        employee.lastName || "",
        employee.org || "",
        employee.department || "",
        employee.division || "",
        employee.unit || "",
        employee.levelP || "",
      ].join(" ");

      return containsCI(haystack, q);
    });

    return NextResponse.json({
      ok: true,
      viewerMode: ctx.viewerMode,
      scopes: ctx.scopes,
      options,
      data: filtered,
    });
  } catch (error: any) {
    console.error("GET /api/leave-balance/employees error:", error);
    return NextResponse.json(
      { error: error?.message || "internal_error" },
      { status: 500 }
    );
  }
}