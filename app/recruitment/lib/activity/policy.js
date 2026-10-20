// Explicit page allowlist. Update when adding Recruitment pages.
export const pageTemplates = [
  "/recruitment/orientation",
  "/recruitment/orientation/manage",
  "/recruitment/orientation/manage/[sessionId]",
  "/recruitment/orientation/manage/upload",
  "/recruitment",
  "/recruitment/approve_employees",
  "/recruitment/approve_employees",
  "/recruitment/approve_employees/[id]/edit",
  "/recruitment/candidate",
  "/recruitment/candidate/[id]",
  "/recruitment/candidate/[id]/edit",
  "/recruitment/candidate/candidate_history/[id]",
  "/recruitment/candidate/candidate_history/[id]/detail",
  "/recruitment/candidate/create",
  "/recruitment/candidate_detail",
  "/recruitment/candidate_detail/[id]",
  "/recruitment/employee_search",
  "/recruitment/index",
  "/recruitment/report",
  "/recruitment/report/activity_logs",
  "/recruitment/report/approve_emp",
  "/recruitment/report/index",
  "/recruitment/report/job-sharing",
  "/recruitment/report/job-sharing/[shareLinkId]",
  "/recruitment/report_summary_recruit",
  "/recruitment/resume",
  "/recruitment/schedule_interviews",
  "/recruitment/schedule_interviews",
  "/recruitment/schedule_interviews/[id]",
  "/recruitment/schedule_list",
  "/recruitment/schedule_list/[id]",
  "/recruitment/setting",
  "/recruitment/setting/benefit",
  "/recruitment/setting/contract_signatories",
  "/recruitment/setting/evaluation",
  "/recruitment/setting/job_description",
  "/recruitment/setting/job_description/[id]/edit",
  "/recruitment/setting/job_description/create",
  "/recruitment/setting/job_language",
  "/recruitment/setting/job_openings",
  "/recruitment/setting/job_openings/[id]/edit",
  "/recruitment/setting/job_openings/create",
  "/recruitment/setting/job_openings/createv1",
  "/recruitment/setting/job_openings/createv2",
  "/recruitment/setting/language",
  "/recruitment/setting/language/[id]",
  "/recruitment/setting/language/[id]/edit",
  "/recruitment/setting/language/create",
  "/recruitment/update_interview_appointment"
];

export const browserActions = ["PAGE_VIEW", "PRINT_REQUESTED", "EXPORT_REQUESTED"];
export const actions = [...browserActions, "CREATE", "UPDATE", "DELETE", "UPDATE_STATUS", "APPROVE", "EXPORT", "SHARE", "LOGOUT"];
export function isActivityExcluded(path) {
  return typeof path === "string" && path.replace(/\/+$/, "") === "/recruitment/report/activity_logs";
}
export function safeId(value) {
  return (typeof value === "string" || typeof value === "number") && /^[a-zA-Z0-9_-]{1,80}$/.test(String(value)) ? String(value) : null;
}
export function allowedPage(path) {
  if (typeof path !== "string" || path.length > 300 || /[?%#\\]/.test(path)) return false;
  const parts = path.split("/");
  return pageTemplates.some((template) => {
    const expected = template.split("/");
    return expected.length === parts.length && expected.every((part, i) => part.startsWith("[") ? Boolean(safeId(parts[i])) : part === parts[i]);
  });
}
