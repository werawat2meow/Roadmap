import {
  AppstoreOutlined,
  GiftOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  NumberOutlined,
  PaperClipOutlined,
  TableOutlined,
  UserSwitchOutlined,
  FormOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  WalletOutlined,
} from "@ant-design/icons";

export const benefitSidebarMenus = [
  {
    title: "MASTER SETUP",
    icon: <AppstoreOutlined />,
    items: [
      {
        label: "Benefit Types",
        href: "/admin/benefit/types",
        icon: <GiftOutlined />,
        // permission: "benefit.type.view",
      },
      {
        label: "Benefit Categories",
        href: "/admin/benefit/categories",
        icon: <AppstoreOutlined />,
        // permission: "benefit.category.view",
      },
      {
        label: "Benefit Policies",
        href: "/admin/benefit/policies",
        icon: <FileProtectOutlined />,
        // permission: "benefit.policy.view",
      },
      {
        label: "Eligibility Rules",
        href: "/admin/benefit/rules",
        icon: <SafetyCertificateOutlined />,
        // permission: "benefit.rule.view",
      },
      {
        label: "Fiscal Year",
        href: "/admin/benefit/fiscal-years",
        icon: <CalendarOutlined />,
        // permission: "benefit.fiscal_year.view",
      },
      {
        label: "Running Numbers",
        href: "/admin/benefit/running-numbers",
        icon: <NumberOutlined />,
        // permission: "benefit.running_number.view",
      },
      {
        label: "Attachment Requirements",
        href: "/admin/benefit/attachment-requirements",
        icon: <PaperClipOutlined />,
        // permission: "benefit.attachment_requirement.view",
      },
    ],
  },
  {
    title: "MATRIX",
    icon: <TableOutlined />,
    items: [
      {
        label: "Benefit Matrix",
        href: "/admin/benefit/matrix",
        icon: <TableOutlined />,
        // permission: "benefit.matrix.view",
      },
    ],
  },
  {
    title: "ENTITLEMENTS",
    icon: <UserSwitchOutlined />,
    items: [
      {
        label: "Generate Entitlements",
        href: "/admin/benefit/entitlements",
        icon: <UserSwitchOutlined />,
        // permission: "benefit.entitlement.view",
      },
    ],
  },
  {
    title: "REQUEST",
    icon: <FormOutlined />,
    items: [
      {
        label: "Benefit Requests",
        href: "/admin/benefit/requests",
        icon: <FormOutlined />,
        // permission: "benefit.request.view",
      },
    ],
  },
  {
    title: "APPROVAL",
    icon: <CheckCircleOutlined />,
    items: [
      {
        label: "Approvals",
        href: "/admin/benefit/approvals",
        icon: <CheckCircleOutlined />,
        // permission: "benefit.approval.view",
      },
      {
        label: "Approval Workflow",
        href: "/admin/benefit/workflows",
        icon: <SafetyCertificateOutlined />,
        // permission: "benefit.workflow.view",
      },
    ],
  },
  {
    title: "USAGE",
    icon: <WalletOutlined />,
    items: [
      {
        label: "Benefit Usage",
        href: "/admin/benefit/usages",
        icon: <WalletOutlined />,
        // permission: "benefit.usage.view",
      },
    ],
  },
  {
    title: "REPORTS",
    icon: <BarChartOutlined />,
    items: [
      {
        label: "Dashboard",
        href: "/admin/benefit/dashboard",
        icon: <BarChartOutlined />,
        // permission: "benefit.dashboard.view",
      },
      {
        label: "Reports",
        href: "/admin/benefit/reports",
        icon: <BarChartOutlined />,
        // permission: "benefit.report.view",
      },
    ],
  },
];