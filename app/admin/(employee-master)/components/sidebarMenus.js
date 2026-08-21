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
  SettingOutlined,
  NumberOutlined,
} from "@ant-design/icons";

export const sidebarMenus = [
  {
    title: "MAIN",
    icon: <HomeOutlined />,
    items: [
      {
        label: "Overview",
        href: "/admin/dashboard",
        icon: <DashboardOutlined />,
        permission: "ems.dashboard.view",
      },
    ],
  },
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
  {
    title: "ORGANIZATION",
    icon: <BankOutlined />,
    items: [
      {
        label: "โครงสร้างองค์กรตามแผนก",
        href: "/admin/divisional-structures",
        icon: <ShopOutlined />,
        permission: "ems.org_structure.view",
      },
      {
        label: "การครองตำแหน่งองค์กร",
        href: "/admin/employee-position-assignments",
        icon: <ShopOutlined />,
        permission: "ems.org_structure.view",
      },
      {
        label: "Position Slot",
        href: "/admin//admin/org-position-slots",
        icon: <ShopOutlined />,
        permission: "ems.org_structure.view",
      },
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
        label: "วางแผนอัตรากำลังตามหน่วย",
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

      // เปลี่ยนชื่อ
      {
        label: "โครงสร้างเงินเดือนพนักงาน",
        href: "/admin/employee-compensations",
        icon: <DollarOutlined />,
        permission: "ems.employee_compensations.view",
      },

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
    ],
  },
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
      {
        label: "ตั้งค่ารหัสพนักงาน",
        href: "/admin/employee-code-settings",
        icon: <SettingOutlined />,
        permission: "ems.employee_code_settings.view",
      },
      {
        label: "เลขรันรหัสพนักงาน",
        href: "/admin/employee-running",
        icon: <NumberOutlined />,
        permission: "ems.employee_running.view",
      },
      
      {
        label: "รายงานพนักงาน",
        href: "/admin/employee-reports",
        icon: <BarChartOutlined />,
        permission: "ems.employee_reports.view",
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
        label: "บทบาทและสิทธิ์",
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
      
      /* =====================================================
       USER ACCESS ASSIGNMENT 
        ผู้ใช้งาน + Role
      ===================================================== */
      {
        label: "กำหนดบทบาทผู้ใช้งาน",
        href: "/admin/user-access-assignments",
        icon: <SafetyCertificateOutlined />,
        permission: "access.user_access_assignments.view",
      },
      {
        label: "Activity Logs",
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

/*

       
salary_structures                      โครงสร้างเงินเดือนพนักงาน
employee_compensations                 เงินเดือนจริงของพนักงาน
employee_compensation_components       องค์ประกอบค่าตอบแทน
employee_compensation_adjustments      รายการปรับเงินเดือน
employee_compensation_approval_logs    ประวัติอนุมัติ




*/


export const Menu = [
      {
        title: "MAIN",
        icon: "HomeOutlined",
        items: [
          { label: "Dashboard", "href": "/admin/dashboard", "icon": "DashboardOutlined", "permission": "ems.dashboard.view" }
        ]
      },
  
      {
        title: "ข้อมูลทั่วไป",
        icon: "IdcardOutlined",
        items: [
          { label: "ประเทศ", "href": "/admin/countries", "icon": "EnvironmentOutlined", "permission": "ems.countries.view" },
          { label: "สัญชาติ", "href": "/admin/nationalities", "icon": "GlobalOutlined", "permission": "ems.nationalities.view" },
          { label: "คำนำหน้า", "href": "/admin/titles", "icon": "UserOutlined", "permission": "ems.titles.view" },
          { label: "ศาสนา", "href": "/admin/religions", "icon": "SafetyOutlined", "permission": "ems.religions.view" },
          { label: "สถานภาพสมรส", "href": "/admin/marital-statuses", "icon": "TeamOutlined", "permission": "ems.marital_statuses.view" },
          { label: "เพศ", "href": "/admin/genders", "icon": "UsergroupAddOutlined", "permission": "ems.genders.view" }
        ]
      },
  
      {
        title: "ORGANIZATION",
        icon: "BankOutlined",
        items: [
          {
            label: "โครงสร้างองค์กรตามแผนก",
            href: "/admin/divisional-structures",
            icon: <ShopOutlined />,
            permission: "ems.org_structure.view",
          },
          {
            label: "การครองตำแหน่งองค์กร",
            href: "/admin/employee-position-assignments",
            icon: <ShopOutlined />,
            permission: "ems.org_structure.view",
          },
          {
            label: "Position Slot",
            href: "/admin//admin/org-position-slots",
            icon: <ShopOutlined />,
            permission: "ems.org_structure.view",
          },
          { label: "บริษัท", "href": "/admin/companies", "icon": "ShopOutlined", "permission": "ems.companies.view" },
          { label: "กรุ๊ปสังกัด", "href": "/admin/branch-groups", "icon": "AppstoreOutlined", "permission": "ems.branch_groups.view" },
          { label: "สังกัด", "href": "/admin/branches", "icon": "EnvironmentOutlined", "permission": "ems.branches.view" },
          { label: "แผนก", "href": "/admin/departments", "icon": "ApartmentOutlined", "permission": "ems.departments.view" },
          { label: "ฝ่าย", "href": "/admin/divisions", "icon": "ClusterOutlined", "permission": "ems.divisions.view" },
          { label: "หน่วยงาน", "href": "/admin/units", "icon": "TeamOutlined", "permission": "ems.units.view" }
        ]
      },
  
      {
        title: "JOB ARCHITECTURE",
        icon: "ProfileOutlined",
        items: [
          { label: "กลุ่มสายงาน", "href": "/admin/position-families", "icon": "ProfileOutlined", "permission": "ems.position_families.view" },
          { label: "ระดับของกลุ่มสายงาน", "href": "/admin/position-family-levels", "icon": "NodeIndexOutlined", "permission": "ems.position_family_levels.view" },
          { label: "ระดับตำแหน่ง", "href": "/admin/position-levels", "icon": "TagsOutlined", "permission": "ems.position_levels.view" },
          { label: "ช่วงเงินเดือนตามระดับตำแหน่ง (Salary Band)", "href": "/admin/position-level-bands", "icon": "DollarOutlined", "permission": "ems.position_level_bands.view" },
          { label: "บทบาทงาน / โครงสร้างธุรกิจ", "href": "/admin/jobs", "icon": "ProfileOutlined", "permission": "ems.jobs.view" },
          { label: "ตำแหน่ง", "href": "/admin/positions", "icon": "SolutionOutlined", "permission": "ems.positions.view" },
          { label: "ตำแหน่งตามหน่วย", "href": "/admin/unit-positions", "icon": "PartitionOutlined", "permission": "ems.unit_positions.view" },
          { label: "เส้นทางอาชีพ", "href": "/admin/career-paths", "icon": "ApartmentOutlined", "permission": "ems.career_paths.view" }
        ]
      },
  
      {
        title: "SKILL & COMPETENCY",
        icon: "StarOutlined",
        items: [
          { label: "หมวดหมู่ทักษะ", "href": "/admin/skill-categories", "icon": "AppstoreOutlined", "permission": "ems.skill_categories.view" },
          { label: "ทักษะทั้งหมด", "href": "/admin/skills", "icon": "ToolOutlined", "permission": "ems.skills.view" },
          { label: "ระดับความเชี่ยวชาญทักษะ", "href": "/admin/skill-levels", "icon": "TagsOutlined", "permission": "ems.skill_levels.view" },
          { label: "ประเภทความสามารถ", "href": "/admin/competency-types", "icon": "AppstoreOutlined", "permission": "ems.competency_types.view" },
          { label: "Competencies", "href": "/admin/competencies", "icon": "StarOutlined", "permission": "ems.competencies.view" },
          { label: "ระดับความสามารถ (1-5)", "href": "/admin/competency-levels", "icon": "TagsOutlined", "permission": "ems.competency_levels.view" },
          { label: "กำหนดทักษะตามตำแหน่ง", "href": "/admin/position-skills", "icon": "NodeIndexOutlined", "permission": "ems.position_skills.view" },
          { label: "กำหนดสมรรถนะตามตำแหน่ง", "href": "/admin/position-competencies", "icon": "NodeIndexOutlined", "permission": "ems.position_competencies.view" },
          { label: "ทักษะรายบุคคล", "href": "/admin/employee-skills", "icon": "ToolOutlined", "permission": "ems.employee_skills.view" }
        ]
      },
  
      {
        title: "PAYROLL SETUP",
        icon: "WalletOutlined",
        items: [
          { label: "รอบการจ่ายเงิน", "href": "/admin/payroll-types", "icon": "TagsOutlined", "permission": "ems.payroll_types.view" },
          { label: "บริษัทเงินเดือน", "href": "/admin/payroll-companies", "icon": "BankOutlined", "permission": "ems.payroll_companies.view" },
          { label: "กลุ่มเงินเดือน", "href": "/admin/payroll-groups", "icon": "AppstoreOutlined", "permission": "ems.payroll_groups.view" },
          { label: "รายการเงินเดือน", "href": "/admin/salary-components", "icon": "DollarOutlined", "permission": "ems.salary_components.view" },
          { label: "ประเภทเงินได้", "href": "/admin/earning-types", "icon": "FundProjectionScreenOutlined", "permission": "ems.earning_types.view" },
          { label: "ประเภทรายการหัก", "href": "/admin/deduction-types", "icon": "FileTextOutlined", "permission": "ems.deduction_types.view" },
          { label: "สูตรการคำนวณเงินเดือน", "href": "/admin/payroll-formulas", "icon": "FunctionOutlined", "permission": "ems.payroll_formulas.view" },
          { label: "ตัวแปรสูตรคำนวณ", "href": "/admin/formula-variables", "icon": "CodeOutlined", "permission": "ems.formula_variables.view" },
          { label: "โครงสร้างเงินเดือน (Salary Structure)", "href": "/admin/salary-structures", "icon": "ApartmentOutlined", "permission": "ems.salary_structures.view" },
          { label: "โครงสร้างเงินเดือนพนักงาน", "href": "/admin/employee-compensations", "icon": "DollarOutlined", "permission": "ems.employee_compensations.view" },
          { label: "งวดเงินเดือน", "href": "/admin/payroll-periods", "icon": "CalendarOutlined", "permission": "ems.payroll_periods.view" },
          { label: "ประมวลผลเงินเดือน", "href": "/admin/payroll-runs", "icon": "WalletOutlined", "permission": "ems.payroll_runs.view" }
        ]
      },
  
      {
        title: "TAX & SOCIAL SECURITY",
        icon: "SafetyCertificateOutlined",
        items: [
          { label: "โปรไฟล์ภาษี", "href": "/admin/tax-profiles", "icon": "SafetyCertificateOutlined", "permission": "ems.tax_profiles.view" },
          { label: "อัตราภาษี", "href": "/admin/tax-rates", "icon": "BarChartOutlined", "permission": "ems.tax_rates.view" },
          { label: "ประกันสังคม", "href": "/admin/social-security", "icon": "SafetyOutlined", "permission": "ems.social_security.view" },
          { label: "กองทุนสำรองเลี้ยงชีพ", "href": "/admin/provident-funds", "icon": "WalletOutlined", "permission": "ems.provident_funds.view" }
        ]
      },
  
      {
        title: "BANKING & COMPENSATION",
        icon: "BankOutlined",
        items: [
          { label: "ธนาคาร", "href": "/admin/banks", "icon": "BankOutlined", "permission": "ems.banks.view" },
          { label: "วิธีการจ่ายเงิน", "href": "/admin/payment-methods", "icon": "AccountBookOutlined", "permission": "ems.payment_methods.view" }
        ]
      },
  
      {
        title: "COST STRUCTURE",
        icon: "AccountBookOutlined",
        items: [
          { label: "Business Unit", "href": "/admin/business-units", "icon": "BankOutlined", "permission": "ems.business_units.view" },
          { label: "Cost Center", "href": "/admin/cost-centers", "icon": "FundProjectionScreenOutlined", "permission": "ems.cost_centers.view" },
          { label: "Profit Center", "href": "/admin/profit-centers", "icon": "DollarOutlined", "permission": "ems.profit_centers.view" },
          { label: "GL Mapping", "href": "/admin/gl-mappings", "icon": "FileTextOutlined", "permission": "ems.gl_mappings.view" }
        ]
      },
  
      {
        title: "EMPLOYEE MASTER",
        icon: "IdcardOutlined",
        items: [
          { label: "พนักงาน", "href": "/admin/employees", "icon": "IdcardOutlined", "permission": "ems.employees.view" },
          { label: "ประเภทการจ้าง", "href": "/admin/employment-types", "icon": "UsergroupAddOutlined", "permission": "ems.employment_types.view" },
          { label: "สถานะพนักงาน", "href": "/admin/employee-statuses", "icon": "SafetyOutlined", "permission": "ems.employee_statuses.view" },
          { label: "ตั้งค่ารหัสพนักงาน", "href": "/admin/employee-code-settings", "icon": "SettingOutlined", "permission": "ems.employee_code_settings.view" },
          { label: "เลขรันรหัสพนักงาน", "href": "/admin/employee-running", "icon": "NumberOutlined", "permission": "ems.employee_running.view" },
          { label: "รายงานพนักงาน", "href": "/admin/employee-reports", "icon": "BarChartOutlined", "permission": "ems.employee_reports.view" }
        ]
      },
  
      {
        title: "RECRUITMENT & ONBOARDING",
        icon: "UsergroupAddOutlined",
        items: [
          { label: "ใบขอเปิดอัตรา", "href": "/admin/manpower-requisitions", "icon": "FileAddOutlined", "permission": "ems.manpower_requisitions.view" },
          { label: "ประกาศรับสมัครงาน", "href": "/admin/job-postings", "icon": "NotificationOutlined", "permission": "ems.job_postings.view" },
          { label: "ผู้สมัครงาน", "href": "/admin/applicants", "icon": "SolutionOutlined", "permission": "ems.applicants.view" },
          { label: "นัดสัมภาษณ์", "href": "/admin/interviews", "icon": "CalendarOutlined", "permission": "ems.interviews.view" },
          { label: "ใบเสนอค่าจ้าง", "href": "/admin/job-offers", "icon": "FileTextOutlined", "permission": "ems.job_offers.view" },
          { label: "Onboarding Checklist", "href": "/admin/onboarding-checklists", "icon": "CheckSquareOutlined", "permission": "ems.onboarding_checklists.view" }
        ]
      },
  
      {
        title: "TIME, ATTENDANCE & LEAVE",
        icon: "ClockCircleOutlined",
        items: [
          { label: "กะการทำงาน", "href": "/admin/work-shifts", "icon": "FieldTimeOutlined", "permission": "ems.work_shifts.view" },
          { label: "ตารางเข้างาน", "href": "/admin/work-schedules", "icon": "CalendarOutlined", "permission": "ems.work_schedules.view" },
          { label: "บันทึกเวลาเข้า-ออกงาน", "href": "/admin/attendance-records", "icon": "ClockCircleOutlined", "permission": "ems.attendance_records.view" },
          { label: "คำนวณล่วงเวลา (OT)", "href": "/admin/overtime-rules", "icon": "HourglassOutlined", "permission": "ems.overtime_rules.view" },
          { label: "ประเภทวันลา", "href": "/admin/leave-types", "icon": "TagsOutlined", "permission": "ems.leave_types.view" },
          { label: "โควตาวันลา", "href": "/admin/leave-entitlements", "icon": "PieChartOutlined", "permission": "ems.leave_entitlements.view" },
          { label: "คำขอลา", "href": "/admin/leave-requests", "icon": "FileDoneOutlined", "permission": "ems.leave_requests.view" },
          { label: "ปฏิทินวันหยุด", "href": "/admin/holiday-calendars", "icon": "CalendarOutlined", "permission": "ems.holiday_calendars.view" }
        ]
      },
  
      {
        title: "PERFORMANCE MANAGEMENT",
        icon: "TrophyOutlined",
        items: [
          { label: "รอบประเมินผล", "href": "/admin/appraisal-cycles", "icon": "SyncOutlined", "permission": "ems.appraisal_cycles.view" },
          { label: "KPI / OKR Master", "href": "/admin/kpi-master", "icon": "AimOutlined", "permission": "ems.kpi_master.view" },
          { label: "แบบฟอร์มประเมิน", "href": "/admin/appraisal-forms", "icon": "FormOutlined", "permission": "ems.appraisal_forms.view" },
          { label: "360 Feedback", "href": "/admin/feedback-360", "icon": "TeamOutlined", "permission": "ems.feedback_360.view" },
          { label: "ผลประเมิน & Rating", "href": "/admin/appraisal-results", "icon": "StarOutlined", "permission": "ems.appraisal_results.view" }
        ]
      },
  
      {
        title: "TRAINING & DEVELOPMENT",
        icon: "ReadOutlined",
        items: [
          { label: "หลักสูตรอบรม", "href": "/admin/training-courses", "icon": "BookOutlined", "permission": "ems.training_courses.view" },
          { label: "แผนพัฒนารายบุคคล (IDP)", "href": "/admin/development-plans", "icon": "RiseOutlined", "permission": "ems.development_plans.view" },
          { label: "ตารางอบรม", "href": "/admin/training-schedules", "icon": "CalendarOutlined", "permission": "ems.training_schedules.view" },
          { label: "ประวัติการอบรม", "href": "/admin/training-histories", "icon": "HistoryOutlined", "permission": "ems.training_histories.view" },
          { label: "ใบรับรอง / วุฒิบัตร", "href": "/admin/certificates", "icon": "SafetyCertificateOutlined", "permission": "ems.certificates.view" },
          { label: "งบประมาณอบรม", "href": "/admin/training-budgets", "icon": "DollarOutlined", "permission": "ems.training_budgets.view" }
        ]
      },
  
      {
        title: "EMPLOYEE / MANAGER SELF SERVICE",
        icon: "SmileOutlined",
        items: [
          { label: "ข้อมูลส่วนตัว (ESS)", "href": "/ess/profile", "icon": "UserOutlined", "permission": "ess.profile.view" },
          { label: "สลิปเงินเดือนออนไลน์", "href": "/ess/payslips", "icon": "FileTextOutlined", "permission": "ess.payslips.view" },
          { label: "ขอลา / ขอ OT", "href": "/ess/requests", "icon": "FileDoneOutlined", "permission": "ess.requests.view" },
          { label: "เบิกสวัสดิการ", "href": "/ess/benefits", "icon": "GiftOutlined", "permission": "ess.benefits.view" },
          { label: "อนุมัติคำขอ (MSS)", "href": "/mss/approvals", "icon": "CheckCircleOutlined", "permission": "mss.approvals.view" },
          { label: "ประกาศบริษัท", "href": "/ess/announcements", "icon": "SoundOutlined", "permission": "ess.announcements.view" }
        ]
      },
  
      {
        title: "OFFBOARDING / DISCIPLINARY",
        icon: "LogoutOutlined",
        items: [
          { label: "ใบลาออก", "href": "/admin/resignations", "icon": "LogoutOutlined", "permission": "ems.resignations.view" },
          { label: "Exit Interview", "href": "/admin/exit-interviews", "icon": "AuditOutlined", "permission": "ems.exit_interviews.view" },
          { label: "Clearance Checklist", "href": "/admin/clearance-checklists", "icon": "CheckSquareOutlined", "permission": "ems.clearance_checklists.view" },
          { label: "บันทึกวินัย / ใบเตือน", "href": "/admin/disciplinary-records", "icon": "WarningOutlined", "permission": "ems.disciplinary_records.view" },
          { label: "การเลิกจ้าง", "href": "/admin/terminations", "icon": "StopOutlined", "permission": "ems.terminations.view" }
        ]
      },
  
      {
        title: "DOCUMENT & CONTRACT MANAGEMENT",
        icon: "FolderOpenOutlined",
        items: [
          { label: "สัญญาจ้าง", "href": "/admin/employment-contracts", "icon": "FileProtectOutlined", "permission": "ems.employment_contracts.view" },
          { label: "e-Signature", "href": "/admin/e-signatures", "icon": "EditOutlined", "permission": "ems.e_signatures.view" },
          { label: "คลังเอกสารพนักงาน", "href": "/admin/personnel-files", "icon": "FolderOpenOutlined", "permission": "ems.personnel_files.view" }
        ]
      },
  
      {
        title: "TALENT & SUCCESSION PLANNING",
        icon: "CrownOutlined",
        items: [
          { label: "Succession Plan", "href": "/admin/succession-plans", "icon": "ApartmentOutlined", "permission": "ems.succession_plans.view" },
          { label: "Talent Pool", "href": "/admin/talent-pools", "icon": "CrownOutlined", "permission": "ems.talent_pools.view" },
          { label: "9-Box Grid", "href": "/admin/nine-box-grid", "icon": "TableOutlined", "permission": "ems.nine_box_grid.view" }
        ]
      },
  
      {
        title: "WORKFORCE PLANNING & BUDGET",
        icon: "FundOutlined",
        items: [
          { label: "แผนอัตรากำลัง (Headcount Plan)", "href": "/admin/headcount-plans", "icon": "TeamOutlined", "permission": "ems.headcount_plans.view" },
          { label: "งบประมาณบุคลากร", "href": "/admin/workforce-budgets", "icon": "FundOutlined", "permission": "ems.workforce_budgets.view" },
          { label: "Turnover Analysis", "href": "/admin/turnover-analysis", "icon": "LineChartOutlined", "permission": "ems.turnover_analysis.view" }
        ]
      },
  
      {
        title: "WORKFLOW & NOTIFICATION",
        icon: "ShareAltOutlined",
        items: [
          { label: "Workflow Builder", "href": "/admin/workflow-builder", "icon": "ShareAltOutlined", "permission": "workflow.builder.view" },
          { label: "Notification Center", "href": "/admin/notification-center", "icon": "BellOutlined", "permission": "workflow.notifications.view" },
          { label: "Approval History", "href": "/admin/approval-history", "icon": "HistoryOutlined", "permission": "workflow.approval_history.view" }
        ]
      },
  
      {
        title: "REPORTS & ANALYTICS",
        icon: "BarChartOutlined",
        items: [
          { label: "Dashboard ภาพรวม HR", "href": "/admin/hr-dashboard", "icon": "DashboardOutlined", "permission": "analytics.hr_dashboard.view" },
          { label: "Payroll Cost Analysis", "href": "/admin/payroll-cost-analysis", "icon": "PieChartOutlined", "permission": "analytics.payroll_cost.view" },
          { label: "รายงานการลา / OT", "href": "/admin/leave-ot-reports", "icon": "BarChartOutlined", "permission": "analytics.leave_ot_reports.view" },
          { label: "Custom Report Builder", "href": "/admin/custom-reports", "icon": "BuildOutlined", "permission": "analytics.custom_reports.view" }
        ]
      },
  
      {
        title: "ASSET & TRAVEL/EXPENSE",
        icon: "LaptopOutlined",
        items: [
          { label: "ทะเบียนทรัพย์สิน", "href": "/admin/asset-register", "icon": "LaptopOutlined", "permission": "ems.asset_register.view" },
          { label: "การเบิก-คืนทรัพย์สิน", "href": "/admin/asset-transactions", "icon": "SwapOutlined", "permission": "ems.asset_transactions.view" },
          { label: "เบิกค่าใช้จ่าย (Expense Claim)", "href": "/admin/expense-claims", "icon": "WalletOutlined", "permission": "ems.expense_claims.view" },
          { label: "อนุมัติค่าใช้จ่าย", "href": "/admin/expense-approvals", "icon": "CheckCircleOutlined", "permission": "ems.expense_approvals.view" }
        ]
      },
  
      {
        title: "USER ACCESS",
        icon: "SafetyCertificateOutlined",
        items: [
          { label: "ผู้ใช้งานระบบ", "href": "/admin/user-accounts", "icon": "UserOutlined", "permission": "access.user_accounts.view" },
          { label: "บทบาทและสิทธิ์", "href": "/admin/roles", "icon": "SafetyOutlined", "permission": "access.roles.view" },
          { label: "Permissions", "href": "/admin/permissions", "icon": "KeyOutlined", "permission": "access.permissions.view" },
          { label: "กำหนดบทบาทผู้ใช้งาน", "href": "/admin/user-access-assignments", "icon": "SafetyCertificateOutlined", "permission": "access.user_access_assignments.view" },
          { label: "Activity Logs", "href": "/admin/activity-logs", "icon": "AuditOutlined", "permission": "access.activity_logs.view" }
        ]
      },
  
      {
        title: "API MANAGEMENT",
        icon: "ApiOutlined",
        items: [
          { label: "API Clients", "href": "/admin/api-clients", "icon": "UsergroupAddOutlined", "permission": "api.api_clients.view" },
          { label: "API Tokens", "href": "/admin/api-tokens", "icon": "KeyOutlined", "permission": "api.api_tokens.view" },
          { label: "API Logs", "href": "/admin/api-logs", "icon": "AuditOutlined", "permission": "api.api_logs.view" }
        ]
      }
];

/***
 * 
 * 
 * 
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
  ✅ Payment Methods   เสร็จแล้ววว


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






// ==== อัตราภาษี /admin/tax-rates ====
description: "ตั้งค่าโครงสร้างอัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (Progressive Tax) ตามประกาศกรมสรรพากร ใช้เป็นฐานในการคำนวณภาษีหัก ณ ที่จ่ายของพนักงานทั้งหมด ควรอัปเดตทุกครั้งที่มีการเปลี่ยนแปลงอัตราภาษีจากทางราชการ"

// ==== ประกันสังคม /admin/social-security ====
description: "จัดการอัตราเงินสมทบประกันสังคมของนายจ้างและลูกจ้าง เพดานเงินเดือนที่ใช้คำนวณ และเลขที่บัญชีนายจ้างที่ขึ้นทะเบียนกับสำนักงานประกันสังคม ข้อมูลนี้จะถูกใช้คำนวณยอดหักประกันสังคมในสลิปเงินเดือนของพนักงาน"

// ==== กองทุนสำรองเลี้ยงชีพ /admin/provident-funds ====
description: "จัดการแผนกองทุนสำรองเลี้ยงชีพ (Provident Fund) รวมถึงอัตราเงินสะสมของพนักงานและเงินสมทบของบริษัท สามารถกำหนดได้หลายแผนตามกลุ่มพนักงาน และดูประวัติการนำส่งเงินเข้ากองทุนของแต่ละคนได้"
 * 
 */