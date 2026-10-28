import { NextResponse } from "next/server";

import {
  buildDepartmentPresentationPayload,
  resolveDepartmentPresentationPositionId,
} from "@/app/recruitment/lib/departmentPresentation.mjs";
import { supabaseAdmin } from "@/lib/supabaseServer";

function emptyLookup() {
  return Promise.resolve({ data: null, error: null });
}

function getLookup(table, columns, id) {
  if (!id) return emptyLookup();

  return supabaseAdmin
    .from(table)
    .select(columns)
    .eq("id", id)
    .maybeSingle();
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสรายการพนักงาน" },
        { status: 400 },
      );
    }

    const { data: application, error: applicationError } = await supabaseAdmin
      .from("recruit_job_applications")
      .select(
        `
          id,
          title_id,
          first_name,
          last_name,
          nickname_th,
          nickname_en,
          emp_code,
          final_position_id,
          position_level_id,
          branch_id,
          department_id,
          phone_number,
          line_id,
          start_date,
          profile_image_url
        `,
      )
      .eq("id", id)
      .eq("status", 15)
      .maybeSingle();

    if (applicationError) throw applicationError;
    if (!application) {
      return NextResponse.json(
        { success: false, message: "ไม่พบพนักงานที่อนุมัติแล้ว" },
        { status: 404 },
      );
    }

    const [titleResult, positionResult, levelResult, branchResult, departmentResult] =
      await Promise.all([
        getLookup("titles", "title_name_th, title_name_en", application.title_id),
        getLookup(
          "positions",
          "position_name",
          resolveDepartmentPresentationPositionId(application),
        ),
        getLookup(
          "position_levels",
          "level_code, level_name",
          application.position_level_id,
        ),
        getLookup(
          "branches",
          "branch_code, branch_name, branch_image_url",
          application.branch_id,
        ),
        getLookup("departments", "department_name", application.department_id),
      ]);

    const lookupError = [
      titleResult.error,
      positionResult.error,
      levelResult.error,
      branchResult.error,
      departmentResult.error,
    ].find(Boolean);
    if (lookupError) throw lookupError;

    return NextResponse.json({
      success: true,
      data: buildDepartmentPresentationPayload({
        application,
        title: titleResult.data,
        position: positionResult.data,
        positionLevel: levelResult.data,
        branch: branchResult.data,
        department: departmentResult.data,
      }),
    });
  } catch (error) {
    console.error("Department presentation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "ไม่สามารถโหลดข้อมูล Present to Department ได้",
      },
      { status: 500 },
    );
  }
}
