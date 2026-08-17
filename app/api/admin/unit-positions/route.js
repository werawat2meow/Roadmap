import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import {
  UNIT_POSITION_SELECT,
  attachMetrics,
  buildPlanLineageFromRow,
  calculatePlanningSummary,
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

function includesSearch(row, search) {
  if (!search) return true;

  const keyword = search.toLowerCase();

  return [
    row.company_code,
    row.company_name,
    row.branch_group_code,
    row.branch_group_name,
    row.branch_code,
    row.branch_name,
    row.department_code,
    row.department_name,
    row.division_code,
    row.division_name,
    row.unit_code,
    row.unit_name,
    row.position_code,
    row.position_name,
    row.position_level,
    row.position_level_name,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword));
}

function matchesFilters(row, filters) {
  if (filters.company_id && row.company_id !== filters.company_id) return false;
  if (
    filters.branch_group_id &&
    row.branch_group_id !== filters.branch_group_id
  ) {
    return false;
  }
  if (filters.branch_id && row.branch_id !== filters.branch_id) return false;
  if (
    filters.department_id &&
    row.department_id !== filters.department_id
  ) {
    return false;
  }
  if (filters.division_id && row.division_id !== filters.division_id) {
    return false;
  }
  if (filters.unit_id && row.unit_id !== filters.unit_id) return false;
  if (filters.position_id && row.position_id !== filters.position_id) return false;
  if (filters.status && row.status !== filters.status) return false;

  return includesSearch(row, filters.search);
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
   GET /api/admin/unit-positions

   Workforce Planning
   - Scope ตาม Company -> Group -> Branch -> Department
     -> Division -> Unit
   - Pagination หลัง Scope + Filter
   - คืน Target / Slot / Filled / Vacant / Gap ในรอบเดียว
========================================================= */

export async function GET(req) {
  try {
    const guard = await requireScopedAccess("ems.unit_positions", "view", {
      lineageScope: true,
    });

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 20), 1),
      100
    );

    const filters = {
      search: searchParams.get("search")?.trim() || "",
      company_id: searchParams.get("company_id")?.trim() || "",
      branch_group_id: searchParams.get("branch_group_id")?.trim() || "",
      branch_id: searchParams.get("branch_id")?.trim() || "",
      department_id: searchParams.get("department_id")?.trim() || "",
      division_id: searchParams.get("division_id")?.trim() || "",
      unit_id: searchParams.get("unit_id")?.trim() || "",
      position_id: searchParams.get("position_id")?.trim() || "",
      status: searchParams.get("status")?.trim() || "",
    };

    if (filters.status && !ALLOWED_STATUSES.has(filters.status)) {
      return NextResponse.json(
        { success: false, error: "สถานะ Workforce Plan ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("unit_positions")
      .select(UNIT_POSITION_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rawRows = data || [];
    const masterMaps = await loadCompanyAndGroupMaps(rawRows);

    const scopedRows = [];

    for (const rawRow of rawRows) {
      const lineage = buildPlanLineageFromRow(rawRow);

      if (!(await canAccessLineage(guard, lineage))) {
        continue;
      }

      scopedRows.push(mapUnitPositionRow(rawRow, masterMaps));
    }

    const filteredRows = scopedRows.filter((row) => matchesFilters(row, filters));

    const metricsMap = await loadPlanMetrics(filteredRows);
    const enrichedRows = filteredRows.map((row) => attachMetrics(row, metricsMap));

    const summary = calculatePlanningSummary(enrichedRows);

    const total = enrichedRows.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * pageSize;
    const pagedRows = enrichedRows.slice(from, from + pageSize);

    return NextResponse.json({
      success: true,
      data: pagedRows,
      summary,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET_UNIT_POSITIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "ไม่สามารถดึงข้อมูลวางแผนอัตรากำลังได้",
      },
      { status: error?.status || 500 }
    );
  }
}

/* =========================================================
   POST /api/admin/unit-positions
========================================================= */

export async function POST(req) {
  try {
    const guard = await requireScopedAccess("ems.unit_positions", "create", {
      lineageScope: true,
    });

    const body = await req.json();

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

    const [lineageResult, positionResult] = await Promise.all([
      resolvePlanningLineage({ branchId, unitId }),
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

    if (!(await canAccessLineage(guard, lineageResult.lineage))) {
      return NextResponse.json(
        { success: false, error: "คุณไม่มีสิทธิ์เพิ่มแผนอัตรากำลังใน Scope นี้" },
        { status: 403 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("unit_positions")
      .select("id")
      .eq("branch_id", branchId)
      .eq("unit_id", unitId)
      .eq("position_id", positionId)
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

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("unit_positions")
      .insert([
        {
          branch_id: branchId,
          unit_id: unitId,
          position_id: positionId,
          headcount_target: headcountTarget,
          status,
        },
      ])
      .select(UNIT_POSITION_SELECT)
      .single();

    if (insertError) throw insertError;

    const masterMaps = await loadCompanyAndGroupMaps([inserted]);
    const mapped = mapUnitPositionRow(inserted, masterMaps);
    const metricsMap = await loadPlanMetrics([mapped]);
    const result = attachMetrics(mapped, metricsMap);

    await writeActivityLog({
      module_name: "unit_positions",
      action_type: "create",
      reference_table: "unit_positions",
      reference_id: inserted.id,
      description: `เพิ่มแผนอัตรากำลัง ${mapped.branch_name} / ${mapped.unit_name} / ${mapped.position_name} Target ${headcountTarget}`,
      new_data: result,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มแผนอัตรากำลังเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("CREATE_UNIT_POSITION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถบันทึกแผนอัตรากำลังได้",
      },
      { status: error?.status || 500 }
    );
  }
}
