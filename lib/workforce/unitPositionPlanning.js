import { supabaseAdmin } from "@/lib/supabaseServer";

export const UNIT_POSITION_SELECT = `
  id,
  branch_id,
  unit_id,
  position_id,
  headcount_target,
  status,
  created_at,
  updated_at,
  branches (
    id,
    company_id,
    group_id,
    branch_code,
    branch_name,
    status
  ),
  units (
    id,
    unit_code,
    unit_name,
    division_id,
    status,
    divisions (
      id,
      division_code,
      division_name,
      department_id,
      status,
      departments (
        id,
        department_code,
        department_name,
        status
      )
    )
  ),
  positions (
    id,
    position_code,
    position_name,
    status,
    position_level_mappings (
      is_default,
      sort_order,
      position_level:position_levels (
        id,
        level_code,
        level_name
      )
    )
  )
`;

export function getBangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isCurrentDateRange(
  effectiveFrom,
  effectiveTo,
  today = getBangkokDate()
) {
  if (effectiveFrom && effectiveFrom > today) return false;
  if (effectiveTo && effectiveTo < today) return false;
  return true;
}

export function getDefaultPositionLevel(position) {
  const mappings = Array.isArray(position?.position_level_mappings)
    ? [...position.position_level_mappings]
    : [];

  mappings.sort(
    (a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0)
  );

  return (
    mappings.find((mapping) => mapping?.is_default)?.position_level ||
    mappings[0]?.position_level ||
    null
  );
}

export function buildPlanLineageFromRow(row) {
  const branch = row?.branches || {};
  const division = row?.units?.divisions || {};
  const department = division?.departments || {};

  return {
    company_id: branch.company_id || null,
    branch_group_id: branch.group_id || null,
    branch_id: row?.branch_id || branch.id || null,
    department_id: division.department_id || department.id || null,
    division_id: row?.units?.division_id || division.id || null,
    unit_id: row?.unit_id || row?.units?.id || null,
  };
}

