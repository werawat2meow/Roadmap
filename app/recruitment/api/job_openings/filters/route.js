import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const [
      branchesRes,
      departmentsRes,
      divisionsRes,
      unitsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("branches")
        .select("id, branch_name")
        .eq("status", "active")
        .order("branch_name"),

      supabaseAdmin
        .from("departments")
        .select("id, department_name")
        .eq("status", "active")
        .order("department_name"),

      supabaseAdmin
        .from("divisions")
        .select("id, division_name")
        .eq("status", "active")
        .order("division_name"),

      supabaseAdmin
        .from("units")
        .select("id, unit_name")
        .eq("status", "active")
        .order("unit_name"),
    ]);

    const errors = [
      branchesRes.error,
      departmentsRes.error,
      divisionsRes.error,
      unitsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: errors[0].message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        branches: (branchesRes.data ?? []).map((item) => ({
          id: item.id,
          branch_name: item.branch_name,
        })),

        departments: (departmentsRes.data ?? []).map((item) => ({
          id: item.id,
          department_name: item.department_name,
        })),

        divisions: (divisionsRes.data ?? []).map((item) => ({
          id: item.id,
          division_name: item.division_name,
        })),

        units: (unitsRes.data ?? []).map((item) => ({
          id: item.id,
          unit_name: item.unit_name,
        })),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}