import {
  DashboardOutlined,
  LockOutlined,
  ShopOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  SolutionOutlined,
  IdcardOutlined,
  SafetyOutlined,
  KeyOutlined,
  WarningOutlined,
  AuditOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

export const sidebarMenus = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: <DashboardOutlined />,
        permission: "dashboard.view",
      },
      {
        label: "กำลังคน",
        href: "/admin/manpower",
        icon: <WarningOutlined />,
        permission: "dashboard.view",
      },
    ],
  },

  {
    title: "ORGANIZATION",
    items: [
      {
        label: "บริษัท",
        href: "/admin/companies",
        icon: <ShopOutlined />,
        permission: "companies.view",
      },
      {
        label: "สาขา",
        href: "/admin/branches",
        icon: <BankOutlined />,
        permission: "branches.view",
      },
      {
        label: "แผนก",
        href: "/admin/departments",
        icon: <ApartmentOutlined />,
        permission: "departments.view",
      },
      {
        label: "ฝ่าย",
        href: "/admin/divisions",
        icon: <ClusterOutlined />,
        permission: "divisions.view",
      },
      {
        label: "หน่วยงาน",
        href: "/admin/units",
        icon: <TeamOutlined />,
        permission: "units.view",
      },
      {
        label: "ตำแหน่ง",
        href: "/admin/positions",
        icon: <SolutionOutlined />,
        permission: "positions.view",
      },
      {
        label: "ตำแหน่งตามหน่วย",
        href: "/admin/unit-positions",
        icon: <ApartmentOutlined />,
        permission: "unit_positions.view",
      },
    ],
  },

  {
    title: "EMPLOYEE MASTER",
    items: [
      {
        label: "พนักงาน",
        href: "/admin/employees",
        icon: <IdcardOutlined />,
        permission: "employees.view",
      },
      {
        label: "ประเภทการจ้าง",
        href: "/admin/employment-types",
        icon: <UsergroupAddOutlined />,
        permission: "employment_types.view",
      },
      {
        label: "สถานะพนักงาน",
        href: "/admin/employee-statuses",
        icon: <SafetyOutlined />,
        permission: "employee_statuses.view",
      },
    ],
  },

  {
    title: "USER ACCESS",
    items: [
      {
        label: "ผู้ใช้งานระบบ",
        href: "/admin/user-accounts",
        icon: <UserOutlined />,
        permission: "user_accounts.view",
      },
      {
        label: "บทบาทผู้ใช้งานในระบบ",
        href: "/admin/roles",
        icon: <SafetyOutlined />,
        permission: "roles.view",
      },
      {
        label: "Permissions",
        href: "/admin/permissions",
        icon: <KeyOutlined />,
        permission: "permissions.view",
      },
      {
        label: "กำหนดสิทธิ์การใช้งานให้แต่ละ บทบาทหน้าที่",
        href: "/admin/role-permissions",
        icon: <LockOutlined />,
        permission: "role_permissions.view",
      },
      {
        label: "log activity",
        href: "/admin/activity-logs",
        icon: <AuditOutlined />,
        permission: "activity_logs.view",
      },
    ],
  },
  {
    title: "API MANAGEMENT",
    items: [
      {
        label: "API Clients",
        href: "/admin/api-clients",
        icon: <UsergroupAddOutlined />,
        permission: "api_clients.view",
      },
      {
        label: "API Tokens",
        href: "/admin/api-tokens",
        icon: <KeyOutlined />,
        permission: "api_tokens.view",
      },
      {
        label: "API Logs",
        href: "/admin/api-logs",
        icon: <AuditOutlined />,
        permission: "api_logs.view",
      },
    ],
  },
];
