import {GiftOutlined,FormOutlined,HistoryOutlined,BarChartOutlined,FileDoneOutlined,TagsOutlined,SafetyCertificateOutlined,TeamOutlined,CheckCircleOutlined,AuditOutlined,DatabaseOutlined,FileSearchOutlined,PaperClipOutlined,NumberOutlined,} from "@ant-design/icons";

export const benefitSelfMenus = [
  {
    title: "ตรวจสอบสิทธิ์ของฉัน",
    desc: "ดูสิทธิ์สวัสดิการของตนเองตามระดับพนักงาน อายุงาน และสถานะ",
    icon: <GiftOutlined />,
    path: "/benefit/my-rights",
    tag: "Self Service",
    permissions: ["benefit.my_rights.view"],
    allowAllLogin: true,
  },
  {
    title: "ขอใช้สิทธิ์",
    desc: "ส่งคำขอใช้สวัสดิการ เช่น เบิกค่าใช้จ่าย หรือขอรับสิทธิ์",
    icon: <FormOutlined />,
    path: "/benefit/requests",
    tag: "Request",
    permissions: ["benefit.request.create"],
  },
  {
    title: "ประวัติคำขอของฉัน",
    desc: "ดูประวัติและสถานะคำขอสวัสดิการของตนเอง",
    icon: <HistoryOutlined />,
    path: "/benefit/requests/history",
    tag: "History",
    permissions: ["benefit.request.view_own"],
  },
];

export const benefitAdminMenus = [
  {
    title: "Dashboard Benefit",
    desc: "ดูภาพรวมคำขอ การใช้สิทธิ์ และสถานะระบบ Benefit",
    icon: <BarChartOutlined />,
    path: "/benefit/dashboard",
    tag: "View",
    permissions: [
      "benefit.dashboard.view",
      "benefit.admin.view",
    ],
    executiveView: true,
  },
  {
    title: "จัดการสวัสดิการ",
    desc: "เพิ่ม แก้ไข ลบ เปิด/ปิด รายการสวัสดิการ",
    icon: <FileDoneOutlined />,
    path: "/benefit/benefits",
    tag: "CRUD",
    permissions: [
      "benefit.master.view",
      "benefit.master.create",
      "benefit.master.update",
      "benefit.master.delete",
      "benefit.master.manage",
    ],
  },
  {
    title: "จัดการหมวดหมู่",
    desc: "เพิ่ม แก้ไข ลบ หมวดหมู่สวัสดิการ",
    icon: <TagsOutlined />,
    path: "/benefit/categories",
    tag: "CRUD",
    permissions: [
      "benefit.category.view",
      "benefit.category.create",
      "benefit.category.update",
      "benefit.category.delete",
      "benefit.category.manage",
    ],
  },
  {
    title: "จัดการ Benefit Rules",
    desc: "กำหนดสิทธิ์ตามระดับ P, อายุงาน, สถานะ และประเภทการจ้าง",
    icon: <SafetyCertificateOutlined />,
    path: "/benefit/rules",
    tag: "CRUD",
    permissions: [
      "benefit.rule.view",
      "benefit.rule.create",
      "benefit.rule.update",
      "benefit.rule.delete",
      "benefit.rule.manage",
    ],
  },
  {
    title: "จัดการ Entitlements",
    desc: "จัดการสิทธิ์ประจำปีที่พนักงานได้รับจริง",
    icon: <TeamOutlined />,
    path: "/benefit/entitlements",
    tag: "CRUD",
    permissions: [
      "benefit.entitlement.view",
      "benefit.entitlement.create",
      "benefit.entitlement.update",
      "benefit.entitlement.delete",
      "benefit.entitlement.manage",
    ],
  },
  {
    title: "รายการรออนุมัติ",
    desc: "ตรวจสอบ อนุมัติ หรือปฏิเสธคำขอสวัสดิการ",
    icon: <CheckCircleOutlined />,
    path: "/benefit/approvals",
    tag: "Approve",
    permissions: [
      "benefit.request.approve",
      "benefit.approval.view",
      "benefit.approval.manage",
    ],
  },
  {
    title: "Workflow Approval",
    desc: "กำหนดลำดับผู้อนุมัติ HR, Manager, P11-P12 หรือผู้บริหาร",
    icon: <AuditOutlined />,
    path: "/benefit/workflows",
    tag: "Manage",
    permissions: [
      "benefit.workflow.view",
      "benefit.workflow.create",
      "benefit.workflow.update",
      "benefit.workflow.delete",
      "benefit.workflow.manage",
    ],
  },
  {
    title: "Benefit Usage",
    desc: "ดูประวัติการใช้สิทธิ์ ยอดคงเหลือ และรายการที่ใช้ไปแล้ว",
    icon: <DatabaseOutlined />,
    path: "/benefit/usages",
    tag: "View",
    permissions: [
      "benefit.usage.view",
      "benefit.usage.manage",
    ],
  },
  {
    title: "Reports",
    desc: "รายงานสวัสดิการ ค่าใช้จ่าย การอนุมัติ และ Export Excel",
    icon: <FileSearchOutlined />,
    path: "/benefit/reports",
    tag: "Report",
    permissions: [
      "benefit.report.view",
      "benefit.report.export",
      "benefit.admin.view",
    ],
    executiveView: true,
  },
  {
    title: "Attachments",
    desc: "จัดการเอกสารแนบของคำขอสวัสดิการ",
    icon: <PaperClipOutlined />,
    path: "/benefit/attachments",
    tag: "Files",
    permissions: [
      "benefit.attachment.view",
      "benefit.attachment.manage",
    ],
  },
  {
    title: "Running Numbers",
    desc: "จัดการเลขรันเอกสารคำขอสวัสดิการ",
    icon: <NumberOutlined />,
    path: "/benefit/running-numbers",
    tag: "Config",
    permissions: [
      "benefit.running_number.view",
      "benefit.running_number.manage",
    ],
  },
];

export function canAccessBenefitMenu(user, menu) {
  if (!user) return false;

  const roleCode =
    user?.roles?.role_code ||
    user?.role_code ||
    user?.role?.role_code;

  if (roleCode === "SUPER_ADMIN") return true;

  if (menu.allowAllLogin) return true;

  const userPermissions =
    user?.permissions ||
    user?.permission_codes ||
    [];

  return menu.permissions?.some((permission) =>
    userPermissions.includes(permission)
  );
}

export function getVisibleBenefitMenus(user, menus) {
  return menus.filter((menu) => canAccessBenefitMenu(user, menu));
}