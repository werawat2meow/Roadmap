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
  GlobalOutlined,
  FunctionOutlined,
  CodeOutlined,
  CalendarOutlined,
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
        label: "โครงสร้างเงินเดือน",                       // เป็น Master Data ของโครงสร้างเงินเดือน
        href: "/admin/position-level-bands",
        icon: <DollarOutlined />,
        permission: "ems.position_level_bands.view",
      },
      {
        label: "บทบาทงาน / โครงสร้างธุรกิจ",
        href: "/admin/jobs",
        icon: <ProfileOutlined />,
        permission: "ems.jobs.view",
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
        icon: <PartitionOutlined />,
        permission: "ems.unit_positions.view",
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
        label: "ทักษะทั้งหมด",
        href: "/admin/skills",
        icon: <ToolOutlined />,
        permission: "ems.skills.view",
      },
      {
        label: "ระดับความเชี่ยวชาญทักษะ",
        href: "/admin/skill-levels",
        icon: <TagsOutlined />,
        permission: "ems.skill_levels.view",
      },

      // ===============================
      // Competency Master   ทักษะเฉพาะทางงง
      // ===============================

      {
        label: "ประเภทความสามารถ",
        href: "/admin/competency-types",
        icon: <AppstoreOutlined />,
        permission: "ems.competency_types.view",
      },
      {
        label: "Competencies",
        href: "/admin/competencies",
        icon: <StarOutlined />,
        permission: "ems.competencies.view",
      },
      {
        label: "ระดับความสามารถ (1-5)",
        href: "/admin/competency-levels",
        icon: <TagsOutlined />,
        permission: "ems.competency_levels.view",
      },

      // ===============================
      // Mapping กับตำแหน่งในบริษัท
      // ===============================

      {
        label: "กำหนดทักษะตามตำแหน่ง *",
        href: "/admin/position-skills",
        icon: <NodeIndexOutlined />,
        permission: "ems.position_skills.view",
      },
      {
        label: "กำหนดสมรรถนะตามตำแหน่ง*",
        href: "/admin/position-competencies",
        icon: <NodeIndexOutlined />,
        permission: "ems.position_competencies.view",
      },

      {
        label: "ทักษะรายบุคคล *",
        href: "/admin/employee-skills",
        icon: <ToolOutlined />,
        permission: "ems.employee_skills.view",
      },
    ],
  },

  /* =========================================================
   * PAYROLL SETUP
   * ========================================================= */
  {
    title: "PAYROLL SETUP",
    icon: <WalletOutlined />,
    items: [

      // ===============================
      // Payroll Setup
      // ===============================

      {
        label: "รอบการจ่ายเงิน",
        href: "/admin/payroll-types",
        icon: <TagsOutlined />,
        permission: "ems.payroll_types.view",
      },

      {
        label: "บริษัทเงินเดือน",
        href: "/admin/payroll-companies",
        icon: <BankOutlined />,
        permission: "ems.payroll_companies.view",
      },

      {
        label: "กลุ่มเงินเดือน",
        href: "/admin/payroll-groups",
        icon: <AppstoreOutlined />,
        permission: "ems.payroll_groups.view",
      },

      // ===============================
      // Salary Master    
      // ===============================

      {
        label: "รายการเงินเดือน",
        href: "/admin/salary-components",
        icon: <DollarOutlined />,
        permission: "ems.salary_components.view",
      },
      {
        label: "ประเภทเงินได้",
        href: "/admin/earning-types",
        icon: <FundProjectionScreenOutlined />,
        permission: "ems.earning_types.view",
      },
      {
        label: "ประเภทรายการหัก",
        href: "/admin/deduction-types",
        icon: <FileTextOutlined />,
        permission: "ems.deduction_types.view",
      },
      // ⭐ เพิ่ม
      {
        label: "สูตรการคำนวณเงินเดือน",
        href: "/admin/payroll-formulas",
        icon: <FunctionOutlined />,
        permission: "ems.payroll_formulas.view",
      },
      // ⭐ เพิ่ม
      {
        label: "ตัวแปรสูตรคำนวณ",
        href: "/admin/formula-variables",
        icon: <CodeOutlined />,
        permission: "ems.formula_variables.view",
      },
      // ⭐ เพิ่ม
      {
        label: "โครงสร้างเงินเดือน",
        href: "/admin/salary-structures",
        icon: <ApartmentOutlined />,
        permission: "ems.salary_structures.view",
      },

      // ===============================
      // Employee Payroll
      // ===============================

      // เปลี่ยนชื่อ
      {
        label: "โครงสร้างเงินเดือนพนักงาน",
        href: "/admin/employee-compensations",
        icon: <DollarOutlined />,
        permission: "ems.employee_compensations.view",
      },

      // ===============================
      // Payroll Process
      // ===============================

      // เปลี่ยนชื่อ
      {
        label: "งวดเงินเดือน",
        href: "/admin/payroll-periods",
        icon: <CalendarOutlined />,
        permission: "ems.payroll_periods.view",
      },
      {
        label: "ประมวลผลเงินเดือน",
        href: "/admin/payroll-runs",
        icon: <WalletOutlined />,
        permission: "ems.payroll_runs.view",
      },
    ],
  },

  /* =========================================================
   * TAX & SOCIAL SECURITY
   * ========================================================== */
  {
    title: "TAX & SOCIAL SECURITY",
    icon: <SafetyCertificateOutlined />,
    items: [
      {
        label: "โปรไฟล์ภาษี",
        href: "/admin/tax-profiles",
        icon: <SafetyCertificateOutlined />,
        permission: "ems.tax_profiles.view",
      },
      {
        label: "อัตราภาษี",
        href: "/admin/tax-rates",
        icon: <BarChartOutlined />,
        permission: "ems.tax_rates.view",
      },
      {
        label: "ประกันสังคม",
        href: "/admin/social-security",
        icon: <SafetyOutlined />,
        permission: "ems.social_security.view",
      },
      {
        label: "กองทุนสำรองเลี้ยงชีพ",
        href: "/admin/provident-funds",
        icon: <WalletOutlined />,
        permission: "ems.provident_funds.view",
      },
    ],
  },

  /* =========================================================
   * BANKING & COMPENSATION
   * ========================================================= */

  {
    title: "BANKING & COMPENSATION",
    icon: <BankOutlined />,
    items: [
      {
        label: "ธนาคาร",
        href: "/admin/banks",
        icon: <BankOutlined />,
        permission: "ems.banks.view",
      },
      {
        label: "วิธีการจ่ายเงิน",
        href: "/admin/payment-methods",
        icon: <AccountBookOutlined />,
        permission: "ems.payment_methods.view",
      },
      {
        label: "โครงสร้างเงินเดือนพนักงาน",
        href: "/admin/employee-compensations",
        icon: <DollarOutlined />,
        permission: "ems.employee_compensations.view",
      },
    ],
  },

  /* =========================================================
  * HR MASTER  ข้อมูลทั่วไป
  * ========================================================= */
  {
    title: "ข้อมูลทั่วไป",
    icon: <IdcardOutlined />,
    items: [
      {
        label: "ประเทศ",
        href: "/admin/countries",
        icon: <EnvironmentOutlined />,
        permission: "ems.countries.view",
      },
      {
        label: "สัญชาติ",
        href: "/admin/nationalities",
        icon: <GlobalOutlined />,
        permission: "ems.nationalities.view",
      },
      {
        label: "คำนำหน้า",
        href: "/admin/titles",
        icon: <UserOutlined />,
        permission: "ems.titles.view",
      },
      {
        label: "ศาสนา",
        href: "/admin/religions",
        icon: <SafetyOutlined />,
        permission: "ems.religions.view",
      },
      {
        label: "สถานภาพสมรส",
        href: "/admin/marital-statuses",
        icon: <TeamOutlined />,
        permission: "ems.marital_statuses.view",
      },
      {
        label: "เพศ",
        href: "/admin/genders",
        icon: <UsergroupAddOutlined />,
        permission: "ems.genders.view",
      },
    ],
  },

  /* =========================================================
   * COST STRUCTURE
   * ========================================================= */
  {
    title: "COST STRUCTURE",
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



/***
 * 
 * 
 * 
 * Phase 1 (ต้องมี ก่อนทำ Employee)
  ✅ Payroll Cycles
  ✅ Payroll Companies
  ✅ Payroll Groups
  ✅ Salary Components   รายการเงินเดือนนน   
  ✅ Tax Profiles     โปรไฟล์ภาษี เริ่ม 
  ✅ Banks      เสร็จแล้ววว 
  ✅ Payment Methods   เริ่ม 


  แล้วไปที่ HR Master เสร็จ แล้ว ไป Employee Master ได้เลยย
  เสร็จแล้วสามารถไปทำ Employee ได้เลย เพราะพนักงานจะอ้างอิงข้อมูลเหล่านี้

  /* =========================================================
   * PAYROLL SETUP

  {
    title: "PAYROLL SETUP",
    icon: <WalletOutlined />,
    items: [
      {
        label: "รอบการจ่ายเงิน",
        href: "/admin/payroll-types",
        icon: <TagsOutlined />,
        permission: "ems.payroll_types.view",
      },
      {
        label: "บริษัทเงินเดือน",
        href: "/admin/payroll-companies",
        icon: <BankOutlined />,
        permission: "ems.payroll_companies.view",
      },
      {
        label: "กลุ่มเงินเดือน",
        href: "/admin/payroll-groups",
        icon: <AppstoreOutlined />,
        permission: "ems.payroll_groups.view",
      },
      {
        label: "รายการเงินเดือน",
        href: "/admin/salary-components",
        icon: <DollarOutlined />,
        permission: "ems.salary_components.view",
      },
      {
        label: "ประเภทเงินได้",
        href: "/admin/earning-types",
        icon: <FundProjectionScreenOutlined />,
        permission: "ems.earning_types.view",
      },
      {
        label: "ประเภทรายการหัก",
        href: "/admin/deduction-types",
        icon: <FileTextOutlined />,
        permission: "ems.deduction_types.view",
      },
      {
        label: "สูตรการคำนวณเงินเดือน",
        href: "/admin/payroll-formulas",
        icon: <FunctionOutlined />,
        permission: "ems.payroll_formulas.view",
      },
      {
        label: "ตัวแปรสูตรคำนวณ",
        href: "/admin/formula-variables",
        icon: <CodeOutlined />,
        permission: "ems.formula_variables.view",
      },
      {
        label: "โครงสร้างเงินเดือน",
        href: "/admin/salary-structures",
        icon: <ApartmentOutlined />,
        permission: "ems.salary_structures.view",
      },
    ],
  },

  /* =========================================================
   * PAYROLL PROCESS

  {
    title: "PAYROLL PROCESS",
    icon: <CalendarOutlined />,
    items: [
      {
        label: "งวดเงินเดือน",
        href: "/admin/payroll-periods",
        icon: <CalendarOutlined />,
        permission: "ems.payroll_periods.view",
      },
      {
        label: "ประมวลผลเงินเดือน",
        href: "/admin/payroll-runs",
        icon: <WalletOutlined />,
        permission: "ems.payroll_runs.view",
      },
    ],
  },

 * 
 */