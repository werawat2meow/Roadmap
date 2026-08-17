import { supabaseAdmin } from "@/lib/supabaseServer";

export const COMPENSATION_SELECT = `
  *,
  employee:employees (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,
    position_id,
    position_level_id,
    position_level_band_id,
    payroll_company_id,
    payroll_type_id,
    payroll_group_id
  ),
  salary_structure:salary_structures (*),
  position:positions (*),
  position_level:position_levels (*),
  position_level_band:position_level_bands (*),
  payroll_company:payroll_companies (*),
  payroll_type:payroll_types (*),
  payroll_group:payroll_groups (*)
`;

export const ADJUSTMENT_SELECT = `
  *,
  employee:employees (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id
  ),
  salary_structure:salary_structures (*),
  position_level_band:position_level_bands (*)
`;

export function cleanText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toPositivePage(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function toPageSize(value, fallback = 20, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function loadBandSnapshot(positionLevelBandId) {
  if (!positionLevelBandId) {
    return {
      band_min_snapshot: null,
      band_mid_snapshot: null,
      band_max_snapshot: null,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("position_level_bands")
    .select("id, salary_min, salary_mid, salary_max")
    .eq("id", positionLevelBandId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const err = new Error("ไม่พบ Salary Band ที่ระบุ");
    err.status = 400;
    throw err;
  }

  return {
    band_min_snapshot: toNumber(data.salary_min, null),
    band_mid_snapshot: toNumber(data.salary_mid, null),
    band_max_snapshot: toNumber(data.salary_max, null),
  };
}

export async function loadCurrentCompensation(employeeId) {
  const { data, error } = await supabaseAdmin
    .from("employee_compensations")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("status", "active")
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function loadAdjustment(adjustmentId) {
  const { data, error } = await supabaseAdmin
    .from("employee_compensation_adjustments")
    .select("*")
    .eq("id", adjustmentId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function insertApprovalLog({
  adjustmentId,
  action,
  fromStatus = null,
  toStatus = null,
  actorUserAccountId = null,
  actorRoleId = null,
  comment = null,
}) {
  const { error } = await supabaseAdmin
    .from("employee_compensation_approval_logs")
    .insert({
      adjustment_id: adjustmentId,
      action,
      from_status: fromStatus,
      to_status: toStatus,
      actor_user_account_id: actorUserAccountId,
      actor_role_id: actorRoleId,
      comment: cleanText(comment),
    });

  if (error) throw error;
}

export function calculateAdjustment({
  currentSalary,
  adjustmentAmount,
  adjustmentPercent,
  proposedSalary,
}) {
  const current = toNumber(currentSalary, 0);
  let amount = toNumber(adjustmentAmount, null);
  let percent = toNumber(adjustmentPercent, null);
  let proposed = toNumber(proposedSalary, null);

  if (proposed === null) {
    if (amount !== null) {
      proposed = current + amount;
    } else if (percent !== null) {
      amount = current * (percent / 100);
      proposed = current + amount;
    }
  }

  if (proposed === null) {
    throw new Error(
      "กรุณาระบุ proposed_salary, adjustment_amount หรือ adjustment_percent"
    );
  }

  if (amount === null) {
    amount = proposed - current;
  }

  if (percent === null) {
    percent = current > 0 ? (amount / current) * 100 : null;
  }

  if (proposed < 0) {
    throw new Error("เงินเดือนใหม่ต้องไม่น้อยกว่า 0");
  }

  return {
    current_salary: Number(current.toFixed(2)),
    adjustment_amount: Number(amount.toFixed(2)),
    adjustment_percent:
      percent === null ? null : Number(percent.toFixed(4)),
    proposed_salary: Number(proposed.toFixed(2)),
  };
}
