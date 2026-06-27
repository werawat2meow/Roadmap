export type RoadmapStatus = 'In Progress' | 'Completed' | 'Planned';
export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';

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
  avatar: string;
  department: string;
  role: string;
  status: EmployeeStatus;
}
