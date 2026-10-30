import { NextResponse } from "next/server";

import {
  authorizeExecutivePresentationRequest,
  canAccessExecutivePresentation,
} from "@/app/recruitment/lib/executivePresentationAccess.mjs";
import { buildExecutivePresentationPayload } from "@/app/recruitment/lib/executivePresentation.mjs";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
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
    const guard = await authorizeExecutivePresentationRequest(
      requireScopedAccess,
    );
    if (!guard.ok) return guard.response;

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
          emp_code,
          title_id,
          first_name,
          last_name,
          nickname_th,
          phone_number,
          position_id,
          expected_salary,
          final_position_id,
          position_level_id,
          branch_id,
          department_id,
          division_id,
          unit_id,
          base_salary,
          position_allowance,
          living_allowance,
          special_allowance,
          fuel_allowance,
          oc,
          phone_allowance,
          incentive_type,
          incentive_amount,
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

    if (!canAccessExecutivePresentation(guard, application)) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลพนักงานนี้" },
        { status: 403 },
      );
    }

    const [
      titleResult,
      appliedPositionResult,
      finalPositionResult,
      positionLevelResult,
      branchResult,
      departmentResult,
      divisionResult,
      additionalCostsResult,
    ] = await Promise.all([
      getLookup("titles", "title_name_th, title_name_en", application.title_id),
      getLookup("positions", "position_name", application.position_id),
      getLookup("positions", "position_name", application.final_position_id),
      getLookup(
        "position_levels",
        "level_code, level_name",
        application.position_level_id,
      ),
      getLookup(
        "branches",
        "branch_code, branch_name, branch_image_url, presentation_text_color, presentation_muted_text_color",
        application.branch_id,
      ),
      getLookup("departments", "department_name", application.department_id),
      getLookup("divisions", "division_name", application.division_id),
      supabaseAdmin
        .from("recruit_additional_cost")
        .select("cost_type, topic, amount")
        .eq("application_id", id)
        .order("id", { ascending: true }),
    ]);

    const queryError = [
      titleResult.error,
      appliedPositionResult.error,
      finalPositionResult.error,
      positionLevelResult.error,
      branchResult.error,
      departmentResult.error,
      divisionResult.error,
      additionalCostsResult.error,
    ].find(Boolean);
    if (queryError) throw queryError;

    return NextResponse.json({
      success: true,
      data: buildExecutivePresentationPayload({
        application,
        title: titleResult.data,
        appliedPosition: appliedPositionResult.data,
        finalPosition: finalPositionResult.data,
        positionLevel: positionLevelResult.data,
        branch: branchResult.data,
        department: departmentResult.data,
        division: divisionResult.data,
        additionalCosts: additionalCostsResult.data || [],
      }),
    });
  } catch (error) {
    console.error("Executive presentation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "ไม่สามารถโหลดข้อมูล Present to Executive ได้",
      },
      { status: 500 },
    );
  }
}
