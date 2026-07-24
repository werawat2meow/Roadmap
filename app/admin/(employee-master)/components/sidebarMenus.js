"use client";

import {
  NodeIndexOutlined,
  StarOutlined,
  TagsOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  DollarOutlined,
  PartitionOutlined,
  ProfileOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
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
  BarChartOutlined,
  ToolOutlined,
  WalletOutlined,
  AccountBookOutlined,
} from "@ant-design/icons";

export const sidebarMenus = [
  /* =========================================================
   * MAIN
   * ========================================================= */
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

  /* =========================================================
   * ORGANIZATION
   * ========================================================= */
  {
    title: "ORGANIZATION *",
    icon: <BankOutlined />,
    items: [
      {
        label: "บริษัท",
        href: "/admin/companies",
        icon: <ShopOutlined />,
        permission: "ems.companies.view",
      },
      {
        label: "กรุ๊ปสังกัด",
        href: "/admin/branch-groups",
        icon: <AppstoreOutlined />,
        permission: "ems.branch_groups.view",
      },
      {
        label: "สังกัด",
        href: "/admin/branches",
        icon: <EnvironmentOutlined />,
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
    ],
  },

  /* =========================================================
   * JOB ARCHITECTURE    กลุ่มสายงานตำแหน่ง ในบริษัท 
   * ========================================================= */
  {
    title: "JOB ARCHITECTURE",
    icon: <ProfileOutlined />,
    items: [
      {
        label: "ตำแหน่ง",
        href: "/admin/positions",
        icon: <SolutionOutlined />,
        permission: "ems.positions.view",
      },
      {
        label: "กลุ่มสายงาน",
        href: "/admin/position-families",
        icon: <ProfileOutlined />,
        permission: "ems.position_families.view",
      },
      {
        label: "ระดับของกลุ่มสายงาน",
        href: "/admin/position-family-levels",
        icon: <NodeIndexOutlined />,
        permission: "ems.position_family_levels.view",
      },
      {
        label: "ระดับตำแหน่ง",
        href: "/admin/position-levels",
        icon: <TagsOutlined />,
        permission: "ems.position_levels.view",
      },
      {
        label: "โครงสร้างเงินเดือน",
        href: "/admin/position-level-bands",
        icon: <DollarOutlined />,
        permission: "ems.position_level_bands.view",
      },
      {
        label: "ตำแหน่งตามหน่วย",
        href: "/admin/unit-positions",
        icon: <PartitionOutlined />,
        permission: "ems.unit_positions.view",
      },
      {
        label: "บทบาทงาน / โครงสร้างธุรกิจ",
        href: "/admin/jobs",
        icon: <ProfileOutlined />,
        permission: "ems.jobs.view",
      },
      {
        label: "เส้นทางอาชีพ",
        href: "/admin/career-paths",
        icon: <ApartmentOutlined />,
        permission: "ems.career_paths.view",
      },

      // =====================================================
      // Future
      // =====================================================
      // {
      //   label: "นโยบายค่าตอบแทน",
      //   href: "/admin/compensation-policies",
      //   icon: <SafetyCertificateOutlined />,
      //   permission: "ems.compensation_policies.view",
      // },
    ],
  },

  /* =========================================================
   * SKILL & COMPETENCY    โครงสร้างข้อมูลด้านทักษะ/สมรรถนะของพนักงาน
   * ========================================================= */
   {
    title: "SKILL & COMPETENCY",
    icon: <StarOutlined />,
    items: [
      {
        label: "หมวดหมู่ทักษะ",
        href: "/admin/skill-categories",
        icon: <AppstoreOutlined />,
        permission: "ems.skill_categories.view",
      },
      {
        label: "จัดการทักษะ",
        href: "/admin/skills",
        icon: <ToolOutlined />,
        permission: "ems.skills.view",
      },
      {
        label: "ระดับทักษะ",
        href: "/admin/skill-levels",
        icon: <TagsOutlined />,
        permission: "ems.skill_levels.view",
      },

      // ===============================
      // Competency Master
      // ===============================

      {
        label: "จัดการสมรรถนะ",
        href: "/admin/competencies",
        icon: <StarOutlined />,
        permission: "ems.competencies.view",
      },
      {
        label: "ระดับสมรรถนะ",
        href: "/admin/competency-levels",
        icon: <TagsOutlined />,
        permission: "ems.competency_levels.view",
      },

      // ===============================
      // Mapping
      // ===============================

      {
        label: "ทักษะตำแหน่ง",
        href: "/admin/position-skills",
        icon: <NodeIndexOutlined />,
        permission: "ems.position_skills.view",
      },
      {
        label: "สมรรถนะตำแหน่ง",
        href: "/admin/position-competencies",
        icon: <NodeIndexOutlined />,
        permission: "ems.position_competencies.view",
      },

      {
        label: "ทักษะพนักงาน",
        href: "/admin/employee-skills",
        icon: <ToolOutlined />,
        permission: "ems.employee_skills.view",
      },
    ],
  },

  /* =========================================================
   * PAYROLL
   * ========================================================= */
  {
    title: "PAYROLL *",
    icon: <WalletOutlined />,
    items: [
      {
        label: "Payroll Types",
        href: "/admin/payroll-types",
        icon: <TagsOutlined />,
        permission: "ems.payroll_types.view",
      },
      {
        label: "Payroll Company",
        href: "/admin/payroll-companies",
        icon: <BankOutlined />,
        permission: "ems.payroll_companies.view",
      },
    ],
  },

  /* =========================================================
   * COST STRUCTURE
   * ========================================================= */
  {
    title: "COST STRUCTURE *",
    icon: <AccountBookOutlined />,
    items: [
      {
        label: "Business Unit",
        href: "/admin/business-units",
        icon: <BankOutlined />,
        permission: "ems.business_units.view",
      },
      {
        label: "Cost Center",
        href: "/admin/cost-centers",
        icon: <FundProjectionScreenOutlined />,
        permission: "ems.cost_centers.view",
      },
      {
        label: "Profit Center",
        href: "/admin/profit-centers",
        icon: <DollarOutlined />,
        permission: "ems.profit_centers.view",
      },
      {
        label: "GL Mapping",
        href: "/admin/gl-mappings",
        icon: <FileTextOutlined />,
        permission: "ems.gl_mappings.view",
      },
    ],
  },

  /* =========================================================
   * EMPLOYEE MASTER
   * ========================================================= */
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
        label: "สายบังคับบัญชา",
        href: "/admin/management-assignments",
        icon: <ApartmentOutlined />,
        permission: "ems.management_assignments.view",
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
      {
        label: "รายงานพนักงาน",
        href: "/admin/employee-reports",
        icon: <BarChartOutlined />,
        permission: "ems.employee_reports.view",
      },
    ],
  },

  /* =========================================================
   * USER ACCESS
   * ========================================================= */
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
        label: "กำหนดสิทธิ์การใช้งานให้แต่ละบทบาทหน้าที่",
        href: "/admin/role-permissions",
        icon: <LockOutlined />,
        permission: "access.role_permissions.view",
      },
      {
        label: "Activity Logs",
        href: "/admin/activity-logs",
        icon: <AuditOutlined />,
        permission: "access.activity_logs.view",
      },
    ],
  },

  /* =========================================================
   * API MANAGEMENT
   * ========================================================= */
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