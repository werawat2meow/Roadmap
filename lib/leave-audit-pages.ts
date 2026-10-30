const leavePages: Record<string, string> = {
  "/leave": "Overview",
  "/leave/schedules": "Schedule tasks",
  "/leave/attendance": "Attendance",
  "/leave/reports": "Reports",
  "/leave/approvals": "Leave Entry",
  "/leave/eligibility": "Eligibility",
  "/leave/manage-requests": "Restore leave",
  "/leave/audit-logs": "ประวัติการใช้งาน",
  "/leave/settings": "Settings",

  "/leave/settings/restricted-dates": "Settings / วันจำกัดการลา",
  "/leave/settings/holidays": "Settings / วันหยุดประจำปี",
  "/leave/settings/entitlements": "Settings / สิทธิ์การลา",
  "/leave/settings/approvals": "Settings / ผู้อนุมัติ",
};

export function getLeaveAuditPage(pathname: string) {
  const pagePath = pathname.replace(/\/+$/, "") || "/";
  const pageName = leavePages[pagePath];

  if (!pageName) return null;

  return { pagePath, pageName };
}