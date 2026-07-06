export const INTEGRATION_REGISTRY = {
  employees: {
    module: "employees",
    table: "employees",
    description: "Employee Master",
    primaryKey: "id",
    actions: ["get", "list", "count", "summary"],

    select: `
      id,
      employee_code,
      first_name_th,
      last_name_th,
      first_name_en,
      last_name_en,
      nick_name,
      gender,
      phone,
      email,
      employee_photo_url,
      hire_date,
      employment_type,
      nationality,
      status,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      employee_status_id,
      branches (
        branch_code,
        branch_name
      ),
      departments (
        department_code,
        department_name
      ),
      divisions (
        division_code,
        division_name
      ),
      units (
        unit_code,
        unit_name
      ),
      positions (
        position_code,
        position_name,
        position_group,
        position_level
      ),
      employee_statuses (
        status_code,
        status_name,
        color
      )
    `,

    searchFields: [
      "employee_code",
      "first_name_th",
      "last_name_th",
      "first_name_en",
      "last_name_en",
      "email",
      "phone",
    ],

    filterFields: [
      "id",
      "employee_code",
      "status",
      "branch_id",
      "department_id",
      "division_id",
      "unit_id",
      "position_id",
      "employee_status_id",
    ],

    sortableFields: ["employee_code", "hire_date", "created_at"],

    defaultSort: {
      field: "created_at",
      order: "desc",
    },

    examples: {
      list: {
        module: "employees",
        action: "list",
      },
      pagination: {
        module: "employees",
        action: "list",
        page: 1,
        limit: 20,
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

  branches: {
    module: "branches",
    table: "branches",
    description: "Branch Master",
    primaryKey: "id",
    actions: ["get", "list", "count"],

    select: `
      id,
      branch_code,
      branch_name,
      phone,
      status,
      created_at
    `,

    searchFields: ["branch_code", "branch_name", "phone"],
    filterFields: ["id", "branch_code", "status"],
    sortableFields: ["branch_code", "branch_name", "created_at"],

    defaultSort: {
      field: "created_at",
      order: "desc",
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

  departments: {
    module: "departments",
    table: "departments",
    description: "Department Master",
    primaryKey: "id",
    actions: ["get", "list", "count"],

    select: `
      id,
      department_code,
      department_name,
      status,
      created_at
    `,

    searchFields: ["department_code", "department_name"],
    filterFields: ["id", "department_code", "status"],
    sortableFields: ["department_code", "department_name", "created_at"],

    defaultSort: {
      field: "created_at",
      order: "desc",
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

  divisions: {
    module: "divisions",
    table: "divisions",
    description: "Division Master",
    primaryKey: "id",
    actions: ["get", "list", "count"],

    select: `
      id,
      division_code,
      division_name,
      department_id,
      status,
      created_at,
      departments (
        department_code,
        department_name
      )
    `,

    searchFields: ["division_code", "division_name"],
    filterFields: ["id", "division_code", "department_id", "status"],
    sortableFields: ["division_code", "division_name", "created_at"],

    defaultSort: {
      field: "created_at",
      order: "desc",
    },

    examples: {
      list: {
        module: "divisions",
        action: "list",
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

  units: {
    module: "units",
    table: "units",
    description: "Unit Master",
    primaryKey: "id",
    actions: ["get", "list", "count"],

    select: `
      id,
      unit_code,
      unit_name,
      division_id,
      status,
      created_at,
      divisions (
        division_code,
        division_name
      )
    `,

    searchFields: ["unit_code", "unit_name"],
    filterFields: ["id", "unit_code", "division_id", "status"],
    sortableFields: ["unit_code", "unit_name", "created_at"],

    defaultSort: {
      field: "created_at",
      order: "desc",
    },

    examples: {
      list: {
        module: "units",
        action: "list",
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

  positions: {
    module: "positions",
    table: "positions",
    description: "Position Master",
    primaryKey: "id",
    actions: ["get", "list", "count"],

    select: `
      id,
      position_code,
      position_name,
      position_group,
      position_level,
      status,
      created_at
    `,

    searchFields: [
      "position_code",
      "position_name",
      "position_group",
      "position_level",
    ],

    filterFields: ["id", "position_code", "position_level", "status"],
    sortableFields: [
      "position_code",
      "position_name",
      "position_level",
      "created_at",
    ],

    defaultSort: {
      field: "created_at",
      order: "desc",
    },

    examples: {
      list: {
        module: "positions",
        action: "list",
      },
      search: {
        module: "positions",
        action: "list",
        search: "Manager",
      },
      filter: {
        module: "positions",
        action: "list",
        filter: {
          position_level: "P7",
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

export const getIntegrationModule = (moduleName) => {
  return INTEGRATION_REGISTRY[moduleName] || null;
};

export const getIntegrationModules = () => {
  return Object.values(INTEGRATION_REGISTRY);
};

export const getIntegrationModuleNames = () => {
  return Object.keys(INTEGRATION_REGISTRY);
};

export const getIntegrationActions = () => {
  return Array.from(
    new Set(
      Object.values(INTEGRATION_REGISTRY).flatMap((item) => item.actions || [])
    )
  );
};