export function mapUnitPositionRow(row, masterMaps = {}) {
  const branch = row?.branches || {};
  const unit = row?.units || {};
  const division = unit?.divisions || {};
  const department = division?.departments || {};
  const position = row?.positions || {};
  const defaultLevel = getDefaultPositionLevel(position);

  const companyId = branch.company_id || null;
  const branchGroupId = branch.group_id || null;

  return {
    id: row.id,

    company_id: companyId,
    company_code: masterMaps.companies?.get(companyId)?.company_code || "",
    company_name:
      masterMaps.companies?.get(companyId)?.company_name_th ||
      masterMaps.companies?.get(companyId)?.company_name_en ||
      "-",

    branch_group_id: branchGroupId,
    branch_group_code:
      masterMaps.branchGroups?.get(branchGroupId)?.group_code || "",
    branch_group_name:
      masterMaps.branchGroups?.get(branchGroupId)?.group_name || "-",

    branch_id: row.branch_id || branch.id || null,
    branch_code: branch.branch_code || "",
    branch_name: branch.branch_name || "-",

    department_id: division.department_id || department.id || null,
    department_code: department.department_code || "",
    department_name: department.department_name || "-",

    division_id: unit.division_id || division.id || null,
    division_code: division.division_code || "",
    division_name: division.division_name || "-",

    unit_id: row.unit_id || unit.id || null,
    unit_code: unit.unit_code || "",
    unit_name: unit.unit_name || "-",

    position_id: row.position_id || position.id || null,
    position_code: position.position_code || "",
    position_name: position.position_name || "-",
    position_level: defaultLevel?.level_code || "",
    position_level_name: defaultLevel?.level_name || "",

    headcount_target: Number(row.headcount_target || 0),
    status: row.status || "active",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function resolvePlanningLineage({
  branchId,
  unitId,
  requireActive = true,
}) {
  if (!branchId || !unitId) {
    return {
      ok: false,
      error: "กรุณาระบุสังกัดและหน่วยงาน",
    };
  }

  const [branchResult, unitResult] = await Promise.all([
    supabaseAdmin
      .from("branches")
      .select("id, company_id, group_id, branch_code, branch_name, status")
      .eq("id", branchId)
      .maybeSingle(),

    supabaseAdmin
      .from("units")
      .select(`
        id,
        unit_code,
        unit_name,
        division_id,
        status,
        divisions (
          id,
          division_code,
          division_name,
          department_id,
          status,
          departments (
            id,
            department_code,
            department_name,
            status
          )
        )
      `)
      .eq("id", unitId)
      .maybeSingle(),
  ]);

  if (branchResult.error) throw branchResult.error;
  if (unitResult.error) throw unitResult.error;

  const branch = branchResult.data;
  const unit = unitResult.data;

  if (!branch) {
    return { ok: false, error: "ไม่พบข้อมูลสังกัด" };
  }

  if (!unit) {
    return { ok: false, error: "ไม่พบข้อมูลหน่วยงาน" };
  }

  const division = unit.divisions;
  const department = division?.departments;

  if (!division || !department) {
    return {
      ok: false,
      error: "โครงสร้างหน่วยงานไม่สมบูรณ์: ไม่พบฝ่ายหรือแผนก",
    };
  }

  if (requireActive) {
    if (branch.status && branch.status !== "active") {
      return { ok: false, error: "สังกัดนี้ไม่ได้อยู่ในสถานะใช้งาน" };
    }

    if (department.status && department.status !== "active") {
      return { ok: false, error: "แผนกนี้ไม่ได้อยู่ในสถานะใช้งาน" };
    }

    if (division.status && division.status !== "active") {
      return { ok: false, error: "ฝ่ายนี้ไม่ได้อยู่ในสถานะใช้งาน" };
    }

    if (unit.status && unit.status !== "active") {
      return { ok: false, error: "หน่วยงานนี้ไม่ได้อยู่ในสถานะใช้งาน" };
    }
  }

  const { data: branchDepartment, error: branchDepartmentError } =
    await supabaseAdmin
      .from("branch_departments")
      .select("id, status")
      .eq("branch_id", branch.id)
      .eq("department_id", department.id)
      .eq("status", "active")
      .maybeSingle();

  if (branchDepartmentError) throw branchDepartmentError;

  if (!branchDepartment) {
    return {
      ok: false,
      error: "แผนกของหน่วยงานนี้ไม่ได้ถูกผูกกับสังกัดที่เลือก",
    };
  }

  return {
    ok: true,
    branch,
    department,
    division,
    unit,
    lineage: {
      company_id: branch.company_id,
      branch_group_id: branch.group_id || null,
      branch_id: branch.id,
      department_id: department.id,
      division_id: division.id,
      unit_id: unit.id,
    },
  };
}

export async function canAccessLineage(guard, lineage) {
  if (!guard) return false;
  if (guard.hasAllScope) return true;
  if (typeof guard.canAccessEmployee !== "function") return false;

  return Boolean(await guard.canAccessEmployee(lineage));
}

export async function loadCompanyAndGroupMaps(rows = []) {
  const companyIds = [
    ...new Set(
      rows.map((row) => row?.branches?.company_id).filter(Boolean)
    ),
  ];

  const groupIds = [
    ...new Set(rows.map((row) => row?.branches?.group_id).filter(Boolean)),
  ];

  const [companiesResult, groupsResult] = await Promise.all([
    companyIds.length
      ? supabaseAdmin
          .from("companies")
          .select("id, company_code, company_name_th, company_name_en")
          .in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),

    groupIds.length
      ? supabaseAdmin
          .from("branch_groups")
          .select("id, group_code, group_name, group_color")
          .in("id", groupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (companiesResult.error) throw companiesResult.error;
  if (groupsResult.error) throw groupsResult.error;

  return {
    companies: new Map((companiesResult.data || []).map((item) => [item.id, item])),
    branchGroups: new Map((groupsResult.data || []).map((item) => [item.id, item])),
  };
}

function chunkArray(items, size = 200) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function loadPlanMetrics(planRows = []) {
  const planIds = [...new Set(planRows.map((row) => row?.id).filter(Boolean))];
  const today = getBangkokDate();

  const metrics = new Map(
    planIds.map((id) => [
      id,
      {
        slot_count: 0,
        slot_capacity: 0,
        filled_count: 0,
        vacant_count: 0,
        slot_gap: 0,
        over_plan: 0,
        occupancy_percent: 0,
      },
    ])
  );

  if (!planIds.length) return metrics;

  const slots = [];

  for (const batch of chunkArray(planIds, 150)) {
    const { data, error } = await supabaseAdmin
      .from("org_position_slots")
      .select(`
        id,
        unit_position_id,
        employment_capacity,
        status,
        effective_from,
        effective_to,
        employee_position_assignments:employee_position_assignments!employee_position_assignments_slot_fkey (
          id,
          is_primary,
          status,
          effective_from,
          effective_to
        )
      `)
      .in("unit_position_id", batch);

    if (error) throw error;
    slots.push(...(data || []));
  }

  for (const slot of slots) {
    if (!slot.unit_position_id) continue;

    const current = metrics.get(slot.unit_position_id);
    if (!current) continue;

    if (
      slot.status !== "active" ||
      !isCurrentDateRange(slot.effective_from, slot.effective_to, today)
    ) {
      continue;
    }

    const capacity = Math.max(Number(slot.employment_capacity || 1), 1);

    const filled = (slot.employee_position_assignments || []).filter(
      (assignment) =>
        assignment?.status === "active" &&
        assignment?.is_primary === true &&
        isCurrentDateRange(
          assignment?.effective_from,
          assignment?.effective_to,
          today
        )
    ).length;

    current.slot_count += 1;
    current.slot_capacity += capacity;
    current.filled_count += Math.min(filled, capacity);
  }

  for (const row of planRows) {
    const current = metrics.get(row.id);
    if (!current) continue;

    const target = Math.max(Number(row.headcount_target || 0), 0);

    current.vacant_count = Math.max(
      current.slot_capacity - current.filled_count,
      0
    );

    current.slot_gap = Math.max(target - current.slot_capacity, 0);
    current.over_plan = Math.max(current.slot_capacity - target, 0);

    current.occupancy_percent = current.slot_capacity
      ? Math.min(
          Math.round((current.filled_count / current.slot_capacity) * 100),
          100
        )
      : 0;
  }

  return metrics;
}

export function attachMetrics(row, metricsMap) {
  const metrics = metricsMap.get(row.id) || {};

  return {
    ...row,
    slot_count: Number(metrics.slot_count || 0),
    slot_capacity: Number(metrics.slot_capacity || 0),
    filled_count: Number(metrics.filled_count || 0),
    vacant_count: Number(metrics.vacant_count || 0),
    slot_gap: Number(metrics.slot_gap || 0),
    over_plan: Number(metrics.over_plan || 0),
    occupancy_percent: Number(metrics.occupancy_percent || 0),
  };
}

export function calculatePlanningSummary(rows = []) {
  return rows.reduce(
    (summary, row) => {
      summary.plan_count += 1;
      summary.target_total += Number(row.headcount_target || 0);
      summary.slot_capacity_total += Number(row.slot_capacity || 0);
      summary.filled_total += Number(row.filled_count || 0);
      summary.vacant_total += Number(row.vacant_count || 0);
      summary.gap_total += Number(row.slot_gap || 0);
      summary.over_plan_total += Number(row.over_plan || 0);
      return summary;
    },
    {
      plan_count: 0,
      target_total: 0,
      slot_capacity_total: 0,
      filled_total: 0,
      vacant_total: 0,
      gap_total: 0,
      over_plan_total: 0,
    }
  );
}

export function sanitizeSlotCodePart(value, fallback = "X") {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);

  return normalized || fallback;
}

export function buildSlotCodePrefix({ branchCode, unitCode, positionCode }) {
  return [
    sanitizeSlotCodePart(branchCode, "BR"),
    sanitizeSlotCodePart(unitCode, "UNIT"),
    sanitizeSlotCodePart(positionCode, "POS"),
  ].join("-");
}
