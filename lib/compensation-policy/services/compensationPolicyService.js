/**
 * ============================================================
 * Module : Compensation Policy
 * File : compensationPolicyService.js
 * Layer : Service
 * Description : Business Logic Layer
 * Version : 1.0.0
 * ============================================================
 */

import { ValidationError } from "@/lib/core/errors/ValidationError";

import { CompensationPolicyValidator } from "../validators/compensationPolicyValidator";

import {
  mapPolicyPayload,
  mapScopes,
  mapRule,
  mapRuleTiers,
  mapApprovals,
} from "../mappers/compensationPolicyMapper";

import {
  listPolicies,
  findPolicyById,
  findPolicyByCode,

  createPolicy,
  updatePolicy,
  deletePolicy,

  createScopes,
  updateScope,
  deleteScope,
  findScopesByPolicyId,

  createRule,
  updateRule,
  deleteRule,
  findRulesByPolicyId,

  createRuleTiers,
  updateRuleTier,
  deleteRuleTier,
  findRuleTiersByRuleId,

  createApprovals,
  updateApproval,
  deleteApproval,
  findApprovalsByPolicyId,

} from "../repositories/compensationPolicyRepository";

import {
  generatePolicyCode,
} from "../generators/compensationPolicyCodeGenerator";

import {
  logCreate,
  logUpdate,
  logDelete,
  logApprove,
  logArchive,
  logDuplicate,
} from "../history/compensationPolicyHistory";

/* ============================================================
   Validation
============================================================ */

async function validateRequest(body) {

  const errors =
    CompensationPolicyValidator.validate(body);

  if (errors.length > 0) {

    throw new ValidationError(
      errors.join("\n")
    );

  }

}

async function ensurePolicyExists(id) {

  const {
    data,
    error,
  } = await findPolicyById(id);

  if (error) {
    throw error;
  }

  if (!data) {

    throw new ValidationError(
      "Compensation Policy not found."
    );

  }

  return data;

}

async function ensurePolicyCodeNotExists(
  policyCode
) {

  const {
    data,
    error,
  } = await findPolicyByCode(policyCode);

  if (error) {
    throw error;
  }

  if (data) {

    throw new ValidationError(
      `Policy Code "${policyCode}" already exists.`
    );

  }

}

/* ============================================================
   Pagination
============================================================ */

function buildPagination(
  page,
  pageSize,
  total
) {

  return {

    page,

    pageSize,

    total,

    totalPages:
      Math.ceil(total / pageSize),

  };

}

/* ============================================================
   Diff Helper
============================================================ */

function splitChanges(
  oldItems = [],
  newItems = [],
  key = "id"
) {

  const oldMap =
    new Map(
      oldItems.map(
        (item) => [item[key], item]
      )
    );

  const newMap =
    new Map(
      newItems.map(
        (item) => [item[key], item]
      )
    );

  const added = [];

  const updated = [];

  const removed = [];

  for (const item of newItems) {

    if (
      !item[key] ||
      !oldMap.has(item[key])
    ) {

      added.push(item);

    } else {

      updated.push({

        old:
          oldMap.get(item[key]),

        new:
          item,

      });

    }

  }

  for (const item of oldItems) {

    if (!newMap.has(item[key])) {

      removed.push(item);

    }

  }

  return {

    added,

    updated,

    removed,

  };

}

/* ============================================================
   Query
============================================================ */

export async function listCompensationPolicies(
  filters = {}
) {

  const page =
    Number(filters.page) || 1;

  const pageSize =
    Number(filters.pageSize) || 20;

  const {
    data,
    count,
    error,
  } = await listPolicies({

    ...filters,

    page,

    pageSize,

  });

  if (error) {
    throw error;
  }

  return {

    success: true,

    data,

    pagination:
      buildPagination(
        page,
        pageSize,
        count || 0
      ),

  };

}

