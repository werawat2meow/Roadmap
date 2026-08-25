import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import {
  UNIT_POSITION_SELECT,
  attachMetrics,
  buildPlanLineageFromRow,
  canAccessLineage,
  loadCompanyAndGroupMaps,
  loadPlanMetrics,
  mapUnitPositionRow,
  resolvePlanningLineage,
} from "@/lib/workforce/unitPositionPlanning";

const ALLOWED_STATUSES = new Set(["active", "inactive"]);

function normalizeStatus(value) {
  const status = String(value || "active").trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : "";
}

async function loadPlan(id) {
  const { data, error } = await supabaseAdmin
    .from("unit_positions")
    .select(UNIT_POSITION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function countLinkedSlots(id) {
  const { count, error } = await supabaseAdmin
    .from("org_position_slots")
    .select("id", { count: "exact", head: true })
    .eq("unit_position_id", id);

  if (error) throw error;
  return Number(count || 0);
}

async function validatePosition(positionId) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .select("id, position_code, position_name, status")
    .eq("id", positionId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { ok: false, error: "ไม่พบข้อมูลตำแหน่ง" };
  }

  if (data.status && data.status !== "active") {
    return { ok: false, error: "ตำแหน่งนี้ไม่ได้อยู่ในสถานะใช้งาน" };
  }

  return { ok: true, position: data };
}

/* =========================================================
   PATCH /api/admin/unit-positions/[id]
========================================================= */

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess("ems.unit_positions", "edit", {
      lineageScope: true,
    });

    const { id } = await params;
    const body = await req.json();

    const oldRow = await loadPlan(id);

    if (!oldRow) {
      return NextResponse.json(
        { success: false, error: "ไม่พบแผนอัตรากำลัง" },
        { status: 404 }
      );
    }

    const oldLineage = buildPlanLineageFromRow(oldRow);

    if (!(await canAccessLineage(guard, oldLineage))) {
      return NextResponse.json(
        { success: false, error: "คุณไม่มีสิทธิ์แก้ไขแผนอัตรากำลังนี้" },
        { status: 403 }
      );
    }

    const branchId = body?.branch_id || null;
    const unitId = body?.unit_id || null;
    const positionId = body?.position_id || null;
    const headcountTarget = Number(body?.headcount_target ?? 0);
    const status = normalizeStatus(body?.status);

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสังกัด" },
        { status: 400 }
      );
    }

    if (!unitId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกหน่วยงาน" },
        { status: 400 }
      );
    }

    if (!positionId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกตำแหน่ง" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(headcountTarget) || headcountTarget < 0) {
      return NextResponse.json(
        { success: false, error: "จำนวนอัตราเป้าหมายต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: "สถานะ Workforce Plan ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const structureChanged =
      String(oldRow.branch_id || "") !== String(branchId) ||
      String(oldRow.unit_id || "") !== String(unitId) ||
      String(oldRow.position_id || "") !== String(positionId);

    const linkedSlotCount = await countLinkedSlots(id);

    if (structureChanged && linkedSlotCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "แผนนี้มี Position Slot เชื่อมอยู่แล้ว จึงไม่สามารถเปลี่ยนสังกัด / หน่วย / ตำแหน่งได้ กรุณาปรับ Target หรือปิดแผนแทน",
        },
        { status: 409 }
      );
    }

    let newLineage = oldLineage;

    if (structureChanged) {
      const [lineageResult, positionResult] = await Promise.all([
        resolvePlanningLineage({ branchId, unitId, requireActive: true }),
        validatePosition(positionId),
      ]);

      if (!lineageResult.ok) {
        return NextResponse.json(
          { success: false, error: lineageResult.error },
          { status: 400 }
        );
      }

      if (!positionResult.ok) {
        return NextResponse.json(
          { success: false, error: positionResult.error },
          { status: 400 }
        );
      }

      newLineage = lineageResult.lineage;

      if (!(await canAccessLineage(guard, newLineage))) {
        return NextResponse.json(
          { success: false, error: "คุณไม่มีสิทธิ์ย้ายแผนอัตรากำลังไป Scope นี้" },
          { status: 403 }
        );
      }
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("unit_positions")
      .select("id")
      .eq("branch_id", branchId)
      .eq("unit_id", unitId)
      .eq("position_id", positionId)
      .neq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "สังกัดและหน่วยงานนี้มีแผนอัตรากำลังของตำแหน่งนี้อยู่แล้ว",
        },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("unit_positions")
      .update({
        branch_id: branchId,
        unit_id: unitId,
        position_id: positionId,
        headcount_target: headcountTarget,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const updatedRow = await loadPlan(id);
    const masterMaps = await loadCompanyAndGroupMaps([updatedRow]);
    const mapped = mapUnitPositionRow(updatedRow, masterMaps);
    const metricsMap = await loadPlanMetrics([mapped]);
    const result = attachMetrics(mapped, metricsMap);

    await writeActivityLog({
      module_name: "unit_positions",
      action_type: "update",
      reference_table: "unit_positions",
      reference_id: id,
      description: `แก้ไขแผนอัตรากำลัง ${mapped.branch_name} / ${mapped.unit_name} / ${mapped.position_name} Target ${headcountTarget}`,
      old_data: mapUnitPositionRow(
        oldRow,
        await loadCompanyAndGroupMaps([oldRow])
      ),
      new_data: result,
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตแผนอัตรากำลังเรียบร้อยแล้ว",
      data: result,
      linked_slot_count: linkedSlotCount,
    });
  } catch (error) {
    console.error("UPDATE_UNIT_POSITION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถอัปเดตแผนอัตรากำลังได้",
      },
      { status: error?.status || 500 }
    );
  }
}

/* =========================================================
   DELETE /api/admin/unit-positions/[id]

   ถ้ามี Slot History แล้ว ห้ามลบ Plan
   ให้เปลี่ยน status = inactive เพื่อรักษา Traceability
========================================================= */

export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess("ems.unit_positions", "delete", {
      lineageScope: true,
    });

    const { id } = await params;

    const oldRow = await loadPlan(id);

    if (!oldRow) {
      return NextResponse.json(
        { success: false, error: "ไม่พบแผนอัตรากำลัง" },
        { status: 404 }
      );
    }

    const lineage = buildPlanLineageFromRow(oldRow);

    if (!(await canAccessLineage(guard, lineage))) {
      return NextResponse.json(
        { success: false, error: "คุณไม่มีสิทธิ์ลบแผนอัตรากำลังนี้" },
        { status: 403 }
      );
    }

    const linkedSlotCount = await countLinkedSlots(id);

    if (linkedSlotCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            `แผนนี้มี Position Slot เชื่อมอยู่ ${linkedSlotCount} รายการ จึงไม่สามารถลบได้ กรุณาเปลี่ยนสถานะเป็น Inactive เพื่อรักษาประวัติ`,
        },
        { status: 409 }
      );
    }

    const oldMaps = await loadCompanyAndGroupMaps([oldRow]);
    const oldData = mapUnitPositionRow(oldRow, oldMaps);

    const { error } = await supabaseAdmin
      .from("unit_positions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "unit_positions",
      action_type: "delete",
      reference_table: "unit_positions",
      reference_id: id,
      description: `ลบแผนอัตรากำลัง ${oldData.branch_name} / ${oldData.unit_name} / ${oldData.position_name}`,
      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message: "ลบแผนอัตรากำลังเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE_UNIT_POSITION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถลบแผนอัตรากำลังได้",
      },
      { status: error?.status || 500 }
    );
  }
}
