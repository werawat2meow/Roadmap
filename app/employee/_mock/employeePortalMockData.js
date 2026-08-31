export const mockEmployeeProfile = {
  employee_code: "EMP001",
  full_name: "สมชาย ใจดี",
  position_name: "เจ้าหน้าที่",
  department_name: "ทรัพยากรบุคคล",
};

export const mockNews = [
  {
    id: "NEWS-001",
    title: "ประกาศวันหยุดประจำปี",
    summary:
      "แจ้งกำหนดวันหยุดประจำปีและวันหยุดพิเศษของบริษัท",
    date: "28/08/2026",
    category: "ประกาศบริษัท",
    is_pinned: true,
  },
  {
    id: "NEWS-002",
    title: "แจ้งปรับปรุงระบบ HR",
    summary:
      "ระบบ HR จะมีการปรับปรุงประสิทธิภาพในช่วงเวลาที่กำหนด",
    date: "25/08/2026",
    category: "ระบบ",
    is_pinned: false,
  },
  {
    id: "NEWS-003",
    title: "กิจกรรมพนักงานประจำเดือน",
    summary:
      "เชิญชวนพนักงานเข้าร่วมกิจกรรมสร้างความสัมพันธ์ภายในองค์กร",
    date: "20/08/2026",
    category: "กิจกรรม",
    is_pinned: false,
  },
];

export const mockLeaveBalances = [
  {
    code: "ANNUAL",
    name: "ลาพักร้อน",
    entitled: 10,
    used: 4,
    remaining: 6,
    unit: "วัน",
  },
  {
    code: "SICK",
    name: "ลาป่วย",
    entitled: 30,
    used: 2,
    remaining: 28,
    unit: "วัน",
  },
  {
    code: "PERSONAL",
    name: "ลากิจ",
    entitled: 6,
    used: 1,
    remaining: 5,
    unit: "วัน",
  },
];

export const mockRequests = [
  {
    id: "REQ-0001",
    type: "ลาพักร้อน",
    start_date: "01/09/2026",
    end_date: "02/09/2026",
    total_days: 2,
    submitted_at: "28/08/2026 09:20",
    status: "pending",
    approver: "หัวหน้างาน",
  },
  {
    id: "REQ-0002",
    type: "ลาป่วย",
    start_date: "18/08/2026",
    end_date: "18/08/2026",
    total_days: 1,
    submitted_at: "18/08/2026 08:15",
    status: "approved",
    approver: "หัวหน้างาน",
  },
  {
    id: "REQ-0003",
    type: "ลากิจ",
    start_date: "10/08/2026",
    end_date: "10/08/2026",
    total_days: 1,
    submitted_at: "08/08/2026 16:40",
    status: "rejected",
    approver: "หัวหน้างาน",
  },
];
