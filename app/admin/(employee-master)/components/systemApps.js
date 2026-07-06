import {TeamOutlined,GiftOutlined,DollarOutlined,ClockCircleOutlined,ToolOutlined,FileTextOutlined,AppstoreOutlined,} from "@ant-design/icons";

export const systemApps = [
  {
    code: "EMS",
    title: "Employee Master",
    subtitle: "ระบบข้อมูลพนักงาน",
    description: "จัดการข้อมูลพนักงาน โครงสร้างองค์กร และสิทธิ์ผู้ใช้งาน",
    path: "/admin/dashboard",
    permission: "ems.portal.view",
    matchPrefixes: ["ems.", "access.", "api."], 
    icon: <TeamOutlined />,
    badge: "Core",
    category: "HR Core",
    sortOrder: 1,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    code: "BENEFIT",
    title: "Benefit",
    subtitle: "ระบบสวัสดิการ",
    description: "เบิกสิทธิ์ ตรวจสอบสิทธิ์ และอนุมัติสวัสดิการ",
    path: "/admin/benefit",
    permission: "benefit.portal.view",
    matchPrefixes: ["benefit."],
    icon: <GiftOutlined />,
    badge: "Service",
    category: "Employee Service",
    sortOrder: 2,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    code: "HRM",
    title: "HRM",
    subtitle: "ระบบบริหารงาน HR",
    description: "ลางาน เวลาทำงาน คำร้อง และงานบุคคล",
    path: "/hrm",
    permission: "hrm.portal.view",
    matchPrefixes: ["hrm."],
    icon: <ClockCircleOutlined />,
    badge: "HR",
    category: "HR Core",
    sortOrder: 3,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    code: "PAYROLL",
    title: "Payroll",
    subtitle: "ระบบเงินเดือน",
    description: "เงินเดือน รายได้ รายหัก และรายงานเงินเดือน",
    path: "/payroll",
    permission: "payroll.portal.view",
    matchPrefixes: ["payroll."],
    icon: <DollarOutlined />,
    badge: "Private",
    category: "Finance",
    sortOrder: 4,
    gradient: "from-orange-500 to-red-500",
  },
  {
    code: "RECRUITMENT",
    title: "Recruitment",
    subtitle: "ระบบสรรหาพนักงาน",
    description: "ตำแหน่งว่าง ผู้สมัคร นัดสัมภาษณ์ และผลการคัดเลือก",
    path: "/recruitment",
    permission: "recruitment.portal.view",
    matchPrefixes: ["recruitment."],
    icon: <FileTextOutlined />,
    badge: "Hiring",
    category: "HR Core",
    sortOrder: 5,
    gradient: "from-cyan-500 to-sky-600",
  },
  {
    code: "ASSET",
    title: "Asset",
    subtitle: "ระบบทรัพย์สิน",
    description: "จัดการอุปกรณ์ ทรัพย์สิน และการเบิกคืนอุปกรณ์",
    path: "/asset",
    permission: "asset.portal.view",
    matchPrefixes: ["asset."],
    icon: <ToolOutlined />,
    badge: "Operation",
    category: "Operation",
    sortOrder: 6,
    gradient: "from-slate-500 to-slate-700",
  },
  {
    code: "TEST",
    title: "Test",
    subtitle: "ระบบทดสอบ",
    description: "ระบบสำหรับทดสอบ Permission และเมนูใหม่",
    path: "/test",
    permission: "test.portal.view",
    matchPrefixes: ["test."],
    icon: <AppstoreOutlined />,
    badge: "Dev",
    category: "Development",
    sortOrder: 999,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    code: "LEAVE",
    title: "Leave System",
    subtitle: "ระบบลางาน",
    description: "ยื่นคำขอลา ตรวจสอบสิทธิ์ และอนุมัติการลา",
    path: "/leave",
    hardNav: true,             
    permission: "leave.view",
    icon: <ClockCircleOutlined />,
    badge: "Leave",
    category: "HR Core",
    sortOrder: 4,
    gradient: "from-teal-500 to-cyan-600",
  },

  {
    code: "ROADMAP",
    title: "Roadmap",
    subtitle: "ระบบแผนงาน",
    description: "ติดตามแผนงาน โครงการ และสถานะการดำเนินงาน",
    path: "/roadmap",
    permission: "roadmap.view",
    icon: <FileTextOutlined />,
    badge: "Project",
    category: "Operation",
    sortOrder: 7,
    gradient: "from-indigo-500 to-sky-600",
  },
];

export const getSystemAppByPermission = (permission = {}) => {
  const code = String(
    permission?.module_code || permission?.permission_code || ""
  ).toLowerCase();

  return (
    systemApps.find((app) =>
      app.matchPrefixes?.some((prefix) =>
        code.startsWith(prefix.toLowerCase())
      )
    ) || null
  );
};

export const getSystemTitleByPermission = (permission = {}) => {
  return getSystemAppByPermission(permission)?.title || "Other";
};

export const getSystemSelectOptions = () => {
  const grouped = systemApps.reduce((acc, app) => {
    const category = app.category || "Other";

    if (!acc[category]) acc[category] = [];

    acc[category].push({
      label: app.title,
      value: app.title,
    });

    return acc;
  }, {});

  return Object.entries(grouped).map(([label, options]) => ({
    label,
    options,
  }));
};
