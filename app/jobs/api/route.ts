// app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get("branch_id");

    const today = new Date().toISOString().split("T")[0];

    const { data: openJobs, error: openError } = await supabase
      .from("recruit_job_open")
      .select(`
        id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        opening_count,
        positions(position_name),
        branches(branch_name),
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
    const branchsIds = [...new Set(openJobs.map((j) => j.branch_id))];
    
    // job description
    let descQuery = supabase
      .from("recruit_job_description")
      .select(`
        positions_id,
        branch_id,
        salary_min,
        salary_max,
        workLocation
      `)
      .in("positions_id", positionIds);

    if (branchId) {
      descQuery = descQuery.eq("branch_id", branchId);
    }else{
      descQuery = descQuery.in("branch_id", branchsIds);
    }

    const { data: descriptions, error: descError } = await descQuery;
    
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
          (d) => d.positions_id === job.position_id &&
                d.branch_id === job.branch_id
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
          branch_id: desc.branch_id,
          job_name:job?.positions?.position_name ?? "",
          job_to_language:lang?.job_to_language ?? {},
          branch_name:job?.branches?.branch_name ?? "",
          workLocation:desc.workLocation ?? "",
          salary_min:desc.salary_min,
          salary_max:desc.salary_max,
          opening_count:job.opening_count,
          urgent:job.urgent,
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