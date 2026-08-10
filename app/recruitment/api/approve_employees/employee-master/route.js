import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const branchId = searchParams.get("branch_id");
    const departmentId = searchParams.get("department_id");
    const divisionId = searchParams.get("division_id");
    const unitId = searchParams.get("unit_id");
    const positionId = searchParams.get("position_id");

    let data = [];
    let error = null;

    // =========================================================
    // Branch
    // =========================================================
    if (type === "branches") {
      const result = await supabaseAdmin
        .from("branches")
        .select("id, branch_name")
        .order("branch_name", { ascending: true });

      data = result.data || [];
      error = result.error;
    }

    // =========================================================
    // Department
    // branch_departments
    // branch_id -> department_id
    // =========================================================
    else if (type === "departments") {
      if (!branchId) {
        return NextResponse.json(
          { message: "branch_id is required" },
          { status: 400 }
        );
      }

      const result = await supabaseAdmin
        .from("branch_departments")
        .select(`
          department_id,
          departments (
            id,
            department_name
          )
        `)
        .eq("branch_id", branchId);

      if (result.error) {
        error = result.error;
      } else {
        data = (result.data || [])
          .map((item) => item.departments)
          .filter(Boolean)
          .filter(
            (item, index, self) =>
              index === self.findIndex((x) => x.id === item.id)
          )
          .sort((a, b) =>
            a.department_name.localeCompare(
              b.department_name,
              "th"
            )
          );
      }
    }

    // =========================================================
    // Division
    // department_id -> divisions.department_id
    // =========================================================
    else if (type === "divisions") {
      if (!departmentId) {
        return NextResponse.json(
          { message: "department_id is required" },
          { status: 400 }
        );
      }

      const result = await supabaseAdmin
        .from("divisions")
        .select("id, division_name")
        .eq("department_id", departmentId)
        .order("division_name", { ascending: true });

      data = result.data || [];
      error = result.error;
    }

    // =========================================================
    // Unit
    // division_id -> units.division_id
    // =========================================================
    else if (type === "units") {
      if (!divisionId) {
        return NextResponse.json(
          { message: "division_id is required" },
          { status: 400 }
        );
      }

      const result = await supabaseAdmin
        .from("units")
        .select("id, unit_name")
        .eq("division_id", divisionId)
        .order("unit_name", { ascending: true });

      data = result.data || [];
      error = result.error;
    }

    // =========================================================
    // Position
    // unit_positions
    // unit_id -> position_id
    // =========================================================
    else if (type === "positions") {
      if (!unitId) {
        return NextResponse.json(
          { message: "unit_id is required" },
          { status: 400 }
        );
      }

      const result = await supabaseAdmin
        .from("unit_positions")
        .select(`
          position_id,
          positions (
            id,
            position_name
          )
        `)
        .eq("unit_id", unitId);

      if (result.error) {
        error = result.error;
      } else {
        data = (result.data || [])
          .map((item) => item.positions)
          .filter(Boolean)
          .filter(
            (item, index, self) =>
              index === self.findIndex((x) => x.id === item.id)
          )
          .sort((a, b) =>
            a.position_name.localeCompare(
              b.position_name,
              "th"
            )
          );
      }
    }

    // =========================================================
    // Position Levels
    // =========================================================
    else if (type === "position_levels") {
        if (!positionId) {
            return NextResponse.json(
                { message: "position_id is required" },
                { status: 400 }
            );
        }

        const result = await supabaseAdmin
            .from("position_level_mappings")
            .select(`
            position_level_id,
            position_levels (
                id,
                level_code,
                sort_order
            )
            `)
            .eq("position_id", positionId);
        
        if (result.error) {
            error = result.error;
        } else {
            data = (result.data || [])
            .map((item) => item.position_levels)
            .filter(Boolean)
            .sort(
                (a, b) =>
                Number(a.sort_order || 0) -
                Number(b.sort_order || 0)
            );
        }
    }

    // =========================================================
    // Employment Types
    // =========================================================
    else if (type === "employment_types") {
      const result = await supabaseAdmin
        .from("employment_types")
        .select("id, type_name")
        .eq("status", "active")
        .order("type_name", { ascending: true });

      data = result.data || [];
      error = result.error;
    }

    // =========================================================
    // Roles
    // =========================================================
    else if (type === "roles") {
      const result = await supabaseAdmin
        .from("roles")
        .select("id, role_name")
        .eq("is_system", false)
        .order("role_name", { ascending: true });

      data = result.data || [];
      error = result.error;
    }

    else {
      return NextResponse.json(
        { message: "Invalid type" },
        { status: 400 }
      );
    }

    if (error) {
      console.error("employee-master error:", error);

      return NextResponse.json(
        {
          message: error.message || "Load master data failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error("employee-master exception:", error);

    return NextResponse.json(
      {
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}