// ใช้ตัวที่ครบสุด (มี id / created_at / updated_at ใน scopes ด้วย)
export const SELECT_FIELDS = `
  id,
  employee_id,
  management_level,
  scope_type,

  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,

  supervisor_employee_id,
  is_primary,
  status,
  sort_order,
  created_at,
  updated_at,

  employees!management_assignments_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    employee_photo_url,

    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,

    position_id,
    job_id,

    positions (
      id,
      position_code,
      position_name,
      position_level
    ),

    jobs (
      id,
      job_code,
      job_name,
      job_level,
      management_level,
      scope_type,
      can_manage_employees,
      can_approve_budget
    )
  ),

  supervisor:employees!management_assignments_supervisor_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    employee_photo_url,

    positions (
      id,
      position_name,
      position_level
    ),

    jobs (
      id,
      job_name,
      management_level
    )
  ),

  companies (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),

  branch_groups (
    id,
    group_code,
    group_name,
    group_color
  ),

  branches (
    id,
    branch_code,
    branch_name
  ),

  departments (
    id,
    department_code,
    department_name,
    department_color
  ),

  divisions (
    id,
    division_code,
    division_name
  ),

  units (
    id,
    unit_code,
    unit_name
  ),

  management_assignment_scopes (
    id,
    scope_type,

    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,

    is_primary,
    status,
    sort_order,
    created_at,
    updated_at,

    companies (
      id,
      company_code,
      company_name_th,
      company_name_en
    ),

    branch_groups (
      id,
      group_code,
      group_name,
      group_color
    ),

    branches (
      id,
      branch_code,
      branch_name
    ),

    departments (
      id,
      department_code,
      department_name,
      department_color
    ),

    divisions (
      id,
      division_code,
      division_name
    ),

    units (
      id,
      unit_code,
      unit_name
    )
  )
`;