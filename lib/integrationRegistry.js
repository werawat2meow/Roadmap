/* =========================================================
   Integration Registry
   HRMS Enterprise

   IMPORTANT
   ---------------------------------------------------------
   Registry นี้ต้องอ้างอิง Column / Relation
   ตาม Database Schema ปัจจุบันเท่านั้น

   Position Level:
   employees.position_level_id
       -> position_levels

   Position Master:
   positions
       -> position_level_mappings
       -> position_levels
========================================================= */

export const INTEGRATION_REGISTRY = {
  /* =======================================================
     EMPLOYEES
  ======================================================= */

  employees: {
    module: "employees",

    table: "employees",

    description: "Employee Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count",
      "summary",
    ],

    /* -----------------------------------------------------
       SELECT

       สำคัญ:
       ห้ามอ่าน positions.position_level
       เพราะ DB ใหม่ใช้ employees.position_level_id
    ----------------------------------------------------- */

    select: `
      id,
      employee_code,

      first_name_th,
      middle_name_th,
      last_name_th,

      first_name_en,
      middle_name_en,
      last_name_en,

      nickname_th,
      nickname_en,

      phone,
      email,
      employee_photo_url,

      hire_date,
      start_work_date,
      resignation_date,

      status,

      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,

      employment_type_id,
      gender_id,
      nationality_id,

      position_family_id,
      position_level_id,
      position_id,

      employee_status_id,

      companies:companies!employees_company_id_fkey (
        id,
        company_code,
        company_name_th,
        company_name_en
      ),

      branch_groups:branch_groups!employees_branch_group_id_fkey (
        id,
        group_code,
        group_name
      ),

      branches:branches!employees_branch_id_fkey (
        id,
        branch_code,
        branch_name
      ),

      departments:departments!employees_department_id_fkey (
        id,
        department_code,
        department_name
      ),

      divisions:divisions!employees_division_id_fkey (
        id,
        division_code,
        division_name
      ),

      units:units!employees_unit_id_fkey (
        id,
        unit_code,
        unit_name
      ),

      employment_types:employment_types!employees_employment_type_id_fkey (
        id,
        type_code,
        type_name
      ),

      genders:genders!employees_gender_id_fkey (
        id,
        gender_code,
        gender_name_th,
        gender_name_en
      ),

      nationalities:nationalities!employees_nationality_id_fkey (
        id,
        nationality_code,
        nationality_name_th,
        nationality_name_en,
        iso2,
        iso3
      ),

      position_families:position_families!employees_position_family_id_fkey (
        id,
        family_code,
        family_name
      ),

      position_levels:position_levels!employees_position_level_id_fkey (
        id,
        level_code,
        level_name,
        sort_order
      ),

      positions:positions!employees_position_id_fkey (
        id,
        position_code,
        position_name
      ),

      employee_statuses:employee_statuses!employees_employee_status_id_fkey (
        id,
        status_code,
        status_name,
        color
      )
    `,

    /* -----------------------------------------------------
       SEARCH
       ต้องเป็น column จริงใน employees เท่านั้น
    ----------------------------------------------------- */

    searchFields: [
      "employee_code",

      "first_name_th",
      "middle_name_th",
      "last_name_th",

      "first_name_en",
      "middle_name_en",
      "last_name_en",

      "phone",
      "email",
    ],

    /* -----------------------------------------------------
       FILTER
    ----------------------------------------------------- */

    filterFields: [
      "id",

      "employee_code",

      "status",

      "company_id",
      "branch_group_id",
      "branch_id",
      "department_id",
      "division_id",
      "unit_id",

      "employment_type_id",
      "gender_id",
      "nationality_id",

      "position_family_id",
      "position_level_id",
      "position_id",

      "employee_status_id",
    ],

    /* -----------------------------------------------------
       SORT
    ----------------------------------------------------- */

    sortableFields: [
      "employee_code",
      "hire_date",
      "start_work_date",
      "created_at",
    ],

    defaultSort: {
      field: "created_at",
      order: "desc",
    },

    /* -----------------------------------------------------
       EXAMPLES
    ----------------------------------------------------- */

    examples: {
      list: {
        module: "employees",
        action: "list",
      },

      pagination: {
        module: "employees",
        action: "list",
        page: 1,
        limit: 100,
      },

      search: {
        module: "employees",
        action: "list",
        search: "สมชาย",
      },

      filter: {
        module: "employees",
        action: "list",

        filter: {
          status: "active",
        },
      },

      filterByBranch: {
        module: "employees",
        action: "list",

        filter: {
          branch_id: "UUID",
        },
      },

      filterByPositionLevel: {
        module: "employees",
        action: "list",

        filter: {
          position_level_id: "UUID",
        },
      },

      get: {
        module: "employees",
        action: "get",
        id: "UUID",
      },

      count: {
        module: "employees",
        action: "count",
      },

      summary: {
        module: "employees",
        action: "summary",
      },
    },
  },

  /* =======================================================
     BRANCHES
  ======================================================= */

  branches: {
    module: "branches",

    table: "branches",

    description: "Branch Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count",
    ],

    select: `
      id,

      company_id,
      group_id,

      branch_code,
      branch_name,

      phone,

      status,
      sort_order,

      created_at,
      updated_at,

      companies (
        id,
        company_code,
        company_name_th,
        company_name_en
      ),

      branch_groups:branch_groups!branches_group_id_fkey (
        id,
        group_code,
        group_name
      )
    `,

    searchFields: [
      "branch_code",
      "branch_name",
      "phone",
    ],

    filterFields: [
      "id",

      "company_id",
      "group_id",

      "branch_code",
      "status",
    ],

    sortableFields: [
      "sort_order",
      "branch_code",
      "branch_name",
      "created_at",
    ],

    defaultSort: {
      field: "sort_order",
      order: "asc",
    },

    examples: {
      list: {
        module: "branches",
        action: "list",
      },

      search: {
        module: "branches",
        action: "list",
        search: "Phuket",
      },

      filterByCompany: {
        module: "branches",
        action: "list",

        filter: {
          company_id: "UUID",
        },
      },

      filterByBranchGroup: {
        module: "branches",
        action: "list",

        filter: {
          group_id: "UUID",
        },
      },

      get: {
        module: "branches",
        action: "get",
        id: "UUID",
      },

      count: {
        module: "branches",
        action: "count",
      },
    },
  },

  /* =======================================================
     DEPARTMENTS
  ======================================================= */

  departments: {
    module: "departments",

    table: "departments",

    description: "Department Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count",
    ],

    select: `
      id,

      department_code,
      department_name,

      department_color,
      department_icon,

      status,
      sort_order,

      created_at,
      updated_at
    `,

    searchFields: [
      "department_code",
      "department_name",
    ],

    filterFields: [
      "id",
      "department_code",
      "status",
    ],

    sortableFields: [
      "sort_order",
      "department_code",
      "department_name",
      "created_at",
    ],

    defaultSort: {
      field: "sort_order",
      order: "asc",
    },

    examples: {
      list: {
        module: "departments",
        action: "list",
      },

      search: {
        module: "departments",
        action: "list",
        search: "HR",
      },

      get: {
        module: "departments",
        action: "get",
        id: "UUID",
      },

      count: {
        module: "departments",
        action: "count",
      },
    },
  },

  /* =======================================================
     DIVISIONS
  ======================================================= */

  divisions: {
    module: "divisions",

    table: "divisions",

    description: "Division Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count",
    ],

    select: `
      id,

      department_id,

      division_code,
      division_name,

      status,
      sort_order,

      created_at,
      updated_at,

      departments (
        id,
        department_code,
        department_name
      )
    `,

    searchFields: [
      "division_code",
      "division_name",
    ],

    filterFields: [
      "id",
      "division_code",
      "department_id",
      "status",
    ],

    sortableFields: [
      "sort_order",
      "division_code",
      "division_name",
      "created_at",
    ],

    defaultSort: {
      field: "sort_order",
      order: "asc",
    },

    examples: {
      list: {
        module: "divisions",
        action: "list",
      },

      search: {
        module: "divisions",
        action: "list",
        search: "Operations",
      },

      filter: {
        module: "divisions",
        action: "list",

        filter: {
          department_id: "UUID",
        },
      },

      get: {
        module: "divisions",
        action: "get",
        id: "UUID",
      },

      count: {
        module: "divisions",
        action: "count",
      },
    },
  },

  /* =======================================================
     UNITS
  ======================================================= */

  units: {
    module: "units",

    table: "units",

    description: "Unit Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count",
    ],

    select: `
      id,

      division_id,

      unit_code,
      unit_name,

      status,
      sort_order,

      created_at,
      updated_at,

      divisions (
        id,
        division_code,
        division_name,

        department_id,

        departments (
          id,
          department_code,
          department_name
        )
      )
    `,

    searchFields: [
      "unit_code",
      "unit_name",
    ],

    filterFields: [
      "id",
      "unit_code",
      "division_id",
      "status",
    ],

    sortableFields: [
      "sort_order",
      "unit_code",
      "unit_name",
      "created_at",
    ],

    defaultSort: {
      field: "sort_order",
      order: "asc",
    },

    examples: {
      list: {
        module: "units",
        action: "list",
      },

      search: {
        module: "units",
        action: "list",
        search: "Accounting",
      },

      filter: {
        module: "units",
        action: "list",

        filter: {
          division_id: "UUID",
        },
      },

      get: {
        module: "units",
        action: "get",
        id: "UUID",
      },

      count: {
        module: "units",
        action: "count",
      },
    },
  },

  /* =======================================================
     POSITIONS
  ======================================================= */

  positions: {
    module: "positions",
    table: "positions",
    description: "Position Master",
    primaryKey: "id",
    actions: [
      "get",
      "list",
      "count",
    ],
    /* -----------------------------------------------------
       IMPORTANT

       ไม่มี positions.position_level แล้ว

       Level ใช้:
       position_level_mappings
         -> position_levels
    ----------------------------------------------------- */
    select: `
      id,

      position_code,
      position_name,

      short_name,
      description,

      position_group,

      job_id,
      position_family_id,

      is_manager,
      is_executive,
      allow_multiple_assignment,

      status,
      sort_order,

      created_at,
      updated_at,

      jobs (
        id,
        job_code,
        job_name
      ),

      position_families (
        id,
        family_code,
        family_name
      ),

      position_level_mappings (
        id,
        position_level_id,
        is_default,
        sort_order,

        position_level:position_levels (
          id,
          level_code,
          level_name,
          sort_order
        )
      )
    `,

    /* -----------------------------------------------------
       Search เฉพาะ Column ที่อยู่ใน positions จริง
    ----------------------------------------------------- */
    searchFields: [
      "position_code",
      "position_name",
      "short_name",
      "description",
      "position_group",
    ],

    /* -----------------------------------------------------
       ห้ามใส่ position_level
       เพราะไม่ใช่ column ใน positions แล้ว
    ----------------------------------------------------- */

    filterFields: [
      "id",
      "position_code",
      "job_id",
      "position_family_id",
      "status",
    ],

    sortableFields: [
      "sort_order",
      "position_code",
      "position_name",
      "created_at",
    ],

    defaultSort: {
      field: "sort_order",
      order: "asc",
    },

    examples: {
      list: {
        module: "positions",
        action: "list",
      },
      pagination: {
        module: "positions",
        action: "list",
        page: 1,
        limit: 100,
      },
      search: {
        module: "positions",
        action: "list",
        search: "Manager",
      },

      filterByFamily: {
        module: "positions",
        action: "list",

        filter: {
          position_family_id: "UUID",
        },
      },

      get: {
        module: "positions",
        action: "get",
        id: "UUID",
      },

      count: {
        module: "positions",
        action: "count",
      },
    },
  },
};

/* =========================================================
   GET MODULE
========================================================= */

export const getIntegrationModule = (moduleName) => {
  return (
    INTEGRATION_REGISTRY[
      moduleName
    ] || null
  );
};

/* =========================================================
   GET ALL MODULES
========================================================= */

export const getIntegrationModules = () => {
  return Object.values(
    INTEGRATION_REGISTRY
  );
};

/* =========================================================
   GET MODULE NAMES
========================================================= */

export const getIntegrationModuleNames = () => {
  return Object.keys(
    INTEGRATION_REGISTRY
  );
};

export const getIntegrationActions = () => {
  return Array.from(
    new Set(Object.values(INTEGRATION_REGISTRY).flatMap((item) =>item.actions || []))
  );
};