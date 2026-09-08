import { NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const token = await getTokenPayload();
  const role = token?.role;
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "MASTER_ADMIN" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: branches }, { data: departments }, { data: divisions }, { data: units }] =
    await Promise.all([
      supabaseAdmin.from("branches").select("id, branch_name").order("branch_name"),
      supabaseAdmin.from("departments").select("id, department_name").order("department_name"),
      supabaseAdmin.from("divisions").select("id, division_name").order("division_name"),
      supabaseAdmin.from("units").select("id, unit_name").order("unit_name"),
    ]);

  return NextResponse.json({
    organizations: (branches ?? []).map((b: any) => ({ id: b.id, name: b.branch_name })),
    departments: (departments ?? []).map((d: any) => ({ id: d.id, name: d.department_name })),
    divisions: (divisions ?? []).map((d: any) => ({ id: d.id, name: d.division_name })),
    units: (units ?? []).map((u: any) => ({ id: u.id, name: u.unit_name })),
  });
}