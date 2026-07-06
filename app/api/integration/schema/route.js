import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";

const SCHEMA = [
  {
    module: "employees",
    table: "employees",
    description: "Employee Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count",
      "summary"
    ],

    searchFields: [
      "employee_code",
      "first_name_th",
      "last_name_th",
      "first_name_en",
      "last_name_en",
      "email",
      "phone"
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
      "employee_status_id"
    ],

    sortableFields: [
      "employee_code",
      "hire_date",
      "created_at"
    ],

    defaultSort: {
      field: "created_at",
      order: "desc"
    },

    pagination: true,

    search: true
  },

  {
    module: "branches",

    table: "branches",

    description: "Branch Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count"
    ],

    searchFields: [
      "branch_code",
      "branch_name",
      "phone"
    ],

    filterFields: [
      "id",
      "branch_code",
      "status"
    ],

    sortableFields: [
      "branch_code",
      "branch_name",
      "created_at"
    ],

    defaultSort: {
      field: "created_at",
      order: "desc"
    },

    pagination: true,

    search: true
  },

  {
    module: "departments",

    table: "departments",

    description: "Department Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count"
    ],

    searchFields: [
      "department_code",
      "department_name"
    ],

    filterFields: [
      "id",
      "department_code",
      "status"
    ],

    sortableFields: [
      "department_code",
      "department_name",
      "created_at"
    ],

    defaultSort: {
      field: "created_at",
      order: "desc"
    },

    pagination: true,

    search: true
  },

  {
    module: "divisions",

    table: "divisions",

    description: "Division Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count"
    ],

    searchFields: [
      "division_code",
      "division_name"
    ],

    filterFields: [
      "id",
      "division_code",
      "department_id",
      "status"
    ],

    sortableFields: [
      "division_code",
      "division_name",
      "created_at"
    ],

    defaultSort: {
      field: "created_at",
      order: "desc"
    },

    pagination: true,

    search: true
  },

  {
    module: "units",

    table: "units",

    description: "Unit Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count"
    ],

    searchFields: [
      "unit_code",
      "unit_name"
    ],

    filterFields: [
      "id",
      "unit_code",
      "division_id",
      "status"
    ],

    sortableFields: [
      "unit_code",
      "unit_name",
      "created_at"
    ],

    defaultSort: {
      field: "created_at",
      order: "desc"
    },

    pagination: true,

    search: true
  },

  {
    module: "positions",

    table: "positions",

    description: "Position Master",

    primaryKey: "id",

    actions: [
      "get",
      "list",
      "count"
    ],

    searchFields: [
      "position_code",
      "position_name",
      "position_group",
      "position_level"
    ],

    filterFields: [
      "id",
      "position_code",
      "position_level",
      "status"
    ],

    sortableFields: [
      "position_code",
      "position_name",
      "position_level",
      "created_at"
    ],

    defaultSort: {
      field: "created_at",
      order: "desc"
    },

    pagination: true,

    search: true
  }
];

export async function GET(req) {

  const url = new URL(req.url);

  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;
  const auth = await validateApiKey(req);

  if (!auth.success) {

    await logApiAccess({
      clientId: null,
      tokenId: null,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 401,
      isSuccess: false,
      requestQuery: {},
      errorMessage:
        "Unauthorized"
    });
    return auth.response;
  }

  const response = {
    success: true,
    version: "1.0.0",
    totalModules: SCHEMA.length,
    schema: SCHEMA
  };

  await logApiAccess({
    clientId: auth.client.id,
    tokenId: auth.token.id,
    method: "GET",
    endpoint: url.pathname,
    requestIp,
    userAgent,
    statusCode: 200,
    isSuccess: true,
    requestQuery: {},
    responseBody: {
      success: true,
      totalModules: SCHEMA.length
    }
  });
  return NextResponse.json(response);
}