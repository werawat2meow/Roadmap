import {
  COMPENSATION_POLICY_STATUS,
  COMPENSATION_CALCULATION_TYPE,
  COMPENSATION_SCOPE_TYPE,
  COMPENSATION_APPROVER_TYPE,
} from "../constants";

export class CompensationPolicyValidator {

  /* ===========================
      Policy
  =========================== */

  static validatePolicy(policy = {}) {

    const errors = [];

    if (!policy.policy_name?.trim()) {
      errors.push("Policy Name is required.");
    }

    if (
      policy.status &&
      !Object.values(COMPENSATION_POLICY_STATUS).includes(
        policy.status
      )
    ) {
      errors.push("Invalid policy status.");
    }

    if (
      policy.effective_date &&
      policy.expire_date
    ) {

      if (
        new Date(policy.expire_date) <
        new Date(policy.effective_date)
      ) {
        errors.push(
          "Expire Date must be greater than Effective Date."
        );
      }

    }

    return errors;

  }

  /* ===========================
      Scope
  =========================== */

  static validateScopes(scopes = []) {

    const errors = [];

    scopes.forEach((scope, index) => {

      if (
        !Object.values(
          COMPENSATION_SCOPE_TYPE
        ).includes(scope.scope_type)
      ) {

        errors.push(
          `Scope #${index + 1} : Invalid scope type.`
        );

      }

      switch (scope.scope_type) {

        case COMPENSATION_SCOPE_TYPE.COMPANY:

          if (!scope.company_id) {
            errors.push(
              `Scope #${index + 1} : Company is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.BRANCH:

          if (!scope.branch_id) {
            errors.push(
              `Scope #${index + 1} : Branch is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.DEPARTMENT:

          if (!scope.department_id) {
            errors.push(
              `Scope #${index + 1} : Department is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.DIVISION:

          if (!scope.division_id) {
            errors.push(
              `Scope #${index + 1} : Division is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.UNIT:

          if (!scope.unit_id) {
            errors.push(
              `Scope #${index + 1} : Unit is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.POSITION:

          if (!scope.position_id) {
            errors.push(
              `Scope #${index + 1} : Position is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.POSITION_LEVEL:

          if (!scope.position_level_id) {
            errors.push(
              `Scope #${index + 1} : Position Level is required.`
            );
          }

          break;

        case COMPENSATION_SCOPE_TYPE.POSITION_LEVEL_BAND:

          if (!scope.position_level_band_id) {
            errors.push(
              `Scope #${index + 1} : Position Level Band is required.`
            );
          }

          break;

      }

    });

    return errors;

  }

  /* ===========================
      Rules
  =========================== */

  static validateRules(rules = []) {

    const errors = [];

    rules.forEach((rule, index) => {

      if (!rule.rule_name?.trim()) {

        errors.push(
          `Rule #${index + 1} : Rule Name is required.`
        );

      }

      if (
        !Object.values(
          COMPENSATION_CALCULATION_TYPE
        ).includes(rule.calculation_type)
      ) {

        errors.push(
          `Rule #${index + 1} : Invalid Calculation Type.`
        );

      }

      if (
        rule.calculation_type ===
        COMPENSATION_CALCULATION_TYPE.FIXED
      ) {

        if (rule.fixed_amount == null) {

          errors.push(
            `Rule #${index + 1} : Fixed Amount is required.`
          );

        }

      }

      if (
        rule.calculation_type ===
        COMPENSATION_CALCULATION_TYPE.PERCENTAGE
      ) {

        if (rule.percentage == null) {

          errors.push(
            `Rule #${index + 1} : Percentage is required.`
          );

        }

      }

      if (
        rule.calculation_type ===
        COMPENSATION_CALCULATION_TYPE.TIER
      ) {

        if (
          !Array.isArray(rule.tiers) ||
          rule.tiers.length === 0
        ) {

          errors.push(
            `Rule #${index + 1} : Tier is required.`
          );

        }

      }

    });

    return errors;

  }

  /* ===========================
      Approval
  =========================== */

  static validateApprovals(
    approvals = []
  ) {

    const errors = [];

    approvals.forEach(
      (approval, index) => {

        if (
          !Object.values(
            COMPENSATION_APPROVER_TYPE
          ).includes(
            approval.approver_type
          )
        ) {

          errors.push(
            `Approval #${index + 1} : Invalid Approver Type.`
          );

        }

        if (
          approval.approver_type ===
          COMPENSATION_APPROVER_TYPE.EMPLOYEE
        ) {

          if (!approval.employee_id) {

            errors.push(
              `Approval #${index + 1} : Employee is required.`
            );

          }

        }

        if (
          approval.approver_type ===
          COMPENSATION_APPROVER_TYPE.ROLE
        ) {

          if (!approval.role_id) {

            errors.push(
              `Approval #${index + 1} : Role is required.`
            );

          }

        }

      }
    );

    return errors;

  }

  /* ===========================
      All
  =========================== */

  static validate(body = {}) {

    const errors = [];

    errors.push(
      ...this.validatePolicy(
        body.policy
      )
    );

    errors.push(
      ...this.validateScopes(
        body.scopes
      )
    );

    errors.push(
      ...this.validateRules(
        body.rules
      )
    );

    errors.push(
      ...this.validateApprovals(
        body.approvals
      )
    );

    return errors;

  }

}