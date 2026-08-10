"use client";

import {useCallback,useMemo,} from "react";
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

export default function useScopedPermissions(module,
  {
    scopeType = null,
    redirectTo = "/admin",
    /*
     * ใช้กับ Root Master เช่น companies
     *
     * create company ใหม่
     * ต้อง all scope
     */
    createRequiresAllScope = false,
  } = {}
) {
  /* =========================================================
     Permission
  ========================================================= */

  const permissions =
    usePermissions(
      module,
      {
        redirectTo,
      }
    );

  const {
    user,
    loadingUser,

    can,
    canView,

    canCreate:
      canCreatePermission,

    canEdit:
      canEditPermission,

    canDelete:
      canDeletePermission,
  } = permissions;

  /* =========================================================
     Access Scope
  ========================================================= */

  const accessScope =
    useAccessScope();

  const {
    hasAllScope,

    accessibleCompanyIds =
      [],

    accessibleBranchGroupIds =
      [],

    accessibleBranchIds =
      [],

    accessibleDepartmentIds =
      [],

    accessibleDivisionIds =
      [],

    accessibleUnitIds =
      [],
  } = accessScope;

  /* =========================================================
     Scope Collection
  ========================================================= */

  const scopeCollections =
    useMemo(
      () => ({
        accessibleCompanyIds,

        accessibleBranchGroupIds,

        accessibleBranchIds,

        accessibleDepartmentIds,

        accessibleDivisionIds,

        accessibleUnitIds,
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

  /* =========================================================
     Accessible IDs
  ========================================================= */

  const accessibleIds =
    useMemo(() => {
      if (!scopeType) {
        return [];
      }

      const collectionKey =
        SCOPE_TYPES[
          scopeType
        ];

      if (!collectionKey) {
        return [];
      }

      return (
        scopeCollections[
          collectionKey
        ] || []
      ).map(String);
    }, [
      scopeType,
      scopeCollections,
    ]);

  /* =========================================================
     Accessible ID Set
  ========================================================= */

  const accessibleIdSet =
    useMemo(
      () =>
        new Set(
          accessibleIds
        ),
      [accessibleIds]
    );

  /* =========================================================
     Scope Checker
  ========================================================= */

  const canAccessId =
    useCallback(
      (id) => {
        /*
         * SUPER_ADMIN / all scope
         */
        if (
          hasAllScope
        ) {
          return true;
        }

        if (!id) {
          return false;
        }

        /*
         * หน้าไม่มี Scope
         */
        if (
          !scopeType
        ) {
          return true;
        }

        return accessibleIdSet.has(
          String(id)
        );
      },
      [
        hasAllScope,
        scopeType,
        accessibleIdSet,
      ]
    );

  /* =========================================================
     Record Scope Checker
  ========================================================= */

  const canAccessRecord =
    useCallback(
      (
        record,
        idField = "id"
      ) => {
        if (!record) {
          return false;
        }

        return canAccessId(
          record?.[
            idField
          ]
        );
      },
      [canAccessId]
    );

  /* =========================================================
     CREATE
  ========================================================= */

  const canCreate =
    canCreatePermission &&
    (
      !createRequiresAllScope ||
      hasAllScope
    );

  /* =========================================================
     EDIT
  ========================================================= */

  const canEditRecord =
    useCallback(
      (
        record,
        idField = "id"
      ) =>
        canEditPermission &&
        canAccessRecord(
          record,
          idField
        ),
      [
        canEditPermission,
        canAccessRecord,
      ]
    );

  /* =========================================================
     DELETE
  ========================================================= */

  const canDeleteRecord =
    useCallback(
      (
        record,
        idField = "id"
      ) =>
        canDeletePermission &&
        canAccessRecord(
          record,
          idField
        ),
      [
        canDeletePermission,
        canAccessRecord,
      ]
    );

  /* =========================================================
     VIEW Record
  ========================================================= */

  const canViewRecord =
    useCallback(
      (
        record,
        idField = "id"
      ) =>
        canView &&
        canAccessRecord(
          record,
          idField
        ),
      [
        canView,
        canAccessRecord,
      ]
    );

  /* =========================================================
     Return
  ========================================================= */

  return {
    user,
    loadingUser,

    /* Permission */

    can,

    canView,

    canCreate,

    canEdit:
      canEditPermission,

    canDelete:
      canDeletePermission,

    /* Raw Permission */

    canCreatePermission,

    canEditPermission,

    canDeletePermission,

    /* Scope */

    hasAllScope,

    accessibleIds,

    canAccessId,

    canAccessRecord,

    /* Permission + Scope */

    canViewRecord,

    canEditRecord,

    canDeleteRecord,

    /* Full Scope */

    ...accessScope,
  };
}