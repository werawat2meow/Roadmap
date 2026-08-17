import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import {
  UNIT_POSITION_SELECT,
  attachMetrics,
  buildPlanLineageFromRow,
  buildSlotCodePrefix,
  canAccessLineage,
  getBangkokDate,
  loadCompanyAndGroupMaps,
  loadPlanMetrics,
  mapUnitPositionRow,
  resolvePlanningLineage,
} from "@/lib/workforce/unitPositionPlanning";

const MAX_GENERATE_PER_REQUEST = 200;

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req, { params }) {
  try {
    /*
     * Generate Slot เป็นการแก้ Workforce Plan
     * และเป็นการสร้าง Org Structure จริง
     * จึงต้องผ่าน Permission ทั้ง 2 ฝั่ง
     */
    const [planningGuard, orgGuard] = await Promise.all([
      requireScopedAccess("ems.unit_positions", "edit", {
        lineageScope: true,
      }),
      requireScopedAccess("ems.org_structure", "create", {
        lineageScope: true,
      }),
    ]);

    const { id } = await params;

    const { data: planRaw, error: planError } = await supabaseAdmin
      .from("unit_positions")
      .select(UNIT_POSITION_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (planError) throw planError;

    if (!planRaw) {
      return NextResponse.json(
        { success: false, error: "ไม่พบแผนอัตรากำลัง" },
        { status: 404 }
      );
    }

    if (planRaw.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "ต้องเปิดใช้งาน Workforce Plan ก่อนจึงจะสร้าง Position Slot ได้",
        },
        { status: 400 }
      );
    }

    const lineage = buildPlanLineageFromRow(planRaw);

    if (!(await canAccessLineage(planningGuard, lineage))) {
      return NextResponse.json(
        { success: false, error: "คุณไม่มีสิทธิ์แก้ไข Workforce Plan นี้" },
        { status: 403 }
      );
    }

    if (!(await canAccessLineage(orgGuard, lineage))) {
      return NextResponse.json(
        {
          success: false,
          error: "คุณไม่มีสิทธิ์สร้าง Position Slot ใน Scope นี้",
        },
        { status: 403 }
      );
    }

    /*
     * Validate hierarchy ซ้ำก่อนสร้าง Seat จริง
     */
    const lineageResult = await resolvePlanningLineage({
      branchId: planRaw.branch_id,
      unitId: planRaw.unit_id,
      requireActive: true,
    });

    if (!lineageResult.ok) {
      return NextResponse.json(
        { success: false, error: lineageResult.error },
        { status: 400 }
      );
    }

    const masterMaps = await loadCompanyAndGroupMaps([planRaw]);
    const plan = mapUnitPositionRow(planRaw, masterMaps);
    const metricsMap = await loadPlanMetrics([plan]);
    const current = attachMetrics(plan, metricsMap);

    if (current.slot_gap <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            current.over_plan > 0
              ? `Slot Capacity มากกว่า Target อยู่ ${current.over_plan} อัตรา ไม่ต้อง Generate เพิ่ม`
              : "Position Slot ครบตาม Target แล้ว",
        },
        { status: 400 }
      );
    }

    const generateCount = Math.min(
      current.slot_gap,
      MAX_GENERATE_PER_REQUEST
    );

    const prefix = buildSlotCodePrefix({
      branchCode: current.branch_code,
      unitCode: current.unit_code,
      positionCode: current.position_code,
    });

    const { data: existingCodeRows, error: existingCodeError } =
      await supabaseAdmin
        .from("org_position_slots")
        .select("slot_code")
        .ilike("slot_code", `${prefix}-%`);

    if (existingCodeError) throw existingCodeError;

    const sequenceRegex = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`, "i");

    let maxSequence = 0;

    for (const row of existingCodeRows || []) {
      const match = String(row.slot_code || "").match(sequenceRegex);
      if (!match) continue;
      maxSequence = Math.max(maxSequence, Number(match[1] || 0));
    }

    const today = getBangkokDate();
    const insertRows = [];

    for (let index = 1; index <= generateCount; index += 1) {
      const sequence = maxSequence + index;
      const sequenceText = String(sequence).padStart(3, "0");

      insertRows.push({
        unit_position_id: current.id,
        slot_code: `${prefix}-${sequenceText}`,
        slot_name: `${current.position_name} #${sequenceText}`,

        company_id: lineageResult.lineage.company_id,
        branch_group_id: lineageResult.lineage.branch_group_id,
        branch_id: lineageResult.lineage.branch_id,
        department_id: lineageResult.lineage.department_id,
        division_id: lineageResult.lineage.division_id,
        unit_id: lineageResult.lineage.unit_id,
        position_id: current.position_id,

        /*
         * Generate จาก Plan ยังไม่เดา Reporting Line
         * ให้ HR จัด Parent Slot ที่หน้า Position Slot Master
         */
        parent_slot_id: null,

        slot_type: "normal",
        employment_capacity: 1,
        sort_order: sequence,
        status: "active",
        effective_from: today,
        effective_to: null,
      });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("org_position_slots")
      .insert(insertRows)
      .select("id, slot_code, slot_name, unit_position_id");

    if (insertError) throw insertError;

    const remainingGap = Math.max(current.slot_gap - generateCount, 0);

    await writeActivityLog({
      module_name: "unit_positions",
      action_type: "generate_slots",
      reference_table: "unit_positions",
      reference_id: current.id,
      description: `Generate Position Slot ${generateCount} อัตรา จาก Workforce Plan ${current.branch_name} / ${current.unit_name} / ${current.position_name}`,
      new_data: {
        unit_position_id: current.id,
        target: current.headcount_target,
        previous_slot_capacity: current.slot_capacity,
        generated_count: generateCount,
        remaining_gap: remainingGap,
        slot_codes: (inserted || []).map((item) => item.slot_code),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        remainingGap > 0
          ? `สร้าง Position Slot ${generateCount} อัตราแล้ว เหลือ Gap อีก ${remainingGap} อัตรา`
          : `สร้าง Position Slot ${generateCount} อัตราครบตาม Target แล้ว`,
      data: inserted || [],
      generated_count: generateCount,
      remaining_gap: remainingGap,
      note:
        "Slot ที่ Generate ใหม่ยังไม่มี Parent Slot กรุณาจัดสายบังคับบัญชาที่หน้า Position Slot Master",
    });
  } catch (error) {
    console.error("GENERATE_UNIT_POSITION_SLOTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถ Generate Position Slot ได้",
      },
      { status: error?.status || 500 }
    );
  }
}