export async function getCompensationPolicy(id) {
  const policy = await ensurePolicyExists(id);
  return {
    success: true,
    data: policy,
  };
}


/* ============================================================
   Create
============================================================ */

export async function createCompensationPolicy(
  body,
  userId
) {

  /* ----------------------------------------
      Validate
  ---------------------------------------- */

  await validateRequest(body);

  /* ----------------------------------------
      Generate Policy Code
  ---------------------------------------- */

  const policyCode =
    await generatePolicyCode();

  await ensurePolicyCodeNotExists(
    policyCode
  );

  /* ----------------------------------------
      Policy Payload
  ---------------------------------------- */

  const payload =
    mapPolicyPayload(
      {
        ...body,
        policy_code: policyCode,
      },
      userId
    );

  /* ----------------------------------------
      Create Policy
  ---------------------------------------- */

  const {
    data: policy,
    error: policyError,
  } = await createPolicy(
    payload
  );

  if (policyError) {
    throw policyError;
  }

  const policyId = policy.id;

  /* ----------------------------------------
      Create Scopes
  ---------------------------------------- */

  await createPolicyScopes(
    policyId,
    body.scopes ?? []
  );

  /* ----------------------------------------
      Create Rules
  ---------------------------------------- */

  await createPolicyRules(
    policyId,
    body.rules ?? []
  );

  /* ----------------------------------------
      Create Approvals
  ---------------------------------------- */

  await createPolicyApprovals(
    policyId,
    body.approvals ?? []
  );

  /* ----------------------------------------
      History
  ---------------------------------------- */

  await logCreate(
    policyId,
    userId
  );

  return {

    success: true,

    message:
      "Compensation Policy created successfully.",

    data: policy,

  };

}
/* ============================================================
   Create Scope
============================================================ */

async function createPolicyScopes(
  policyId,
  scopes = []
) {

  if (
    !Array.isArray(scopes) ||
    scopes.length === 0
  ) {
    return;
  }

  const rows =
    mapScopes(
      policyId,
      scopes
    );

  const {
    error,
  } = await createScopes(
    rows
  );

  if (error) {
    throw error;
  }

}

/* ============================================================
   Create Rules
============================================================ */

async function createPolicyRules(
  policyId,
  rules = []
) {

  if (
    !Array.isArray(rules) ||
    rules.length === 0
  ) {
    return;
  }

  for (const rule of rules) {

    const rulePayload =
      mapRule(
        policyId,
        rule
      );

    const {
      data: createdRule,
      error,
    } = await createRule(
      rulePayload
    );

    if (error) {
      throw error;
    }

    await createPolicyRuleTiers(
      createdRule.id,
      rule.tiers ?? []
    );

  }

}
/* ============================================================
   Create Rule Tier
============================================================ */

async function createPolicyRuleTiers(
  ruleId,
  tiers = []
) {

  if (
    !Array.isArray(tiers) ||
    tiers.length === 0
  ) {
    return;
  }

  const rows =
    mapRuleTiers(
      ruleId,
      tiers
    );

  const {
    error,
  } = await createRuleTiers(
    rows
  );

  if (error) {
    throw error;
  }

}
/* ============================================================
   Create Approval
============================================================ */

async function createPolicyApprovals(
  policyId,
  approvals = []
) {

  if (
    !Array.isArray(approvals) ||
    approvals.length === 0
  ) {
    return;
  }

  const rows =
    mapApprovals(
      policyId,
      approvals
    );

  const {
    error,
  } = await createApprovals(
    rows
  );

  if (error) {
    throw error;
  }

}

/* ============================================================
   Update
============================================================ */

