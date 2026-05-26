"use client";

import {
  HomeOutlined,
  DashboardOutlined,
  WarningOutlined,
  ShopOutlined,
  BankOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  TeamOutlined,
  SolutionOutlined,
  UserOutlined,
  IdcardOutlined,
  UsergroupAddOutlined,
  SafetyOutlined,
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  ApiOutlined,
} from "@ant-design/icons";

export const sidebarMenus = [
  {
    title: "MAIN",
    icon: <HomeOutlined />,
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: <DashboardOutlined />,
        permission: "ems.dashboard.view",
      },
      {
        label: "กำลังคน",
        href: "/admin/manpower",
        icon: <WarningOutlined />,
        permission: "ems.manpower.view",
      },
    ],
  },

  {
    title: "ORGANIZATION",
    icon: <BankOutlined />,
    items: [
      {
        label: "บริษัท",
        href: "/admin/companies",
        icon: <ShopOutlined />,
        permission: "ems.companies.view",
      },
      {
        label: "สาขา",
        href: "/admin/branches",
        icon: <BankOutlined />,
        permission: "ems.branches.view",
      },
      {
        label: "แผนก",
        href: "/admin/departments",
        icon: <ApartmentOutlined />,
        permission: "ems.departments.view",
      },
      {
        label: "ฝ่าย",
        href: "/admin/divisions",
        icon: <ClusterOutlined />,
        permission: "ems.divisions.view",
      },
      {
        label: "หน่วยงาน",
        href: "/admin/units",
        icon: <TeamOutlined />,
        permission: "ems.units.view",
      },
      {
        label: "ตำแหน่ง",
        href: "/admin/positions",
        icon: <SolutionOutlined />,
        permission: "ems.positions.view",
      },
      {
        label: "ตำแหน่งตามหน่วย",
        href: "/admin/unit-positions",
        icon: <ApartmentOutlined />,
        permission: "ems.unit_positions.view",
      },
    ],
  },

  {
    title: "EMPLOYEE MASTER",
    icon: <IdcardOutlined />,
    items: [
      {
        label: "พนักงาน",
        href: "/admin/employees",
        icon: <IdcardOutlined />,
        permission: "ems.employees.view",
      },
      {
        label: "ประเภทการจ้าง",
        href: "/admin/employment-types",
        icon: <UsergroupAddOutlined />,
        permission: "ems.employment_types.view",
      },
      {
        label: "สถานะพนักงาน",
        href: "/admin/employee-statuses",
        icon: <SafetyOutlined />,
        permission: "ems.employee_statuses.view",
      },
    ],
  },

  {
    title: "USER ACCESS",
    icon: <SafetyCertificateOutlined />,
    items: [
      {
        label: "ผู้ใช้งานระบบ",
        href: "/admin/user-accounts",
        icon: <UserOutlined />,
        permission: "access.user_accounts.view",
      },
      {
        label: "บทบาทผู้ใช้งานในระบบ",
        href: "/admin/roles",
        icon: <SafetyOutlined />,
        permission: "access.roles.view",
      },
      {
        label: "Permissions",
        href: "/admin/permissions",
        icon: <KeyOutlined />,
        permission: "access.permissions.view",
      },
      {
        label: "กำหนดสิทธิ์การใช้งานให้แต่ละ บทบาทหน้าที่",
        href: "/admin/role-permissions",
        icon: <LockOutlined />,
        permission: "access.role_permissions.view",
      },
      {
        label: "log activity",
        href: "/admin/activity-logs",
        icon: <AuditOutlined />,
        permission: "access.activity_logs.view",
      },
    ],
  },

  {
    title: "API MANAGEMENT",
    icon: <ApiOutlined />,
    items: [
      {
        label: "API Clients",
        href: "/admin/api-clients",
        icon: <UsergroupAddOutlined />,
        permission: "api.api_clients.view",
      },
      {
        label: "API Tokens",
        href: "/admin/api-tokens",
        icon: <KeyOutlined />,
        permission: "api.api_tokens.view",
      },
      {
        label: "API Logs",
        href: "/admin/api-logs",
        icon: <AuditOutlined />,
        permission: "api.api_logs.view",
      },
    ],
  },
];