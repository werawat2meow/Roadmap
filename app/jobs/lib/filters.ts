// lib/filters.ts

export const BRANCH_STORAGE_KEY = "selected_branch_id";
export const URGENT_STORAGE_KEY = "urgent_filter";

export function readFilters() {
  if (typeof window === "undefined") {
    return { branchId: "", urgent: false };
  }
  const branchId = localStorage.getItem(BRANCH_STORAGE_KEY) ?? "";
  return {
    // กันเคส string "undefined" / "null" ถูกอ่านเป็นค่าที่ใช้งานได้
    branchId: branchId === "undefined" || branchId === "null" ? "" : branchId,
    urgent: localStorage.getItem(URGENT_STORAGE_KEY) === "true",
  };
}

export function updateFilter(branchId?: string | null, urgent?: boolean) {
  const safeBranchId = branchId ?? "";  // undefined/null กลายเป็น string ว่างเสมอ
  localStorage.setItem(BRANCH_STORAGE_KEY, safeBranchId);
  localStorage.setItem(URGENT_STORAGE_KEY, String(!!urgent));
  window.dispatchEvent(new Event("branch-change"));
}