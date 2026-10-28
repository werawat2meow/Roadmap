const EXECUTIVE_PRESENTATION_PERMISSION_MODULE =
  "recruitment.report.approve.emp";

export function authorizeExecutivePresentationRequest(requireScopedAccess) {
  return requireScopedAccess(
    EXECUTIVE_PRESENTATION_PERMISSION_MODULE,
    "view",
    { scopeType: "employee", lineageScope: true },
  );
}

export function canAccessExecutivePresentation(guard, application) {
  return Boolean(
    guard?.ok &&
      typeof guard.canAccessEmployee === "function" &&
      guard.canAccessEmployee(application),
  );
}
