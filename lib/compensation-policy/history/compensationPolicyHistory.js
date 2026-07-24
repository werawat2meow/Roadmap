/**
 * ============================================================
 * Module : Compensation Policy
 * File : compensationPolicyHistory.js
 * Layer : History
 * Version : 1.0.0
 * Status : Production
 * ============================================================
 */

import { createHistory } from "../repositories/compensationPolicyRepository";

/* ===========================================================
    Action
=========================================================== */

export const POLICY_HISTORY_ACTION = Object.freeze({

  CREATE: "CREATE",

  UPDATE: "UPDATE",

  DELETE: "DELETE",

  APPROVE: "APPROVE",

  REJECT: "REJECT",

  ARCHIVE: "ARCHIVE",

  UNARCHIVE: "UNARCHIVE",

  DUPLICATE: "DUPLICATE",

  IMPORT: "IMPORT",

  EXPORT: "EXPORT",

  RESTORE: "RESTORE",

});


/* ===========================================================
    Write History
=========================================================== */

export async function writePolicyHistory({

  policyId,

  action,

  userId,

  remark = null,

  oldValue = null,

  newValue = null,

}) {

  const payload = {

    policy_id: policyId,

    action,

    remark,

    old_value: oldValue,

    new_value: newValue,

    created_by: userId,

  };

  const { error } =
    await createHistory(payload);

  if (error) {
    throw error;
  }

}

/* ===========================================================
    Shortcut
=========================================================== */

export async function logCreate(
  policyId,
  userId
) {

  return writePolicyHistory({

    policyId,

    userId,

    action:
      POLICY_HISTORY_ACTION.CREATE,

  });

}

export async function logUpdate(
  policyId,
  userId,
  oldValue,
  newValue
) {

  return writePolicyHistory({

    policyId,

    userId,

    action:
      POLICY_HISTORY_ACTION.UPDATE,

    oldValue,

    newValue,

  });

}

export async function logDelete(
  policyId,
  userId
) {

  return writePolicyHistory({

    policyId,

    userId,

    action:
      POLICY_HISTORY_ACTION.DELETE,

  });

}

export async function logApprove(
  policyId,
  userId
) {

  return writePolicyHistory({

    policyId,

    userId,

    action:
      POLICY_HISTORY_ACTION.APPROVE,

  });

}

export async function logArchive(
  policyId,
  userId
) {

  return writePolicyHistory({

    policyId,

    userId,

    action:
      POLICY_HISTORY_ACTION.ARCHIVE,

  });

}

export async function logDuplicate(
  policyId,
  userId
) {

  return writePolicyHistory({

    policyId,

    userId,

    action:
      POLICY_HISTORY_ACTION.DUPLICATE,

  });

}