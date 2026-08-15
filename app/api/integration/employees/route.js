/*
endpoint สำหรับเชื่อมระบบอื่นโดยเฉพาะ

ใช้สำหรับให้ระบบอื่นเชื่อมข้อมูลพนักงานโดยตรง
  - รองรับ filter เช่น
  - employee_code
  - status
  - branch_id
จะได้ข้อมูลเชิงลึกครบทั้ง
  - สังกัด
  - แผนก
  - ฝ่าย
  - หน่วย
  - ตำแหน่ง
  - สถานะพนักงาน
เหมาะกับระบบ Benefit, HRM, Time Attendance, Payroll
ต้องส่ง x-api-key ที่สร้างจากระบบ Admin มาใน header ด้วย เพื่อยืนยันตัวตนและสิทธิ์การเข้าถึงข้อมูลพนักงาน

Header:
  x-api-key: Value
    GET http://localhost:3000/api/integration/employees
    GET http://localhost:3000/api/integration/employees?employee_code=
    GET http://localhost:3000/api/integration/employees?status=
    GET http://localhost:3000/api/integration/employees?branch_id=

*/
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";

const EMPLOYEE_INTEGRATION_SELECT = `
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

  mobile_phone,
  work_phone,
  personal_email,
  work_email,

  employee_photo_url,

  start_work_date,
  confirmation_date,
  resignation_date,
  retirement_date,

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
  job_id,

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
`;

function mapEmployeeForIntegration(
  item
) {
  return {
    id:
      item.id,

    employee_code:
      item.employee_code,

    /* =========================
       Name
    ========================= */

    first_name_th:
      item.first_name_th,

    middle_name_th:
      item.middle_name_th,

    last_name_th:
      item.last_name_th,

    full_name_th:
      [
        item.first_name_th,
        item.middle_name_th,
        item.last_name_th,
      ]
        .filter(Boolean)
        .join(" "),

    first_name_en:
      item.first_name_en,

    middle_name_en:
      item.middle_name_en,

    last_name_en:
      item.last_name_en,

    full_name_en:
      [
        item.first_name_en,
        item.middle_name_en,
        item.last_name_en,
      ]
        .filter(Boolean)
        .join(" "),

    nickname_th:
      item.nickname_th || null,

    nickname_en:
      item.nickname_en || null,

    /* =========================
       Contact
    ========================= */

    mobile_phone:
      item.mobile_phone || null,

    work_phone:
      item.work_phone || null,

    personal_email:
      item.personal_email || null,

    work_email:
      item.work_email || null,

    employee_photo_url:
      item.employee_photo_url || "",

    /* =========================
       Employment Dates
    ========================= */

    start_work_date:
      item.start_work_date || null,

    confirmation_date:
      item.confirmation_date || null,

    resignation_date:
      item.resignation_date || null,

    retirement_date:
      item.retirement_date || null,

    status:
      item.status,

    /* =========================
       Company
    ========================= */

    company: {
      id:
        item.company_id || null,

      code:
        item.companies
          ?.company_code ||
        null,

      name_th:
        item.companies
          ?.company_name_th ||
        null,

      name_en:
        item.companies
          ?.company_name_en ||
        null,
    },

    /* =========================
       Branch Group
    ========================= */

    branch_group: {
      id:
        item.branch_group_id ||
        null,

      code:
        item.branch_groups
          ?.group_code ||
        null,

      name:
        item.branch_groups
          ?.group_name ||
        null,
    },

    /* =========================
       Branch
    ========================= */

    branch: {
      id:
        item.branch_id || null,

      code:
        item.branches
          ?.branch_code ||
        null,

      name:
        item.branches
          ?.branch_name ||
        null,
    },

    /* =========================
       Department
    ========================= */

    department: {
      id:
        item.department_id ||
        null,

      code:
        item.departments
          ?.department_code ||
        null,

      name:
        item.departments
          ?.department_name ||
        null,
    },

    /* =========================
       Division
    ========================= */

    division: {
      id:
        item.division_id || null,

      code:
        item.divisions
          ?.division_code ||
        null,

      name:
        item.divisions
          ?.division_name ||
        null,
    },

    /* =========================
       Unit
    ========================= */

    unit: {
      id:
        item.unit_id || null,

      code:
        item.units
          ?.unit_code ||
        null,

      name:
        item.units
          ?.unit_name ||
        null,
    },

    /* =========================
       Employment Type
    ========================= */

    employment_type: {
      id:
        item.employment_type_id ||
        null,

      code:
        item.employment_types
          ?.type_code ||
        null,

      name:
        item.employment_types
          ?.type_name ||
        null,
    },

    /* =========================
       Gender
    ========================= */

    gender: {
      id:
        item.gender_id || null,

      code:
        item.genders
          ?.gender_code ||
        null,

      name_th:
        item.genders
          ?.gender_name_th ||
        null,

      name_en:
        item.genders
          ?.gender_name_en ||
        null,
    },

    /* =========================
       Nationality
    ========================= */

    nationality: {
      id:
        item.nationality_id ||
        null,

      code:
        item.nationalities
          ?.nationality_code ||
        null,

      name_th:
        item.nationalities
          ?.nationality_name_th ||
        null,

      name_en:
        item.nationalities
          ?.nationality_name_en ||
        null,

      iso2:
        item.nationalities
          ?.iso2 ||
        null,

      iso3:
        item.nationalities
          ?.iso3 ||
        null,
    },

    /* =========================
       Position Family
    ========================= */

    position_family: {
      id:
        item.position_family_id ||
        null,

      code:
        item.position_families
          ?.family_code ||
        null,

      name:
        item.position_families
          ?.family_name ||
        null,
    },

    /* =========================
       Position Level
    ========================= */

    position_level: {
      id:
        item.position_level_id ||
        null,

      code:
        item.position_levels
          ?.level_code ||
        null,

      name:
        item.position_levels
          ?.level_name ||
        null,
    },

    /* =========================
       Position
    ========================= */

    position: {
      id:
        item.position_id || null,

      code:
        item.positions
          ?.position_code ||
        null,

      name:
        item.positions
          ?.position_name ||
        null,
    },

    job_id:
      item.job_id || null,

    /* =========================
       Employee Status
    ========================= */

    employee_status: {
      id:
        item.employee_status_id ||
        null,

      code:
        item.employee_statuses
          ?.status_code ||
        null,

      name:
        item.employee_statuses
          ?.status_name ||
        null,

      color:
        item.employee_statuses
          ?.color ||
        null,
    },
  };
}

