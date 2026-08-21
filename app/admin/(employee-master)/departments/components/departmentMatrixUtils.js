export const MATRIX_ALL_COLOR = "#D1D5DB";
export const MATRIX_EMPTY_COLOR = "#F8FAFC";

export function getBranchGroupKey(branch) {
  return (
    branch?.branch_group_id ||
    branch?.group_id ||
    branch?.group_name ||
    "NO_GROUP"
  );
}

export function buildBranchGroups(branches = []) {
  return Array.from(
    new Map(
      branches.map((branch) => {
        const key = getBranchGroupKey(branch);
        const name = branch?.group_name || "ไม่ระบุกลุ่ม";

        return [
          key,
          {
            key,
            name,
            color: branch?.group_color || "#E2E8F0",
          },
        ];
      })
    ).values()
  );
}

export function getBranchesByGroup(branches = [], groupKey) {
  return branches.filter(
    (branch) => getBranchGroupKey(branch) === groupKey
  );
}

export function getDepartmentBranchesByGroup(
  department,
  branches = [],
  groupKey
) {
  const selectedIds = new Set(department?.branch_ids || []);

  return branches.filter(
    (branch) =>
      selectedIds.has(branch.id) &&
      getBranchGroupKey(branch) === groupKey
  );
}

export function isDepartmentAllBranches(department, branches = []) {
  if (!branches.length) return false;

  const selectedIds = new Set(department?.branch_ids || []);

  return branches.every((branch) => selectedIds.has(branch.id));
}

export function isDepartmentAllGroupBranches(
  department,
  branches = [],
  groupKey
) {
  const groupBranches = getBranchesByGroup(branches, groupKey);
  if (!groupBranches.length) return false;

  const selectedIds = new Set(department?.branch_ids || []);

  return groupBranches.every((branch) => selectedIds.has(branch.id));
}

export function getDepartmentSelectedGroupKeys(
  department,
  branches = []
) {
  const selectedIds = new Set(department?.branch_ids || []);

  return Array.from(
    new Set(
      branches
        .filter((branch) => selectedIds.has(branch.id))
        .map((branch) => getBranchGroupKey(branch))
    )
  );
}

export function getDepartmentMatrixColor(
  department,
  branches = [],
  branchGroups = []
) {
  if (isDepartmentAllBranches(department, branches)) {
    return MATRIX_ALL_COLOR;
  }

  const selectedGroupKeys = getDepartmentSelectedGroupKeys(
    department,
    branches
  );

  if (selectedGroupKeys.length === 1) {
    const selectedGroup = branchGroups.find(
      (group) => group.key === selectedGroupKeys[0]
    );

    return (
      selectedGroup?.color ||
      department?.department_color ||
      MATRIX_EMPTY_COLOR
    );
  }

  if (selectedGroupKeys.length > 1) {
    return MATRIX_ALL_COLOR;
  }

  return department?.department_color || MATRIX_EMPTY_COLOR;
}

export function getDepartmentScopeLabel(
  department,
  branches = [],
  branchGroups = []
) {
  if (isDepartmentAllBranches(department, branches)) {
    return "ทุกสังกัด";
  }

  const selectedGroupKeys = getDepartmentSelectedGroupKeys(
    department,
    branches
  );

  if (selectedGroupKeys.length === 1) {
    const selectedGroup = branchGroups.find(
      (group) => group.key === selectedGroupKeys[0]
    );

    return selectedGroup?.name || "1 Group";
  }

  if (selectedGroupKeys.length > 1) {
    return "หลาย Group";
  }

  return "ยังไม่ระบุสังกัด";
}

export function getGroupMatrixColor(
  department,
  branches = [],
  group
) {
  if (
    isDepartmentAllBranches(department, branches) ||
    isDepartmentAllGroupBranches(department, branches, group?.key)
  ) {
    return MATRIX_ALL_COLOR;
  }

  return group?.color || MATRIX_EMPTY_COLOR;
}
