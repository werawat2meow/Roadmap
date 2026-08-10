import {
  AppstoreOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  GiftOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";

/* =========================================================
   System Registry

   ไฟล์นี้บอกว่า:
   - มีระบบอะไร
   - ระบบใช้ permission อะไรในการมองเห็น
   - route หลักคืออะไร
   - พร้อมใช้งานหรือยัง

   ไม่เก็บเมนูภายในของแต่ละระบบ
========================================================= */

export const SYSTEM_STATUS = {
  READY: "ready",
  PLANNED: "planned",
  EXTERNAL: "external",
  DISABLED: "disabled",
};

export const systemApps = [
  {
    code: "EMS",
    title: "Employee Master",
    subtitle: "ระบบข้อมูลพนักงาน",
    description:"จัดการข้อมูลพนักงาน โครงสร้างองค์กร และสิทธิ์ผู้ใช้งาน",

    /*
     * Route จริงของระบบ
     * ตอนนี้ Portal ยังไม่จำเป็นต้อง navigate
     * จาก Parent โดยตรง
     */
    path: "/admin/dashboard",

    /*
     * สิทธิ์ระดับระบบ
     *
     * ความหมาย:
     * ผู้ใช้สามารถเห็น Employee Master
     * บน HR Portal หรือไม่
     */
    permission:"ems.portal.view",

    /*
     * ใช้ fallback กรณียังไม่ได้สร้าง
     * ems.portal.view ให้ทุก Role
     *
     * ถ้ามี permission ใดขึ้นต้นด้วย prefix นี้
     * ถือว่าผู้ใช้เกี่ยวข้องกับระบบ EMS
     */
    permissionPrefixes: [
      "ems.",
      "access.",
      "api.",
    ],

    routePrefixes: [
      "/admin/dashboard",
      "/admin/employees",
      "/admin/manpower",

      "/admin/countries",
      "/admin/nationalities",
      "/admin/titles",

      "/admin/companies",
      "/admin/branch-groups",
      "/admin/branches",
      "/admin/departments",
      "/admin/divisions",
      "/admin/units",

      "/admin/position-families",
      "/admin/position-levels",
      "/admin/positions",

      "/admin/payroll-types",
      "/admin/payroll-companies",
      "/admin/payroll-groups",

      "/admin/user-accounts",
      "/admin/roles",
      "/admin/permissions",
      "/admin/user-access-assignments",

      "/admin/api-clients",
      "/admin/api-tokens",
      "/admin/api-logs",
    ],

    icon:<TeamOutlined />,
    category:"HR Core",
    sortOrder: 1,
    status:SYSTEM_STATUS.READY,
  },

  {
    code: "BENEFIT",

    title: "Benefit",

    subtitle:
      "ระบบสวัสดิการ",

    description:
      "เบิกสิทธิ์ ตรวจสอบสิทธิ์ และอนุมัติสวัสดิการ",

    path: "/benefit",

    permission:
      "benefit.portal.view",

    permissionPrefixes: [
      "benefit.",
    ],

    routePrefixes: [
      "/benefit",
    ],

    icon:
      <GiftOutlined />,

    category:
      "Employee Service",

    sortOrder: 2,

    status:
      SYSTEM_STATUS.PLANNED,
  },

  {
    code: "HRM",

    title: "HRM",

    subtitle:
      "ระบบบริหารงาน HR",

    description:
      "ลางาน เวลาทำงาน คำร้อง และงานบุคคล",

    path: "/hrm",

    permission:
      "hrm.portal.view",

    permissionPrefixes: [
      "hrm.",
    ],

    routePrefixes: [
      "/hrm",
    ],

    icon:
      <AppstoreOutlined />,

    category:
      "HR Core",

    sortOrder: 3,

    status:
      SYSTEM_STATUS.PLANNED,
  },

  {
    code: "PAYROLL",

    title: "Payroll",

    subtitle:
      "ระบบเงินเดือน",

    description:
      "เงินเดือน รายได้ รายหัก และรายงานเงินเดือน",

    path: "/payroll",

    permission:
      "payroll.portal.view",

    permissionPrefixes: [
      "payroll.",
    ],

    routePrefixes: [
      "/payroll",
    ],

    icon:
      <DollarOutlined />,

    category:
      "Finance",

    sortOrder: 4,

    status:
      SYSTEM_STATUS.PLANNED,
  },

  {
    code: "RECRUITMENT",

    title: "Recruitment",

    subtitle:
      "ระบบสรรหาพนักงาน",

    description:
      "ตำแหน่งว่าง ผู้สมัคร นัดสัมภาษณ์ และผลการคัดเลือก",

    path:
      "/recruitment",

    permission:
      "recruitment.portal.view",

    permissionPrefixes: [
      "recruitment.",
    ],

    routePrefixes: [
      "/recruitment",
    ],

    icon:
      <FileTextOutlined />,

    category:
      "HR Core",

    sortOrder: 5,

    status:
      SYSTEM_STATUS.PLANNED,
  },

  {
    code: "ASSET",

    title: "Asset",

    subtitle:
      "ระบบทรัพย์สิน",

    description:
      "จัดการอุปกรณ์ ทรัพย์สิน และการเบิกคืนอุปกรณ์",

    path: "/asset",

    permission:
      "asset.portal.view",

    permissionPrefixes: [
      "asset.",
    ],

    routePrefixes: [
      "/asset",
    ],

    icon:
      <ToolOutlined />,

    category:
      "Operation",

    sortOrder: 6,

    status:
      SYSTEM_STATUS.PLANNED,
  },

  {
    code: "LEAVE",

    title:
      "Leave System",

    subtitle:
      "ระบบลางาน",

    description:
      "ยื่นคำขอลา ตรวจสอบสิทธิ์ และอนุมัติการลา",

    path:
      "https://leaveday.vercel.app/leave",

    permission:
      "leave.view",

    permissionPrefixes: [
      "leave.",
    ],

    routePrefixes: [],

    icon:
      <ClockCircleOutlined />,

    category:
      "HR Core",

    sortOrder: 7,

    external: true,

    status:
      SYSTEM_STATUS.EXTERNAL,
  },
];

/* =========================================================
   Helpers
========================================================= */

export function getSystemByCode(systemCode) {
  return (
    systemApps.find(
      (system) =>
        system.code ===
        systemCode
    ) || null
  );
}

export function getSystemByPath(pathname = "") {
  return (
    systemApps.find(
      (system) =>
        (
          system.routePrefixes ||
          []
        ).some(
          (prefix) =>
            pathname === prefix ||
            pathname.startsWith(
              `${prefix}/`
            )
        )
    ) || null
  );
}