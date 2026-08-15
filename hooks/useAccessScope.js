"use client";

import {
  useCallback,
  useMemo,
} from "react";

import useAuth from "@/hooks/useAuth";

/* =========================================================
   Scope Types
========================================================= */

export const ACCESS_SCOPE_TYPES = [
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

function uniqueArray(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .filter(Boolean)
        .map((value) => String(value))
    ),
  ];
}

function createEmptyScopeMap() {
  return {
    company: [],
    branch_group: [],
    branch: [],
    department: [],
    division: [],
    unit: [],
  };
}

function buildScopeMapFromAssignments(
  assignments = []
) {
  const map = createEmptyScopeMap();

  for (const assignment of assignments) {
    if (
      !assignment ||
      assignment.status === "inactive"
    ) {
      continue;
    }

    for (
      const scope of assignment.scopes || []
    ) {
      if (
        !scope ||
        scope.status === "inactive"
      ) {
        continue;
      }

      switch (scope.scope_type) {
        case "company":
          if (scope.company_id) {
            map.company.push(
              String(scope.company_id)
            );
          }
          break;

        case "branch_group":
          if (scope.branch_group_id) {
            map.branch_group.push(
              String(
                scope.branch_group_id
              )
            );
          }
          break;

        case "branch":
          if (scope.branch_id) {
            map.branch.push(
              String(scope.branch_id)
            );
          }
          break;

        case "department":
          if (scope.department_id) {
            map.department.push(
              String(
                scope.department_id
              )
            );
          }
          break;

        case "division":
          if (scope.division_id) {
            map.division.push(
              String(scope.division_id)
            );
          }
          break;

        case "unit":
          if (scope.unit_id) {
            map.unit.push(
              String(scope.unit_id)
            );
          }
          break;

        default:
          break;
      }
    }
  }

  for (const type of ACCESS_SCOPE_TYPES) {
    map[type] = uniqueArray(map[type]);
  }

  return map;
}

/* =========================================================
   Hook

   Frontend = ใช้เพื่อ UX เท่านั้น
   Server API ยังต้อง enforce ด้วย
   userAccessAssignmentScope.js เสมอ
========================================================= */

