// app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: openJobs, error: openError } = await supabase
      .from("recruit_job_open")
      .select(`
        id,
        position_id,
        opening_count,
        urgent
      `)
      .eq("status", true)
      .lte("start_date", today)
      .gte("end_date", today);

    if (openError) throw openError;

    if (!openJobs?.length) {
      return NextResponse.json([]);
    }

    const positionIds = openJobs.map((j) => j.position_id);

    // job description
    const { data: descriptions, error: descError } = await supabase
      .from("recruit_job_description")
      .select(`
        positions_id,
        branch_id,
        salary_min,
        salary_max,
        workLocation
      `)
      .in("positions_id", positionIds);

    if (descError) throw descError;

    if (!descriptions?.length) {
      return NextResponse.json([]);
    }

    const validPositionIds = descriptions.map(
      (d) => d.positions_id
    );

    // ชื่อหลายภาษา
    const { data: languages, error: langError } = await supabase
      .from("recruit_job_mix_language")
      .select(`
        position_id,
        job_to_language
      `)
      .in("position_id", validPositionIds);
    
    if (langError) throw langError;

    const branchIds = [
      ...new Set(
        descriptions
          .map((d) => d.branch_id)
          .filter(Boolean)
      ),
    ];

    const { data: branches, error: branchError } = await supabase
      .from("branches")
      .select(`
        id,
        branch_name
      `)
      .in("id", branchIds);

    if (branchError) throw branchError;

    const jobs = openJobs
      .map((job) => {
        
        const desc = descriptions.find(
          (d) => d.positions_id === job.position_id
        );

        // ไม่มี description ไม่แสดง
        if (!desc) return null;

        const lang = languages?.find(
          (l) => l.position_id === job.position_id
        );

        const branch = branches?.find(
          (b) => b.id === desc.branch_id
        );

        return {
          id: job.id,

          job_to_language:
            lang?.job_to_language ?? {},

          branch_name:
            branch?.branch_name ?? "",

          workLocation:
            desc.workLocation ?? "",

          salary_min:
            desc.salary_min,

          salary_max:
            desc.salary_max,

          opening_count:
            job.opening_count,

          urgent:
            job.urgent,
        };
      })
      .filter(Boolean);
      
    return NextResponse.json(jobs);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load jobs" },
      { status: 500 }
    );
  }
}