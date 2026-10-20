// The application remains the identity before and after employee creation.
export function applicationPerson(application, employee = {}) {
  const person = { ...employee, id: application.emp_id || null };
  for (const field of ["company_id", "branch_id", "department_id", "division_id", "unit_id", "position_id", "position_level_id"]) {
    person[field] = application[field] ?? employee[field] ?? null;
  }
  return person;
}

export function canAccessApplication(guard, application, employee, participant) {
  const person = applicationPerson(application, employee);
  if (!guard.canAccessEmployee(person)) return false;
  // Keep the original assignment's scope check as well as the current scope.
  return !participant || guard.canAccessEmployee({ ...person,
    branch_id: participant.branch_id ?? person.branch_id,
    department_id: participant.department_id ?? person.department_id,
  });
}
