import {GiftOutlined,FormOutlined,HistoryOutlined,BarChartOutlined,FileDoneOutlined,TagsOutlined,SafetyCertificateOutlined,TeamOutlined,CheckCircleOutlined,AuditOutlined,DatabaseOutlined,FileSearchOutlined,PaperClipOutlined,NumberOutlined,ApartmentOutlined,BellOutlined,} from "@ant-design/icons";

export const benefitSelfMenus = [
  {
    title: "ตรวจสอบสิทธิ์ของฉัน",
    desc: "ดูสิทธิ์สวัสดิการ ยอดคงเหลือ และสิทธิ์ที่ตนเองได้รับ",
    icon: <GiftOutlined />,
    path: "/benefit/my-rights",
    tag: "Self",
    permissions: ["benefit.my_rights.view"],
    allowAllLogin: true,
  },
  {
    title: "ขอใช้สิทธิ์",
    desc: "ยื่นคำขอสวัสดิการ กรอกข้อมูล และแนบเอกสารประกอบ",
    icon: <FormOutlined />,
    path: "/benefit/requests",
    tag: "Request",
    permissions: ["benefit.request.create"],
  },
  {
    title: "ประวัติคำขอของฉัน",
    desc: "ดูประวัติคำขอ สถานะการอนุมัติ และผลการพิจารณา",
    icon: <HistoryOutlined />,
    path: "/benefit/requests/history",
    tag: "History",
    permissions: ["benefit.request.view_own"],
  },
  {
    title: "การแจ้งเตือน",
    desc: "ดูการแจ้งเตือนคำขอ การอนุมัติ การปฏิเสธ และสถานะสวัสดิการ",
    icon: <BellOutlined />,
    path: "/benefit/notifications",
    tag: "Notify",
    permissions: ["benefit.notification.view"],
    allowAllLogin: true,
  },
];

