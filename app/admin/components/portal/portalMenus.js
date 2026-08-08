import {
  AppstoreOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  GiftOutlined,
  SettingOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

/* =========================================================
   Portal Menu Status

   ready
   = ระบบพร้อมใช้งาน

   planned
   = มีเมนูแล้ว แต่ยังไม่เปิดใช้งาน

   external
   = ระบบภายนอก

   disabled
   = ปิดใช้งาน
========================================================= */

export const PORTAL_STATUS = {
  READY: "ready",
  PLANNED: "planned",
  EXTERNAL: "external",
  DISABLED: "disabled",
};

/* =========================================================
   Portal Menu Configuration

   IMPORTANT:
   Parent ไม่มี href

   การกด Parent:
   - เปิด / ปิด children เท่านั้น
   - ไม่ navigate
========================================================= */

export const portalMenus = [
  /* =======================================================
     DASHBOARD
  ======================================================= */

  {
    key: "dashboard",
    type: "link",
    label: "Dashboard",
    subtitle: "แดชบอร์ด",
    icon: <DashboardOutlined />,
    href: "/admin/dashboard",
    status: PORTAL_STATUS.READY,
    permission: null,
  },

  /* =======================================================
     EMPLOYEE MANAGEMENT
  ======================================================= */

  {
    key: "employee",
    type: "group",
    systemCode: "EMS",
    label: "Employee Management",
    subtitle: "ระบบข้อมูลพนักงาน",
    icon: <TeamOutlined />,
    status: PORTAL_STATUS.READY,
    permission: null,
    /* Parent ไม่มี href */
    children: [
      {
        key: "employee-overview",
        type: "link",
        label: "Overview",
        subtitle:"ภาพรวมเกี่ยวกับพนักงาน",
        icon:<DashboardOutlined />,
        /*
         * ตอนนี้ยังไม่ Link เพื่อป้องกัน
         * Active ซ้ำกับ Dashboard
         */
        href: null,
        status:PORTAL_STATUS.PLANNED,
        permission: null,
      },

      {
        key: "employee-list",
        type: "link",
        label: "Employee List",
        subtitle:
          "จัดการรายชื่อพนักงาน",
        icon:<UserOutlined />,
        href:"/admin/employees",
        status: PORTAL_STATUS.READY,
        permission:
          "ems.employees.view",
      },

      {
        key: "employee-add",

        type: "action",

        label:
          "Add New Employee",

        subtitle:
          "เพิ่มพนักงาน",

        icon:
          <UserAddOutlined />,

        /*
         * ยังไม่เปิด Route
         * จนกว่าเราจะกำหนดว่า
         * Employee page รับ mode=create
         * จริงหรือไม่
         */
        href: null,

        status:
          PORTAL_STATUS.PLANNED,

        permission:
          "ems.employees.create",

        action:
          "employee.create",
      },

      {
        key:
          "employee-settings",

        type: "group",

        label: "Settings",

        subtitle:
          "ตั้งค่าเกี่ยวกับพนักงาน",

        icon:
          <SettingOutlined />,

        status:
          PORTAL_STATUS.READY,

        children: [
          {
            key:
              "employee-code-settings",

            type: "link",

            label:
              "Employee Code",

            subtitle:
              "ตั้งค่ารหัสพนักงาน",

            href:
              "/admin/employee-code-settings",

            status:
              PORTAL_STATUS.READY,

            permission:
              "ems.employee_code_settings.view",
          },

          {
            key:
              "employee-running",

            type: "link",

            label:
              "Running Number",

            subtitle:
              "เลขรันรหัสพนักงาน",

            href:
              "/admin/employee-running",

            status:
              PORTAL_STATUS.READY,

            permission:
              "ems.employee_running.view",
          },
        ],
      },
    ],
  },

  /* =======================================================
     BENEFIT
  ======================================================= */

  {
    key: "benefit",
    type: "group",
    systemCode: "BENEFIT",
    label: "Benefit Management",
    subtitle:"ระบบสวัสดิการ",
    icon:<GiftOutlined />,
    status:PORTAL_STATUS.PLANNED,
    permission: null,
    children: [
      {
        key:"benefit-overview",
        type: "link",
        label: "Overview",
        subtitle:"ภาพรวมระบบสวัสดิการ",
        href: null,
        status:PORTAL_STATUS.PLANNED,
      },

      {
        key:"benefit-system",
        type: "link",
        label:"Benefit System",
        subtitle:"เข้าสู่ระบบสวัสดิการ",
        /*
         * ยังไม่เปิดก่อน
         * ค่อยกำหนด Route จริงภายหลัง
         */
        href: null,
        status:PORTAL_STATUS.PLANNED,
      },
    ],
  },

  /* =======================================================
     PAYROLL
  ======================================================= */

  {
    key: "payroll",
    type: "group",
    systemCode: "PAYROLL",
    label:"Payroll Management",
    subtitle:"ระบบเงินเดือน",
    icon:<DollarOutlined />,
    status:PORTAL_STATUS.PLANNED,
    permission: null,
    children: [
      {
        key:"payroll-overview",
        type: "link",
        label: "Overview",
        subtitle:"ภาพรวมระบบเงินเดือน",
        href: null,
        status:PORTAL_STATUS.PLANNED,
      },

      {
        key:"payroll-settings",
        type: "group",
        label: "Settings",
        subtitle:"ตั้งค่าระบบเงินเดือน",
        icon:<SettingOutlined />,
        status:PORTAL_STATUS.PLANNED,
        children: [],
      },
    ],
  },

  /* =======================================================
     LEAVE
  ======================================================= */

  {
    key: "leave",
    type: "group",
    systemCode: "LEAVE",
    label:
      "Leave Day Management",
    subtitle:
      "ระบบลางาน",
    icon:
      <CalendarOutlined />,
    status:
      PORTAL_STATUS.EXTERNAL,
    permission: null,
    children: [
      {
        key:
          "leave-system",
        type: "external",
        label:
          "Leave System",
        subtitle:
          "ระบบลางานภายนอก",
        href:
          "https://leaveday.vercel.app/leave",
        status:
          PORTAL_STATUS.EXTERNAL,
      },
    ],
  },

  /* =======================================================
     OTHER SYSTEMS
  ======================================================= */

  {
    key: "other-systems",
    type: "group",
    label: "Other Systems",
    subtitle: "ระบบอื่น ๆ",
    icon:
      <AppstoreOutlined />,
    status:
      PORTAL_STATUS.PLANNED,

    children: [
      {
        key: "hrm",
        type: "link",
        label: "HRM",
        subtitle:
          "ระบบบริหารงาน HR",
        href: null,
        status:
          PORTAL_STATUS.PLANNED,
      },

      {
        key: "recruitment",
        type: "link",
        label:
          "Recruitment",
        subtitle:
          "ระบบสรรหาพนักงาน",
        href: null,
        status:
          PORTAL_STATUS.PLANNED,
      },
    ],
  },
];