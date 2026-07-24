import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
    Base Query
========================================================= */

function baseQuery() {
  return supabaseAdmin
    .from("compensation_policies")
    .select(`
      *,
      companies (
        id,
        company_code,
        company_name_th,
        company_name_en
      )
    `);
}

/* =========================================================
    Policy
========================================================= */

export async function findPolicyById(id) {
  return await baseQuery()
    .eq("id", id)
    .single();
}

export async function findPolicyByCode(policyCode) {
  return await baseQuery()
    .eq("policy_code", policyCode)
    .single();
}

export async function createPolicy(payload) {
  return await supabaseAdmin
    .from("compensation_policies")
    .insert(payload)
    .select()
    .single();
}

export async function updatePolicy(id, payload) {
  return await supabaseAdmin
    .from("compensation_policies")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
}

export async function deletePolicy(id) {
  return await supabaseAdmin
    .from("compensation_policies")
    .delete()
    .eq("id", id);
}

/* =========================================================
    List
========================================================= */

export async function listPolicies({
  page = 1,
  pageSize = 20,
  search = "",
  companyId = null,
  status = null,
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("compensation_policies")
    .select(
      `
      *,
      companies (
        id,
        company_code,
        company_name_th,
        company_name_en
      )
    `,
      {
        count: "exact",
      }
    );

  if (search) {
    query = query.or(
      [
        `policy_code.ilike.%${search}%`,
        `policy_name.ilike.%${search}%`,
        `description.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  query = query
    .order("created_at", {
      ascending: false,
    })
    .range(from, to);

  return await query;
}

/* =========================================================
    Scope
========================================================= */

export async function createScopes(rows) {
  if (!rows.length)
    return {
      data: [],
      error: null,
    };

  return await supabaseAdmin
    .from("compensation_policy_scopes")
    .insert(rows)
    .select();
}

export async function getScopes(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_scopes")
    .select("*")
    .eq("policy_id", policyId);
}

export async function deleteScopes(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_scopes")
    .delete()
    .eq("policy_id", policyId);
}

/* =========================================================
    Rule
========================================================= */

export async function createRule(payload) {
  return await supabaseAdmin
    .from("compensation_policy_rules")
    .insert(payload)
    .select()
    .single();
}

export async function getRules(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_rules")
    .select("*")
    .eq("policy_id", policyId)
    .order("created_at");
}

export async function deleteRules(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_rules")
    .delete()
    .eq("policy_id", policyId);
}

/* =========================================================
    Rule Tier
========================================================= */

export async function createRuleTiers(rows) {
  if (!rows.length)
    return {
      data: [],
      error: null,
    };

  return await supabaseAdmin
    .from("compensation_policy_rule_tiers")
    .insert(rows)
    .select();
}

export async function getRuleTiers(ruleId) {
  return await supabaseAdmin
    .from("compensation_policy_rule_tiers")
    .select("*")
    .eq("rule_id", ruleId)
    .order("sequence_no");
}

export async function deleteRuleTiers(ruleId) {
  return await supabaseAdmin
    .from("compensation_policy_rule_tiers")
    .delete()
    .eq("rule_id", ruleId);
}

/* =========================================================
    Approval
========================================================= */

export async function createApprovals(rows) {
  if (!rows.length)
    return {
      data: [],
      error: null,
    };

  return await supabaseAdmin
    .from("compensation_policy_approvals")
    .insert(rows)
    .select();
}

export async function getApprovals(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_approvals")
    .select("*")
    .eq("policy_id", policyId)
    .order("sequence_no");
}

export async function deleteApprovals(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_approvals")
    .delete()
    .eq("policy_id", policyId);
}

/* =========================================================
    History
========================================================= */

export async function createHistory(payload) {
  return await supabaseAdmin
    .from("compensation_policy_history")
    .insert(payload);
}

export async function getHistory(policyId) {
  return await supabaseAdmin
    .from("compensation_policy_history")
    .select("*")
    .eq("policy_id", policyId)
    .order("created_at", {
      ascending: false,
    });
}