export async function GET(req) {
  const url = new URL(req.url);
  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;
  const searchParams = url.searchParams;
  const requestQuery = Object.fromEntries(searchParams.entries());

  // 🔐 validate token
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
      requestQuery,
      errorMessage: "Unauthorized: Invalid or missing API token",
    });

    return auth.response;
  }

  try {
    const employee_code = searchParams.get("employee_code")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const branch_id = searchParams.get("branch_id")?.trim() || "";

    let query = supabaseAdmin
      .from("employees")
      .select(
        EMPLOYEE_INTEGRATION_SELECT
      )
      .order("created_at", {
        ascending: false,
      });

    if (employee_code) {
      query = query.eq("employee_code", employee_code);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (branch_id) {
      query = query.eq("branch_id", branch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const mappedData = (data || []).map(mapEmployeeForIntegration);

    const responseBody = {
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      data: mappedData,
    };

    // 🧾 log success
    await logApiAccess({
      clientId: auth.client.id,
      tokenId: auth.token.id,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 200,
      isSuccess: true,
      requestQuery,
      responseBody: {
        success: true,
        count: mappedData.length,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("INTEGRATION_EMPLOYEES_API_ERROR:", error);

    await logApiAccess({
      clientId: auth.client?.id || null,
      tokenId: auth.token?.id || null,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 500,
      isSuccess: false,
      requestQuery,
      errorMessage: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const url = new URL(req.url);
  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;

  let body = {};

  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestQuery = body || {};

  // 🔐 validate token
  const auth = await validateApiKey(req);

  if (!auth.success) {
    await logApiAccess({
      clientId: null,
      tokenId: null,
      method: "POST",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 401,
      isSuccess: false,
      requestQuery,
      errorMessage: "Unauthorized: Invalid or missing API token",
    });

    return auth.response;
  }

  try {
    const employee_code = body?.employee_code?.trim() || "";
    const status = body?.status?.trim() || "";
    const branch_id = body?.branch_id?.trim() || "";

    let query = supabaseAdmin
      .from("employees")
      .select(
        EMPLOYEE_INTEGRATION_SELECT
      )
      .order("created_at", {
        ascending: false,
      });

    if (employee_code) {
      query = query.eq("employee_code", employee_code);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (branch_id) {
      query = query.eq("branch_id", branch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const mappedData =
    (data || []).map(
      mapEmployeeForIntegration
    );

    const responseBody = {
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      filter: {
        employee_code: employee_code || null,
        status: status || null,
        branch_id: branch_id || null,
      },
      count: mappedData.length,
      data: mappedData,
    };

    await logApiAccess({
      clientId: auth.client.id,
      tokenId: auth.token.id,
      method: "POST",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 200,
      isSuccess: true,
      requestQuery,
      responseBody: {
        success: true,
        count: mappedData.length,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("INTEGRATION_EMPLOYEES_POST_API_ERROR:", error);

    await logApiAccess({
      clientId: auth.client?.id || null,
      tokenId: auth.token?.id || null,
      method: "POST",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 500,
      isSuccess: false,
      requestQuery,
      errorMessage: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}