export const MANAGEMENT_LEVELS = ["P9", "P10", "P11", "P12"];

export const SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

export const ALLOWED_SCOPE_TYPES = {
  P12: ["all"],
  P11: ["company"],
  P10: ["branch_group", "department"],
  P9: ["department", "division", "unit"],
};