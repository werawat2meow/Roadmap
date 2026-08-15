import {
  buildUserAccessContext,
  loadUserAccountById,
} from "@/lib/auth/buildUserAccessContext";

export async function getUserAccessContext(userAccountId) {
  const userAccount = await loadUserAccountById(userAccountId);

  if (!userAccount || !userAccount.is_active) {
    return {
      user_account_id: userAccountId,
      is_super_admin: false,
      permissions: [],
      access_assignments: [],
      assignments: [],
      role_ids: [],
      has_all_scope: false,
      allowed_company_ids: [],
      allowed_branch_group_ids: [],
      allowed_branch_ids: [],
      allowed_department_ids: [],
      allowed_division_ids: [],
      allowed_unit_ids: [],
    };
  }

  const user = await buildUserAccessContext(userAccount);
  const accessAssignments = Array.isArray(user.access_assignments)
    ? user.access_assignments
    : [];

  return {
    user_account_id: user.id,
    is_super_admin: Boolean(user.is_super_admin),
    permissions: Array.isArray(user.permissions) ? user.permissions : [],

    // ชื่อหลักที่ Backend Scope ใช้
    access_assignments: accessAssignments,

    // compatibility กับโค้ดเก่าที่เคยอ่าน assignments
    assignments: accessAssignments,

    role_ids: Array.isArray(user.role_ids) ? user.role_ids : [],
    has_all_scope: Boolean(user.has_all_scope),
    allowed_company_ids: user.allowed_company_ids || [],
    allowed_branch_group_ids: user.allowed_branch_group_ids || [],
    allowed_branch_ids: user.allowed_branch_ids || [],
    allowed_department_ids: user.allowed_department_ids || [],
    allowed_division_ids: user.allowed_division_ids || [],
    allowed_unit_ids: user.allowed_unit_ids || [],
  };
}
