"use client";

import { useCallback, useMemo } from "react";

import useAuth from "@/hooks/useAuth";

export default function useAccessScope() {
  const {
    user,
    loadingUser,
  } = useAuth();

  const access = useMemo(
    () => ({
      hasAllScope:
        Boolean(
          user?.has_all_scope ||
          user?.is_super_admin
        ),

      companyIds:
        user?.allowed_company_ids ||
        [],

      branchGroupIds:
        user
          ?.allowed_branch_group_ids ||
        [],

      branchIds:
        user?.allowed_branch_ids ||
        [],

      departmentIds:
        user
          ?.allowed_department_ids ||
        [],

      divisionIds:
        user
          ?.allowed_division_ids ||
        [],

      unitIds:
        user?.allowed_unit_ids ||
        [],

      assignments:
        user?.access_assignments ||
        [],
    }),
    [user]
  );

  const hasPermission =
    useCallback(
      (permissionCode) => {
        if (
          user?.is_super_admin
        ) {
          return true;
        }

        return (
          user?.permissions || []
        ).includes(
          permissionCode
        );
      },
      [user]
    );

  const canAccessBranch =
    useCallback(
      (branchId) => {
        if (access.hasAllScope) {
          return true;
        }

        return access.branchIds.includes(
          branchId
        );
      },
      [
        access.branchIds,
        access.hasAllScope,
      ]
    );

  const canAccessCompany =
    useCallback(
      (companyId) => {
        if (access.hasAllScope) {
          return true;
        }

        return access.companyIds.includes(
          companyId
        );
      },
      [
        access.companyIds,
        access.hasAllScope,
      ]
    );

  const filterBranches =
    useCallback(
      (branches = []) => {
        if (access.hasAllScope) {
          return branches;
        }

        return branches.filter(
          (branch) =>
            access.branchIds.includes(
              branch.id
            )
        );
      },
      [
        access.branchIds,
        access.hasAllScope,
      ]
    );

  const filterCompanies =
    useCallback(
      (companies = []) => {
        if (access.hasAllScope) {
          return companies;
        }

        return companies.filter(
          (company) =>
            access.companyIds.includes(
              company.id
            )
        );
      },
      [
        access.companyIds,
        access.hasAllScope,
      ]
    );

  return {
    user,
    loadingUser,

    ...access,

    hasPermission,

    canAccessBranch,
    canAccessCompany,

    filterBranches,
    filterCompanies,
  };
}