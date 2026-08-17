export type RoadmapStatus = "In Progress" | "Completed" | "Planned";
export type EmployeeStatus = "Active" | "Inactive" | "On Leave";

export interface Roadmap {
  id: string;
  name: string;
  quarter: string;
  status: RoadmapStatus;
  owner: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  firstNameEn?: string;
  lastNameEn?: string;
  avatar: string;
  branch?: string;
  branchId?: string;
  department: string;
  departmentId?: string;
  division?: string;
  divisionId?: string;
  unit?: string;
  unitId?: string;
  role: string;
  level?: string;
  status: EmployeeStatus;
  hireDate?: string;
}