export const benefitSidebarMenus = [
  {
    title: "DASHBOARD",
    icon: <BarChartOutlined />,
    items: [
      {
        label: "Dashboard Benefit",
        desc: "ดูภาพรวมคำขอ การใช้สิทธิ์ ยอดคงเหลือ และสถานะระบบ Benefit",
        href: "/benefit/dashboard",
        icon: <BarChartOutlined />,
        tag: "Overview",
        permission: "benefit.dashboard.view",
      },
    ],
  },

  {
    title: "SELF SERVICE",
    icon: <GiftOutlined />,
    items: benefitSelfMenus.map((menu) => ({
      label: menu.title,
      desc: menu.desc,
      href: menu.path,
      icon: menu.icon,
      tag: menu.tag,
      permissions: menu.permissions,
      allowAllLogin: menu.allowAllLogin,
    })),
  },

  {
    title: "BENEFIT SETUP",
    icon: <FileDoneOutlined />,
    items: [
      {
        label: "จัดการหมวดหมู่",
        desc: "กำหนดหมวดหมู่สวัสดิการ เช่น Medical, Allowance, Welfare",
        href: "/benefit/categories",
        icon: <TagsOutlined />,
        tag: "Category",
        permission: "benefit.category.view",
      },
      {
        label: "จัดการสวัสดิการ",
        desc: "สร้างรายการสวัสดิการ เช่น OPD, Dental, Fuel, Uniform",
        href: "/benefit/benefits",
        icon: <FileDoneOutlined />,
        tag: "Benefit",
        permission: "benefit.master.view",
      },
    ],
  },

  {
    title: "RULES & POLICY ENGINE",
    icon: <SafetyCertificateOutlined />,
    items: [
      {
        label: "Benefit Matrix",
        desc: "กำหนดสิทธิ์ตามปี, Level, สถานะพนักงาน และ Quota",
        href: "/benefit/matrix",
        icon: <ApartmentOutlined />,
        tag: "Matrix",
        permission: "benefit.rule.view",
      },
      {
        label: "Benefit Rules",
        desc: "จัดการเงื่อนไขสิทธิ์สวัสดิการพื้นฐาน",
        href: "/benefit/rules",
        icon: <SafetyCertificateOutlined />,
        tag: "Rules",
        permission: "benefit.rule.view",
      },
      {
        label: "Policy Engine",
        desc: "กำหนดเงื่อนไขขั้นสูง เช่น อายุงาน สาขา แผนก ประเภทการจ้าง",
        href: "/benefit/policies",
        icon: <AuditOutlined />,
        tag: "Policy",
        permission: "benefit.policy.view",
      },
    ],
  },

  {
    title: "ENTITLEMENT ENGINE",
    icon: <TeamOutlined />,
    items: [
      {
        label: "Entitlements",
        desc: "Generate และตรวจสอบสิทธิ์จริงที่พนักงานได้รับในแต่ละปีหรือเดือน",
        href: "/benefit/entitlements",
        icon: <TeamOutlined />,
        tag: "Generate",
        permission: "benefit.entitlement.view",
      },
    ],
  },

  {
    title: "REQUEST & APPROVAL",
    icon: <CheckCircleOutlined />,
    items: [
      {
        label: "Workflow Approval",
        desc: "กำหนดสายอนุมัติ เช่น Manager, HR, Finance หรือผู้บริหาร",
        href: "/benefit/workflows",
        icon: <AuditOutlined />,
        tag: "Workflow",
        permission: "benefit.workflow.view",
      },
      {
        label: "รายการรออนุมัติ",
        desc: "ตรวจสอบ อนุมัติ ปฏิเสธ หรือคืนสิทธิ์คำขอสวัสดิการ",
        href: "/benefit/approvals",
        icon: <CheckCircleOutlined />,
        tag: "Approve",
        permission: "benefit.approval.view",
      },
    ],
  },

  {
    title: "USAGE & DOCUMENTS",
    icon: <DatabaseOutlined />,
    items: [
      {
        label: "Benefit Usage",
        desc: "ดูประวัติการใช้สิทธิ์ การตัดยอด และยอดคงเหลือ",
        href: "/benefit/usages",
        icon: <DatabaseOutlined />,
        tag: "Usage",
        permission: "benefit.usage.view",
      },
      {
        label: "Attachments",
        desc: "จัดการเอกสารแนบ ใบเสร็จ หรือหลักฐานประกอบคำขอ",
        href: "/benefit/attachments",
        icon: <PaperClipOutlined />,
        tag: "Files",
        permission: "benefit.attachment.view",
      },
    ],
  },

  {
    title: "REPORTS & CONFIG",
    icon: <FileSearchOutlined />,
    items: [
      {
        label: "Reports",
        desc: "รายงานการใช้สิทธิ์ ค่าใช้จ่าย การอนุมัติ และ Export Excel",
        href: "/benefit/reports",
        icon: <FileSearchOutlined />,
        tag: "Report",
        permission: "benefit.report.view",
      },
      {
        label: "Running Numbers",
        desc: "กำหนดเลขรันเอกสารคำขอสวัสดิการ",
        href: "/benefit/running-numbers",
        icon: <NumberOutlined />,
        tag: "Config",
        permission: "benefit.running.view",
      },
    ],
  },

  {
    title: "SYSTEM AUDIT",
    icon: <AuditOutlined />,
    items: [
      {
        label: "Audit Logs",
        desc: "ตรวจสอบประวัติการใช้งาน การอนุมัติ การแก้ไข และการ Generate ข้อมูล",
        href: "/benefit/audit-logs",
        icon: <AuditOutlined />,
        tag: "Audit",
        permission: "benefit.audit.view",
      },
    ],
  },
  
];

export function canAccessBenefitSidebarItem(user, item) {
  if (!user) return false;

  const roleCode =
    user?.roles?.role_code ||
    user?.role_code ||
    user?.role?.role_code ||
    user?.role;

  if (roleCode === "SUPER_ADMIN") return true;
  if (item.allowAllLogin) return true;

  const userPermissions = user?.permissions || user?.permission_codes || [];

  if (item.permissions?.length) {
    return item.permissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }

  return userPermissions.includes(item.permission);
}

export function getVisibleBenefitSidebarMenus(user) {
  return benefitSidebarMenus
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccessBenefitSidebarItem(user, item)
      ),
    }))
    .filter((section) => section.items.length > 0);
}