export function useAccessScopeFromUser(
  user = null,
  loadingUser = false
) {

  const assignments = useMemo(
    () =>
      Array.isArray(
        user?.access_assignments
      )
        ? user.access_assignments
        : [],
    [user?.access_assignments]
  );

  const assignmentScopeMap = useMemo(
    () =>
      buildScopeMapFromAssignments(
        assignments
      ),
    [assignments]
  );

  /*
   * ใช้ allowed_*_ids จาก /api/auth/me เป็นหลัก
   * และ fallback ไปอ่าน assignments เพื่อรองรับข้อมูลเก่า
   */
  const scopeMap = useMemo(
    () => ({
      company: uniqueArray(
        user?.allowed_company_ids?.length
          ? user.allowed_company_ids
          : assignmentScopeMap.company
      ),

      branch_group: uniqueArray(
        user?.allowed_branch_group_ids
          ?.length
          ? user.allowed_branch_group_ids
          : assignmentScopeMap.branch_group
      ),

      branch: uniqueArray(
        user?.allowed_branch_ids?.length
          ? user.allowed_branch_ids
          : assignmentScopeMap.branch
      ),

      department: uniqueArray(
        user?.allowed_department_ids
          ?.length
          ? user.allowed_department_ids
          : assignmentScopeMap.department
      ),

      division: uniqueArray(
        user?.allowed_division_ids?.length
          ? user.allowed_division_ids
          : assignmentScopeMap.division
      ),

      unit: uniqueArray(
        user?.allowed_unit_ids?.length
          ? user.allowed_unit_ids
          : assignmentScopeMap.unit
      ),
    }),
    [
      user?.allowed_company_ids,
      user?.allowed_branch_group_ids,
      user?.allowed_branch_ids,
      user?.allowed_department_ids,
      user?.allowed_division_ids,
      user?.allowed_unit_ids,
      assignmentScopeMap,
    ]
  );

  const hasAllScope = Boolean(
    user?.is_super_admin ||
      user?.has_all_scope
  );

  /*
   * ไม่มี Scope งานเลย = Permission-only ตาม behavior เดิม
   * Frontend จึงไม่ควรซ่อน option/data ด้วย Scope
   */
  const hasAnyScope = useMemo(
    () =>
      hasAllScope ||
      ACCESS_SCOPE_TYPES.some(
        (type) =>
          scopeMap[type]?.length > 0
      ),
    [hasAllScope, scopeMap]
  );

  const primaryAssignment =
    useMemo(
      () =>
        assignments.find(
          (item) =>
            item?.is_primary === true &&
            item?.status !== "inactive"
        ) || null,
      [assignments]
    );

  const getScopeIds = useCallback(
    (scopeType) => {
      if (
        !ACCESS_SCOPE_TYPES.includes(
          scopeType
        )
      ) {
        return [];
      }

      return scopeMap[scopeType] || [];
    },
    [scopeMap]
  );

  const hasScope = useCallback(
    (scopeType, scopeId) => {
      if (hasAllScope || !hasAnyScope) {
        return true;
      }

      if (!scopeType || !scopeId) {
        return false;
      }

      return getScopeIds(
        scopeType
      ).includes(String(scopeId));
    },
    [hasAllScope, hasAnyScope, getScopeIds]
  );

  const canAccessCompany = useCallback(
    (companyId) =>
      hasScope("company", companyId),
    [hasScope]
  );

  const canAccessBranchGroup =
    useCallback(
      (branchGroupId) =>
        hasScope(
          "branch_group",
          branchGroupId
        ),
      [hasScope]
    );

  const canAccessBranch = useCallback(
    (
      branchId,
      companyId = null
    ) => {
      if (hasAllScope || !hasAnyScope) {
        return true;
      }

      if (
        branchId &&
        scopeMap.branch.includes(
          String(branchId)
        )
      ) {
        return true;
      }

      /* company scope ครอบ branch */
      return Boolean(
        companyId &&
          scopeMap.company.includes(
            String(companyId)
          )
      );
    },
    [
      hasAllScope,
      hasAnyScope,
      scopeMap.branch,
      scopeMap.company,
    ]
  );

  const canAccessDepartment =
    useCallback(
      (departmentId) =>
        hasScope(
          "department",
          departmentId
        ),
      [hasScope]
    );

  const canAccessDivision =
    useCallback(
      (
        divisionId,
        departmentId = null
      ) => {
        if (hasAllScope || !hasAnyScope) {
          return true;
        }

        if (
          divisionId &&
          scopeMap.division.includes(
            String(divisionId)
          )
        ) {
          return true;
        }

        return Boolean(
          departmentId &&
            scopeMap.department.includes(
              String(departmentId)
            )
        );
      },
      [
        hasAllScope,
        hasAnyScope,
        scopeMap.division,
        scopeMap.department,
      ]
    );

  const canAccessUnit = useCallback(
    (
      unitId,
      divisionId = null,
      departmentId = null
    ) => {
      if (hasAllScope || !hasAnyScope) {
        return true;
      }

      if (
        unitId &&
        scopeMap.unit.includes(
          String(unitId)
        )
      ) {
        return true;
      }

      if (
        divisionId &&
        scopeMap.division.includes(
          String(divisionId)
        )
      ) {
        return true;
      }

      return Boolean(
        departmentId &&
          scopeMap.department.includes(
            String(departmentId)
          )
      );
    },
    [
      hasAllScope,
      hasAnyScope,
      scopeMap.unit,
      scopeMap.division,
      scopeMap.department,
    ]
  );

  /* =======================================================
     Can Access Record

     ใช้ allowed_*_ids ของ Current User:
     - หลาย ID ในระดับเดียวกัน = OR
     - คนละระดับที่มีค่า = AND
======================================================= */

  const canAccessRecord = useCallback(
    (record = {}) => {
      if (hasAllScope || !hasAnyScope) {
        return true;
      }

      if (!record) {
        return false;
      }

      let hasConstraint = false;

      const checks = [
        [scopeMap.company, record.company_id],
        [scopeMap.branch_group, record.branch_group_id],
        [scopeMap.branch, record.branch_id],
        [scopeMap.department, record.department_id],
        [scopeMap.division, record.division_id],
        [scopeMap.unit, record.unit_id],
      ];

      for (const [ids, value] of checks) {
        if (!ids?.length) {
          continue;
        }

        hasConstraint = true;

        if (!value || !ids.includes(String(value))) {
          return false;
        }
      }

      return true;
    },
    [hasAllScope, hasAnyScope, scopeMap]
  );

  const filterByScope = useCallback(
    (rows = []) => {
      if (!Array.isArray(rows)) {
        return [];
      }

      if (hasAllScope || !hasAnyScope) {
        return rows;
      }

      return rows.filter(
        canAccessRecord
      );
    },
    [hasAllScope, hasAnyScope, canAccessRecord]
  );

  /* =======================================================
     Scope Option Helper

     ใช้กรอง Select ตอนกำหนด user_access_assignment_scopes
======================================================= */

  const canUseScopeOption = useCallback(
    (scopeType, item = {}) => {
      if (hasAllScope || !hasAnyScope) {
        return true;
      }

      const id = item?.id;

      if (!id) {
        return false;
      }

      switch (scopeType) {
        case "company":
          return canAccessCompany(id);

        case "branch_group":
          return canAccessBranchGroup(id);

        case "branch":
          return canAccessBranch(
            id,
            item.company_id
          );

        case "department":
          return canAccessDepartment(id);

        case "division":
          return canAccessDivision(
            id,
            item.department_id
          );

        case "unit":
          return canAccessUnit(
            id,
            item.division_id,
            item.department_id
          );

        default:
          return false;
      }
    },
    [
      hasAllScope,
      hasAnyScope,
      canAccessCompany,
      canAccessBranchGroup,
      canAccessBranch,
      canAccessDepartment,
      canAccessDivision,
      canAccessUnit,
    ]
  );

  const filterScopeOptions = useCallback(
    (scopeType, items = []) => {
      if (!Array.isArray(items)) {
        return [];
      }

      if (hasAllScope || !hasAnyScope) {
        return items;
      }

      return items.filter((item) =>
        canUseScopeOption(
          scopeType,
          item
        )
      );
    },
    [hasAllScope, hasAnyScope, canUseScopeOption]
  );

  return {
    user,
    loadingUser: Boolean(loadingUser),

    assignments,
    primaryAssignment,

    hasAllScope,
    hasAnyScope,

    scopeMap,

    accessibleCompanyIds:
      scopeMap.company,
    accessibleBranchGroupIds:
      scopeMap.branch_group,
    accessibleBranchIds:
      scopeMap.branch,
    accessibleDepartmentIds:
      scopeMap.department,
    accessibleDivisionIds:
      scopeMap.division,
    accessibleUnitIds:
      scopeMap.unit,

    getScopeIds,
    hasScope,

    canAccessCompany,
    canAccessBranchGroup,
    canAccessBranch,
    canAccessDepartment,
    canAccessDivision,
    canAccessUnit,

    canAccessRecord,
    filterByScope,

    canUseScopeOption,
    filterScopeOptions,
  };
}


/* =========================================================
   Default Hook
========================================================= */

export default function useAccessScope() {
  const auth = useAuth();

  const user =
    auth?.user ||
    auth?.currentUser ||
    null;

  return useAccessScopeFromUser(
    user,
    auth?.loadingUser ?? false
  );
}
