import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {

    const { data: openBranchJobs, error: openBranchError } = await supabase
      .from("v_recruit_job_open_branch_count")
      .select(`*`);
        
    if (openBranchError) throw openBranchError;

    if (!openBranchJobs?.length) {
      return NextResponse.json([]);
    }

    return NextResponse.json(openBranchJobs);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load jobs" },
      { status: 500 }
    );
  }
}