export async function updateCompensationPolicy(
  id,
  body,
  userId
) {

  /* ----------------------------------------
      Validate
  ---------------------------------------- */

  await validateRequest(body);

  /* ----------------------------------------
      Current Policy
  ---------------------------------------- */

  const oldPolicy =
    await ensurePolicyExists(id);

  /* ----------------------------------------
      Duplicate Code
  ---------------------------------------- */

  if (
    body.policy_code &&
    body.policy_code !== oldPolicy.policy_code
  ) {

    await ensurePolicyCodeNotExists(
      body.policy_code
    );

  }

  /* ----------------------------------------
      Update Policy
  ---------------------------------------- */

  const payload =
    mapPolicyPayload(
      {
        ...body,
        policy_code:
          body.policy_code ??
          oldPolicy.policy_code,
      },
      userId
    );

  const {
    data: updatedPolicy,
    error,
  } = await updatePolicy(
    id,
    payload
  );

  if (error) {
    throw error;
  }

  /* ----------------------------------------
      Sync Child Data
  ---------------------------------------- */

  await syncPolicyScopes(
    id,
    body.scopes ?? []
  );

  await syncPolicyRules(
    id,
    body.rules ?? []
  );

  await syncPolicyApprovals(
    id,
    body.approvals ?? []
  );

  /* ----------------------------------------
      History
  ---------------------------------------- */

  await logUpdate(
    id,
    userId,
    oldPolicy,
    updatedPolicy
  );

  return {

    success: true,

    message:
      "Compensation Policy updated successfully.",

    data: updatedPolicy,

  };

}

/* ============================================================
   Sync Scope
============================================================ */

async function syncPolicyScopes(
  policyId,
  scopes = []
) {

  const {
    data: currentScopes,
    error,
  } =
    await findScopesByPolicyId(
      policyId
    );

  if (error) {
    throw error;
  }

  const diff =
    splitChanges(
      currentScopes ?? [],
      scopes
    );

  for (const item of diff.added) {

    await createScopes(
      mapScopes(
        policyId,
        [item]
      )
    );

  }

  for (const item of diff.updated) {

    await updateScope(

      item.new.id,

      mapScopes(
        policyId,
        [item.new]
      )[0]

    );

  }

  for (const item of diff.removed) {

    await deleteScope(
      item.id
    );

  }

}

/* ============================================================
   Sync Approval
============================================================ */

async function syncPolicyApprovals(
  policyId,
  approvals = []
) {

  const {
    data: currentApprovals,
    error,
  } =
    await findApprovalsByPolicyId(
      policyId
    );

  if (error) {
    throw error;
  }

  const diff =
    splitChanges(
      currentApprovals ?? [],
      approvals
    );

  for (const item of diff.added) {

    await createApprovals(

      mapApprovals(
        policyId,
        [item]
      )

    );

  }

  for (const item of diff.updated) {

    await updateApproval(

      item.new.id,

      mapApprovals(
        policyId,
        [item.new]
      )[0]

    );

  }

  for (const item of diff.removed) {

    await deleteApproval(
      item.id
    );

  }

}

/* ============================================================
   Sync Rule
============================================================ */

async function syncPolicyRules(
  policyId,
  rules = []
) {

  const {
    data: currentRules,
    error,
  } =
    await findRulesByPolicyId(
      policyId
    );

  if (error) {
    throw error;
  }

  const diff =
    splitChanges(
      currentRules ?? [],
      rules
    );

  /* --------------------------
      Added
  -------------------------- */

  for (const item of diff.added) {

    const {
      data: rule,
      error,
    } =
      await createRule(

        mapRule(
          policyId,
          item
        )

      );

    if (error) {
      throw error;
    }

    await createPolicyRuleTiers(

      rule.id,

      item.tiers ?? []

    );

  }

  /* --------------------------
      Updated
  -------------------------- */

  for (const item of diff.updated) {

    await updateRule(

      item.new.id,

      mapRule(
        policyId,
        item.new
      )

    );

    await syncPolicyRuleTiers(

      item.new.id,

      item.new.tiers ?? []

    );

  }

  /* --------------------------
      Removed
  -------------------------- */

  for (const item of diff.removed) {

    await deleteRule(
      item.id
    );

  }

}

