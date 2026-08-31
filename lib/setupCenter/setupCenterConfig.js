/* =========================================================
   HRMS Enterprise - Setup Center Configuration
   Pure JS config, safe for Server + Client import
========================================================= */

export const SETUP_CENTER_STEPS = [
  {
    key: "base-master",
    order: 1,
    priority: "P0",
    title: "ข้อมูลพื้นฐาน",
    description:
      "Master พื้นฐานที่ Employee Form ใช้ เช่น ประเทศ สัญชาติ คำนำหน้า และเพศ",
    requiredForEmployee: true,
    items: [
      {
        key: "countries",
        label: "ประเทศ",
        href: "/admin/countries",
        permission: "ems.countries.view",
        table: "countries",
        required: true,
      },
      {
        key: "nationalities",
        label: "สัญชาติ",
        href: "/admin/nationalities",
        permission: "ems.nationalities.view",
        table: "nationalities",
        required: true,
      },
      {
        key: "titles",
        label: "คำนำหน้า",
        href: "/admin/titles",
        permission: "ems.titles.view",
        table: "titles",
        required: true,
      },
      {
        key: "genders",
        label: "เพศ",
        href: "/admin/genders",
        permission: "ems.genders.view",
        table: "genders",
        required: true,
      },
      {
        key: "religions",
        label: "ศาสนา",
        href: "/admin/religions",
        permission: "ems.religions.view",
        table: "religions",
        required: false,
      },
      {
        key: "marital-statuses",
        label: "สถานภาพสมรส",
        href: "/admin/marital-statuses",
        permission: "ems.marital_statuses.view",
        table: "marital_statuses",
        required: false,
      },
    ],
  },

  {
    key: "organization",
    order: 2,
    priority: "P0",
    title: "โครงสร้างองค์กร",
    description:
      "สร้างสายองค์กรจากบริษัทลงมาถึงหน่วยงานก่อนวางพนักงาน",
    requiredForEmployee: true,
    items: [
      {
        key: "companies",
        label: "บริษัท",
        href: "/admin/companies",
        permission: "ems.companies.view",
        table: "companies",
        required: true,
      },
      {
        key: "branch-groups",
        label: "กรุ๊ปสังกัด",
        href: "/admin/branch-groups",
        permission: "ems.branch_groups.view",
        table: "branch_groups",
        required: false,
      },
      {
        key: "branches",
        label: "สังกัด",
        href: "/admin/branches",
        permission: "ems.branches.view",
        table: "branches",
        required: true,
      },
      {
        key: "departments",
        label: "แผนก",
        href: "/admin/departments",
        permission: "ems.departments.view",
        table: "departments",
        required: true,
      },
      {
        key: "divisions",
        label: "ฝ่าย",
        href: "/admin/divisions",
        permission: "ems.divisions.view",
        table: "divisions",
        required: false,
      },
      {
        key: "units",
        label: "หน่วยงาน",
        href: "/admin/units",
        permission: "ems.units.view",
        table: "units",
        required: false,
      },
    ],
  },

  {
    key: "job-architecture",
    order: 3,
    priority: "P0",
    title: "Job Architecture",
    description:
      "กำหนดระดับ กลุ่มสายงาน Salary Band และตำแหน่ง ก่อนใช้กับ Employee",
    requiredForEmployee: true,
    items: [
      {
        key: "position-levels",
        label: "ระดับตำแหน่ง",
        href: "/admin/position-levels",
        permission: "ems.position_levels.view",
        table: "position_levels",
        required: true,
      },
      {
        key: "position-families",
        label: "กลุ่มสายงาน",
        href: "/admin/position-families",
        permission: "ems.position_families.view",
        table: "position_families",
        required: true,
      },
      {
        key: "position-family-levels",
        label: "ระดับของกลุ่มสายงาน",
        href: "/admin/position-family-levels",
        permission: "ems.position_family_levels.view",
        table: "position_family_levels",
        required: true,
      },
      {
        key: "position-level-bands",
        label: "Salary Band",
        href: "/admin/position-level-bands",
        permission: "ems.position_level_bands.view",
        table: "position_level_bands",
        required: true,
      },
      {
        key: "jobs",
        label: "บทบาทงาน / โครงสร้างธุรกิจ",
        href: "/admin/jobs",
        permission: "ems.jobs.view",
        table: "jobs",
        required: false,
      },
      {
        key: "positions",
        label: "ตำแหน่ง",
        href: "/admin/positions",
        permission: "ems.positions.view",
        table: "positions",
        required: true,
      },
      {
        key: "unit-positions",
        label: "ตำแหน่งตามหน่วย",
        href: "/admin/unit-positions",
        permission: "ems.unit_positions.view",
        table: "unit_positions",
        required: false,
      },
    ],
  },

  {
    key: "employee-master",
    order: 4,
    priority: "P0",
    title: "Employee Master Setup",
    description:
      "Master ที่กำหนดวิธีจ้าง สถานะ และวิธีสร้างรหัสพนักงาน",
    requiredForEmployee: true,
    items: [
      {
        key: "employment-types",
        label: "ประเภทการจ้าง",
        href: "/admin/employment-types",
        permission: "ems.employment_types.view",
        table: "employment_types",
        required: true,
      },
      {
        key: "employee-statuses",
        label: "สถานะพนักงาน",
        href: "/admin/employee-statuses",
        permission: "ems.employee_statuses.view",
        table: "employee_statuses",
        required: true,
      },
      {
        key: "employee-code-settings",
        label: "ตั้งค่ารหัสพนักงาน",
        href: "/admin/employee-code-settings",
        permission: "ems.employee_code_settings.view",
        table: "employee_code_settings",
        required: true,
      },
    ],
  },

  {
    key: "payroll-foundation",
    order: 5,
    priority: "P1",
    title: "Payroll Foundation",
    description:
      "ตั้ง Master Payroll ตั้งแต่รอบการจ่ายจนถึง Salary Structure",
    requiredForEmployee: false,
    items: [
      {
        key: "payroll-types",
        label: "รอบการจ่ายเงิน",
        href: "/admin/payroll-types",
        permission: "ems.payroll_types.view",
        table: "payroll_types",
        required: true,
      },
      {
        key: "payroll-companies",
        label: "บริษัทเงินเดือน",
        href: "/admin/payroll-companies",
        permission: "ems.payroll_companies.view",
        table: "payroll_companies",
        required: true,
      },
      {
        key: "payroll-groups",
        label: "กลุ่มเงินเดือน",
        href: "/admin/payroll-groups",
        permission: "ems.payroll_groups.view",
        table: "payroll_groups",
        required: true,
      },
      {
        key: "earning-types",
        label: "ประเภทเงินได้",
        href: "/admin/earning-types",
        permission: "ems.earning_types.view",
        table: "earning_types",
        required: true,
      },
      {
        key: "deduction-types",
        label: "ประเภทรายการหัก",
        href: "/admin/deduction-types",
        permission: "ems.deduction_types.view",
        table: "deduction_types",
        required: true,
      },
      {
        key: "formula-variables",
        label: "ตัวแปรสูตรคำนวณ",
        href: "/admin/formula-variables",
        permission: "ems.formula_variables.view",
        table: "formula_variables",
        required: false,
      },
      {
        key: "payroll-formulas",
        label: "สูตรการคำนวณเงินเดือน",
        href: "/admin/payroll-formulas",
        permission: "ems.payroll_formulas.view",
        table: "payroll_formulas",
        required: false,
      },
      {
        key: "salary-components",
        label: "รายการเงินเดือน",
        href: "/admin/salary-components",
        permission: "ems.salary_components.view",
        table: "salary_components",
        required: true,
      },
      {
        key: "salary-structures",
        label: "Salary Structure",
        href: "/admin/salary-structures",
        permission: "ems.salary_structures.view",
        table: "salary_structures",
        required: true,
      },
    ],
  },

  {
    key: "employees",
    order: 6,
    priority: "P0",
    title: "พนักงาน",
    description:
      "เพิ่มพนักงานใหม่ หรือ Migration พนักงานเดิมจาก Excel",
    requiredForEmployee: false,
    items: [
      {
        key: "employees",
        label: "พนักงาน",
        href: "/admin/employees",
        permission: "ems.employees.view",
        table: "employees",
        required: true,
      },
      {
        key: "data-import",
        label: "นำเข้าพนักงานจากระบบเก่า",
        href: "/admin/data-import",
        permission: "data.import.view",
        table: "data_import_jobs",
        required: false,
        manualReady: true,
      },
    ],
  },

  {
    key: "company-structure",
    order: 7,
    priority: "P1",
    title: "Company Structure",
    description:
      "จัดโครงสร้างการบังคับบัญชา สร้าง Slot และวางพนักงานลง Slot",
    requiredForEmployee: false,
    items: [
      {
        key: "divisional-structures",
        label: "โครงสร้างองค์กรตามแผนก",
        href: "/admin/divisional-structures",
        permission: "ems.org_structure.view",
        table: "departments",
        required: true,
        proxyCheck: true,
      },
      {
        key: "org-position-slots",
        label: "Position Slot",
        href: "/admin/org-position-slots",
        permission: "ems.org_structure.view",
        table: "org_position_slots",
        required: true,
      },
      {
        key: "employee-position-assignments",
        label: "การครองตำแหน่งองค์กร",
        href: "/admin/employee-position-assignments",
        permission: "ems.org_structure.view",
        table: "employee_position_assignments",
        required: true,
      },
      {
        key: "org-chart",
        label: "ผังโครงสร้างองค์กร",
        href: "/admin/org-chart",
        permission: "ems.org_chart.view",
        table: "org_position_slots",
        required: false,
        proxyCheck: true,
      },
    ],
  },

  {
    key: "compensation",
    order: 8,
    priority: "P1",
    title: "Compensation / Banking / Tax",
    description:
      "กำหนดเงินเดือน วิธีจ่าย ธนาคาร ภาษี และประกันสังคมให้พร้อมใช้งาน",
    requiredForEmployee: false,
    items: [
      {
        key: "employee-compensations",
        label: "โครงสร้างเงินเดือนพนักงาน",
        href: "/admin/employee-compensations",
        permission: "ems.employee_compensations.view",
        table: "employee_compensations",
        required: true,
      },
      {
        key: "banks",
        label: "ธนาคาร",
        href: "/admin/banks",
        permission: "ems.banks.view",
        table: "banks",
        required: true,
      },
      {
        key: "payment-methods",
        label: "วิธีการจ่ายเงิน",
        href: "/admin/payment-methods",
        permission: "ems.payment_methods.view",
        table: "payment_methods",
        required: true,
      },
      {
        key: "employee-bank-accounts",
        label: "บัญชีธนาคารพนักงาน",
        href: "/admin/employee-bank-accounts",
        permission: "ems.employee_bank_accounts.view",
        table: "employee_bank_accounts",
        required: false,
      },
      {
        key: "tax-profiles",
        label: "โปรไฟล์ภาษี",
        href: "/admin/tax-profiles",
        permission: "ems.tax_profiles.view",
        table: "tax_profiles",
        required: false,
      },
      {
        key: "social-security",
        label: "ประกันสังคม",
        href: "/admin/social-security",
        permission: "ems.social_security.view",
        table: "social_security_settings",
        required: false,
      },
    ],
  },

  {
    key: "time-leave",
    order: 9,
    priority: "P1",
    title: "Time / Attendance / Leave",
    description:
      "เตรียมกะ ตารางเข้างาน วันหยุด วันลา และ OT",
    requiredForEmployee: false,
    items: [
      {
        key: "work-shifts",
        label: "กะการทำงาน",
        href: "/admin/work-shifts",
        permission: "ems.work_shifts.view",
        table: "work_shifts",
        required: true,
      },
      {
        key: "work-schedules",
        label: "ตารางเข้างาน",
        href: "/admin/work-schedules",
        permission: "ems.work_schedules.view",
        table: "work_schedules",
        required: false,
      },
      {
        key: "holiday-calendars",
        label: "ปฏิทินวันหยุด",
        href: "/admin/holiday-calendars",
        permission: "ems.holiday_calendars.view",
        table: "holiday_calendars",
        required: true,
      },
      {
        key: "leave-types",
        label: "ประเภทวันลา",
        href: "/admin/leave-types",
        permission: "ems.leave_types.view",
        table: "leave_types",
        required: true,
      },
      {
        key: "leave-entitlements",
        label: "โควตาวันลา",
        href: "/admin/leave-entitlements",
        permission: "ems.leave_entitlements.view",
        table: "leave_entitlements",
        required: false,
      },
      {
        key: "overtime-rules",
        label: "กฎ OT",
        href: "/admin/overtime-rules",
        permission: "ems.overtime_rules.view",
        table: "overtime_rules",
        required: false,
      },
    ],
  },

  {
    key: "access",
    order: 10,
    priority: "P2",
    title: "User Access / ESS",
    description:
      "สร้างบัญชี กำหนด Role และ Scope ก่อนเปิดให้พนักงานใช้งานระบบ",
    requiredForEmployee: false,
    items: [
      {
        key: "roles",
        label: "บทบาทและสิทธิ์",
        href: "/admin/roles",
        permission: "access.roles.view",
        table: "roles",
        required: true,
      },
      {
        key: "user-accounts",
        label: "ผู้ใช้งานระบบ",
        href: "/admin/user-accounts",
        permission: "access.user_accounts.view",
        table: "user_accounts",
        required: true,
      },
      {
        key: "user-access-assignments",
        label: "กำหนดบทบาทผู้ใช้งาน",
        href: "/admin/user-access-assignments",
        permission: "access.user_access_assignments.view",
        table: "user_access_assignments",
        required: true,
      },
    ],
  },
];

export function getAllSetupItems() {
  return SETUP_CENTER_STEPS.flatMap(
    (step) =>
      step.items.map(
        (item) => ({
          ...item,
          stepKey:
            step.key,
          stepTitle:
            step.title,
          stepOrder:
            step.order,
          priority:
            step.priority,
        })
      )
  );
}
