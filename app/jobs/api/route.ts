// app/api/jobs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const keyword = searchParams.get("keyword")?.trim() ?? "";
    const branchId = searchParams.get("branch_id") ?? "";
    const urgent = searchParams.get("urgent");
    const departmentId = searchParams.get("department_id");
    
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("v_recruit_job_open_detail")
      .select("*")
      .eq("status", true)
      .lte("start_date", today)
      .gte("end_date", today);

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (urgent === "true") {
      query = query.eq("urgent", true);
    }

    if (keyword) {
      const isNumber = !isNaN(Number(keyword));

      const filters = [
        `branch_name.ilike.%${keyword}%`,
        `position_name.ilike.%${keyword}%`,
        `position_level.ilike.%${keyword}%`,
        `salary_note.ilike.%${keyword}%`,
      ];

      if (isNumber) {
        filters.push(`salary_min.eq.${Number(keyword)}`);
        filters.push(`salary_max.eq.${Number(keyword)}`);
      }

      query = query.or(filters.join(","));
    }

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    query = query
      .order("urgent", { ascending: false })
      .order("updated_at", { ascending: false });

    const { data: jobs, error } = await query;
    
    if (error) throw error;

    // -------------------------------
    // ดึง Requirement
    // -------------------------------

    const jobDescriptionIds = [
      ...new Set(
        jobs
          .map((j) => j.job_description_id)
          .filter(Boolean)
      ),
    ];

    let requirementMap: Record<number, any[]> = {};

    if (jobDescriptionIds.length) {
      const { data: requirements, error: requirementError } = await supabase
        .from("recruit_job_description_requirements")
        .select(`
          job_description_id,
          requirement_text
        `)
        .eq("showpage", true)
        .in("job_description_id", jobDescriptionIds)
        .order("sort_order", { ascending: true });

      if (requirementError) throw requirementError;

      requirementMap = (requirements ?? []).reduce((acc, item) => {
        if (!acc[item.job_description_id]) {
          acc[item.job_description_id] = [];
        }

        acc[item.job_description_id].push(item.requirement_text);

        return acc;
      }, {} as Record<number, any[]>);
    }

    const result = jobs.map((job) => ({
      ...job,
      requirements: requirementMap[job.job_description_id] ?? [],
    }));

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json(
      {
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}