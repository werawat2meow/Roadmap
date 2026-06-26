export const payrollStatusOptions = ['ทั้งหมด', 'ครบถ้วนแล้ว', 'รอข้อมูลบัญชี', 'ส่งบัญชีแล้ว'] as const;
export type PayrollStatusOption = typeof payrollStatusOptions[number];

export type PayrollStatus =
  | 'ครบถ้วนแล้ว'
  | 'รอข้อมูลบัญชี'
  | 'ส่งบัญชีแล้ว'
  | 'ยังไม่สมบูรณ์';

export type PayrollRow = {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  level: string;
  evaluation: string;
  salary: string;
  bank: string;
  accountNumber: string;
  status: PayrollStatus;
  approved: boolean;
};

export const payrollRows: PayrollRow[] = [
  {
    id: '1',
    name: 'Krisxandra Capitle',
    employeeId: '50095',
    department: 'Restaurant Operation',
    level: 'P3',
    evaluation: 'Probation Q2 2024 - 80%',
    salary: 'ยังไม่ได้ระบุ',
    bank: 'SCB',
    accountNumber: '123-4-56789-0',
    status: 'ส่งบัญชีแล้ว',
    approved: true,
  },
  {
    id: '2',
    name: 'Marcus Chen',
    employeeId: '50234',
    department: 'Marketing',
    level: 'P4',
    evaluation: 'Performance Q2 2024 - 92%',
    salary: 'ยังไม่ได้ระบุ',
    bank: 'ยังไม่ได้กรอก',
    accountNumber: '-',
    status: 'รอข้อมูลบัญชี',
    approved: true,
  },
  {
    id: '3',
    name: 'David Park',
    employeeId: '50156',
    department: 'Finance',
    level: 'P3',
    evaluation: 'Performance Q2 2024 - 87%',
    salary: 'ยังไม่ได้ระบุ',
    bank: 'กสิกรไทย',
    accountNumber: '045-2-98765-4',
    status: 'ส่งบัญชีแล้ว',
    approved: true,
  },
  {
    id: '4',
    name: 'Anna Rivera',
    employeeId: '50081',
    department: 'HR',
    level: 'P2',
    evaluation: 'Probation Q2 2024 - 75%',
    salary: 'ยังไม่ได้ระบุ',
    bank: 'ยังไม่ได้กรอก',
    accountNumber: '-',
    status: 'รอข้อมูลบัญชี',
    approved: true,
  },
  {
    id: '5',
    name: 'Kevin Somporn',
    employeeId: '50048',
    department: 'Operations',
    level: 'P5',
    evaluation: 'Performance Q1 2024 - 91%',
    salary: 'ยังไม่ได้ระบุ',
    bank: 'กรุงไทย',
    accountNumber: '764-0-99571-2',
    status: 'ครบถ้วนแล้ว',
    approved: true,
  },
];