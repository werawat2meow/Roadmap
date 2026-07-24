export const mapAssignment = (item) => {
  const employee = item.employees || {};
  const position = employee.positions || {};
  const job = employee.jobs || {};
  const supervisor = item.supervisor || {};
  const supervisorPosition = supervisor.positions || {};
  const supervisorJob = supervisor.jobs || {};
  const scopes = item.management_assignment_scopes || [];

  const resolvedManagementLevel =
    job.management_level || position.position_level || item.management_level || "";
  const resolvedScopeType = item.scope_type || job.scope_type || "";

  const mappedScopes = scopes.map((scope) => ({
    id: scope.id,
    scope_type: scope.scope_type,
    company_id: scope.company_id || "",
    company_name: scope.companies?.company_name_th || scope.companies?.company_name_en || "",
    branch_group_id: scope.branch_group_id || "",
    branch_group_name: scope.branch_groups?.group_name || "",
    branch_group_color: scope.branch_groups?.group_color || "#E2E8F0",
    branch_id: scope.branch_id || "",
    branch_name: scope.branches?.branch_name || "",
    department_id: scope.department_id || "",
    department_name: scope.departments?.department_name || "",
    department_color: scope.departments?.department_color || "#E2E8F0",
    division_id: scope.division_id || "",
    division_name: scope.divisions?.division_name || "",
    unit_id: scope.unit_id || "",
    unit_name: scope.units?.unit_name || "",
    is_primary: scope.is_primary,
    status: scope.status,
    sort_order: Number(scope.sort_order || 0),
  }));

  return {
    id: item.id,
    employee_id: item.employee_id || "",
    employee_code: employee.employee_code || "",
    employee_name:
      `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim() ||
      `${employee.first_name_en || ""} ${employee.last_name_en || ""}`.trim() ||
      "-",
    employee_photo_url: employee.employee_photo_url || "",
    position_id: employee.position_id || "",
    position_code: position.position_code || "",
    position_name: position.position_name || "-",
    position_level: position.position_level || "",
    job_id: employee.job_id || "",
    job_code: job.job_code || "",
    job_name: job.job_name || "-",
    job_level: job.job_level || "",
    job_management_level: job.management_level || "",
    job_scope_type: job.scope_type || "",
    can_manage_employees: job.can_manage_employees ?? false,
    can_approve_budget: job.can_approve_budget ?? false,
    management_level: resolvedManagementLevel,
    scope_type: resolvedScopeType,
    scopes: mappedScopes,
    company_id: item.company_id || "",
    company_name: item.companies?.company_name_th || item.companies?.company_name_en || "",
    branch_group_id: item.branch_group_id || employee.branch_group_id || "",
    branch_group_name: item.branch_groups?.group_name || "",
    branch_group_color: item.branch_groups?.group_color || "#E2E8F0",
    branch_id: item.branch_id || employee.branch_id || "",
    branch_name: item.branches?.branch_name || "",
    department_id: item.department_id || employee.department_id || "",
    department_name: item.departments?.department_name || "",
    department_color: item.departments?.department_color || "#E2E8F0",
    division_id: item.division_id || employee.division_id || "",
    division_name: item.divisions?.division_name || "",
    unit_id: item.unit_id || employee.unit_id || "",
    unit_name: item.units?.unit_name || "",
    supervisor_employee_id: item.supervisor_employee_id || "",
    supervisor_code: supervisor.employee_code || "",
    supervisor_name:
      `${supervisor.first_name_th || ""} ${supervisor.last_name_th || ""}`.trim() ||
      `${supervisor.first_name_en || ""} ${supervisor.last_name_en || ""}`.trim() ||
      "",
    supervisor_photo_url: supervisor.employee_photo_url || "",
    supervisor_position_name: supervisorPosition.position_name || "",
    supervisor_management_level:
      supervisorJob.management_level || supervisorPosition.position_level || "",
    is_primary: item.is_primary ?? true,
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};