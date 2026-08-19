"use client";

import { useCallback, useMemo } from "react";
import usePermissions from "@/hooks/usePermissions";
import useAccessScope from "@/hooks/useAccessScope";

const SCOPE_TYPES = {
  company: "accessibleCompanyIds",
  branch_group: "accessibleBranchGroupIds",
  branch: "accessibleBranchIds",
  department: "accessibleDepartmentIds",
  division: "accessibleDivisionIds",
  unit: "accessibleUnitIds",
};

function uniqueIds(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .filter(Boolean)
        .map(String)
    ),
  ];
}

export default function useScopedPermissions(
  module,
  {
    scopeType = null,
    redirectTo = "/admin",
    createRequiresAllScope = false,
  } = {}
) {
  const permissions = usePermissions(module, { redirectTo });

  const {
    user,
    loadingUser,
    can,
    canView,
    canCreate: canCreatePermission,
    canEdit: canEditPermission,
    canDelete: canDeletePermission,
  } = permissions;

  const accessScope = useAccessScope();

  const {
    hasAllScope,
    hasAnyScope,
    accessibleCompanyIds = [],
    accessibleBranchGroupIds = [],
    accessibleBranchIds = [],
    accessibleDepartmentIds = [],
    accessibleDivisionIds = [],
    accessibleUnitIds = [],
  } = accessScope;

  const scopeCollections = useMemo(
    () => ({
      accessibleCompanyIds: uniqueIds(accessibleCompanyIds),
      accessibleBranchGroupIds: uniqueIds(accessibleBranchGroupIds),
      accessibleBranchIds: uniqueIds(accessibleBranchIds),
      accessibleDepartmentIds: uniqueIds(accessibleDepartmentIds),
      accessibleDivisionIds: uniqueIds(accessibleDivisionIds),
      accessibleUnitIds: uniqueIds(accessibleUnitIds),
    }),
    [
      accessibleCompanyIds,
      accessibleBranchGroupIds,
      accessibleBranchIds,
      accessibleDepartmentIds,
      accessibleDivisionIds,
      accessibleUnitIds,
    ]
  );

  const accessibleIds = useMemo(() => {
    if (!scopeType || scopeType === "employee") {
      return [];
    }

    const collectionKey = SCOPE_TYPES[scopeType];
    if (!collectionKey) {
      return [];
    }

    return scopeCollections[collectionKey] || [];
  }, [scopeType, scopeCollections]);

  const accessibleIdSet = useMemo(
    () => new Set(accessibleIds.map(String)),
    [accessibleIds]
  );

  const canAccessId = useCallback(
    (id) => {
      if (hasAllScope || !hasAnyScope) {
        return true;
      }

      if (!scopeType || scopeType === "employee") {
        return true;
      }

      if (!id) {
        return false;
      }

      return accessibleIdSet.has(String(id));
    },
    [hasAllScope, hasAnyScope, scopeType, accessibleIdSet]
  );

  /*
   * Frontend UX เท่านั้น
   * Backend API เป็นตัวบังคับ Scope จริง
   *
   * ใช้ JSON ของ Current User:
   * allowed_company_ids[]
   * allowed_branch_group_ids[]
   * allowed_branch_ids[]
   * allowed_department_ids[]
   * allowed_division_ids[]
   * allowed_unit_ids[]
   *
   * หลาย ID ในระดับเดียวกัน = OR
   * คนละระดับที่มีค่า = AND
   */
  const canAccessEmployeeRecord = useCallback(
    (record) => {
      if (!record) {
        return false;
      }

      if (
        hasAllScope ||
        !hasAnyScope ||
        user?.is_super_admin === true
      ) {
        return true;
      }

      const checks = [
        [scopeCollections.accessibleCompanyIds, record.company_id],
        [
          scopeCollections.accessibleBranchGroupIds,
          record.branch_group_id,
        ],
        [scopeCollections.accessibleBranchIds, record.branch_id],
        [scopeCollections.accessibleDepartmentIds, record.department_id],
        [scopeCollections.accessibleDivisionIds, record.division_id],
        [scopeCollections.accessibleUnitIds, record.unit_id],
      ];

      let hasConstraint = false;

      for (const [ids, value] of checks) {
        if (!ids.length) {
          continue;
        }

        hasConstraint = true;

        if (!value || !ids.includes(String(value))) {
          return false;
        }
      }

      return hasConstraint;
    },
    [hasAllScope, hasAnyScope, user?.is_super_admin, scopeCollections]
  );

  const canAccessRecord = useCallback(
    (record, idField = "id") => {
      if (!record) {
        return false;
      }

      if (scopeType === "employee") {
        return canAccessEmployeeRecord(record);
      }

      return canAccessId(record?.[idField]);
    },
    [scopeType, canAccessId, canAccessEmployeeRecord]
  );

  const effectiveAllScope =
    hasAllScope || !hasAnyScope;

  const canCreate =
    canCreatePermission &&
    (!createRequiresAllScope || effectiveAllScope);

  const canViewRecord = useCallback(
    (record, idField = "id") => {
      if (!canView) {
        return false;
      }

      return canAccessRecord(record, idField);
    },
    [canView, canAccessRecord]
  );

  const canEditRecord = useCallback(
    (record, idField = "id") => {
      if (!canEditPermission) {
        return false;
      }

      return canAccessRecord(record, idField);
    },
    [canEditPermission, canAccessRecord]
  );

  const canDeleteRecord = useCallback(
    (record, idField = "id") => {
      if (!canDeletePermission) {
        return false;
      }

      return canAccessRecord(record, idField);
    },
    [canDeletePermission, canAccessRecord]
  );

  return {
    user,
    loadingUser,

    ...accessScope,

    can,
    canView,
    canCreate,
    canEdit: canEditPermission,
    canDelete: canDeletePermission,

    canCreatePermission,
    canEditPermission,
    canDeletePermission,

    hasAllScope,
    hasAnyScope,
    effectiveAllScope,
    accessibleIds,
    canAccessId,
    canAccessRecord,
    canAccessEmployeeRecord,
    canViewRecord,
    canEditRecord,
    canDeleteRecord,
  };
}
