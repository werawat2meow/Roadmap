/* =========================================================
    Policy
========================================================= */

export function mapPolicyPayload(body = {}, userId = null) {
  return {
    policy_code: body.policy_code?.trim() || null,
    policy_name: body.policy_name?.trim() || "",
    description: body.description?.trim() || null,

    company_id: body.company_id || null,

    effective_date: body.effective_date || null,
    expire_date: body.expire_date || null,

    version_no: body.version_no ?? 1,

    status: body.status || "draft",

    is_active:
      body.is_active === undefined
        ? true
        : Boolean(body.is_active),

    created_by: userId,
    updated_by: userId,
  };
}

/* =========================================================
    Scope
========================================================= */

export function mapScopes(policyId, scopes = []) {
  return scopes.map((scope) => ({
    policy_id: policyId,

    scope_type: scope.scope_type,

    company_id: scope.company_id || null,
    branch_id: scope.branch_id || null,
    department_id: scope.department_id || null,
    division_id: scope.division_id || null,
    unit_id: scope.unit_id || null,

    position_id: scope.position_id || null,
    position_level_id:
      scope.position_level_id || null,
    position_level_band_id:
      scope.position_level_band_id || null,
  }));
}

/* =========================================================
    Rules
========================================================= */

export function mapRule(policyId, rule = {}) {
  return {
    policy_id: policyId,

    rule_name: rule.rule_name?.trim() || "",

    calculation_type:
      rule.calculation_type,

    fixed_amount:
      rule.fixed_amount ?? null,

    percentage:
      rule.percentage ?? null,

    min_amount:
      rule.min_amount ?? null,

    max_amount:
      rule.max_amount ?? null,

    rounding_method:
      rule.rounding_method || "none",

    remark:
      rule.remark?.trim() || null,
  };
}

/* =========================================================
    Rule Tier
========================================================= */

export function mapRuleTiers(
  ruleId,
  tiers = []
) {
  return tiers.map((tier, index) => ({
    rule_id: ruleId,

    sequence_no:
      tier.sequence_no ?? index + 1,

    min_value:
      tier.min_value ?? null,

    max_value:
      tier.max_value ?? null,

    amount:
      tier.amount ?? null,

    percentage:
      tier.percentage ?? null,
  }));
}

/* =========================================================
    Approval
========================================================= */

export function mapApprovals(
  policyId,
  approvals = []
) {
  return approvals.map(
    (approval, index) => ({
      policy_id: policyId,

      sequence_no:
        approval.sequence_no ??
        index + 1,

      approver_type:
        approval.approver_type,

      employee_id:
        approval.employee_id || null,

      role_id:
        approval.role_id || null,
    })
  );
}