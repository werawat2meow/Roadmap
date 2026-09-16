import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const positionId = searchParams.get("position_id");

    // ============================================================
    // Validate position_id
    // ============================================================
    if (!positionId) {
      return NextResponse.json(
        {
          success: false,
          message: "position_id is required.",
          data: [],
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // ดึงข้อมูลรอบเปิดรับสมัครตาม Position
    // recruit_job_open.position_id
    //
    // พร้อมดึงข้อมูลสังกัดจาก
    // recruit_job_open.branch_id -> branches.id
    // ============================================================
    const { data, error } = await supabaseAdmin
      .from("recruit_job_open")
      .select(`
        id,
        position_id,
        branch_id,
        branches (
          id,
          branch_name
        )
      `)
      .eq("position_id", positionId)
      .order("branch_id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "GET /recruitment/api/job_open error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
          data: [],
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /recruitment/api/job_open exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Unable to load recruitment opening.",
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}