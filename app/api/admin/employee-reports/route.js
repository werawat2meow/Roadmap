import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
<<<<<<< HEAD

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    )
=======
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const EMPLOYEE_REPORT_SELECT = `
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

        status,

        hire_date,
        start_work_date,
        resignation_date,

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
          type_name,
          probation_required,
          probation_days
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
        )`;

function getCurrentEmployeeId(guard) {
  const access = guard?.access || {};

  return (
    access?.employee_id ||
    access?.user?.employee_id ||
    access?.user_account?.employee_id ||
    guard?.user?.employee_id ||
    null
  );
}

function applyReportFilters(
  query,
  {
    search = "",
    status = "",
    branchId = "",
    departmentId = "",
    divisionId = "",
    unitId = "",
    positionId = "",
  } = {}
) {
  if (search) {
    query = query.or(
      [
        `employee_code.ilike.%${search}%`,
        `first_name_th.ilike.%${search}%`,
        `last_name_th.ilike.%${search}%`,
        `first_name_en.ilike.%${search}%`,
        `last_name_en.ilike.%${search}%`,
        `nick_name.ilike.%${search}%`,
        `phone.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `citizen_id.ilike.%${search}%`,
        `passport_no.ilike.%${search}%`,
        `nationality.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (status && status !== "ALL") {
    query = query.eq(
      "employee_statuses.status_code",
      status
    );
  }

  if (branchId) {
    query = query.eq(
      "branches.branch_name",
      branchId
    );
  }

  if (departmentId) {
    query = query.eq(
      "departments.department_name",
      departmentId
    );
  }

  if (divisionId) {
    query = query.eq(
      "divisions.division_name",
      divisionId
    );
  }

  if (unitId) {
    query = query.eq(
      "units.unit_name",
      unitId
    );
  }

  if (positionId) {
    query = query.eq(
      "position_id",
      positionId
    );
  }

  return query;
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_reports",
      "view",
      {
        lineageScope: true,
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } = new URL(req.url);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),1)
>>>>>>> test_merge_all
      .toISOString()
      .split("T")[0];

    const yearStart = `${currentYear}-01-01`;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const branchId = searchParams.get("branch_id")?.trim() || "";
    const departmentId = searchParams.get("department_id")?.trim() || "";
    const divisionId = searchParams.get("division_id")?.trim() || "";
    const unitId = searchParams.get("unit_id")?.trim() || "";
    const positionId = searchParams.get("position_id")?.trim() || "";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 20), 1),
      100
    );

<<<<<<< HEAD
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
=======
    const currentEmployeeId =
      getCurrentEmployeeId(guard);

    const filters = {
      search,
      status,
      branchId,
      departmentId,
      divisionId,
      unitId,
      positionId,
    };

    /* =====================================================
       SELF
       -----------------------------------------------------
       Self View bypass เฉพาะการ "ดูรายงาน"
       แต่ยังต้องผ่าน Search / Filter ที่ User เลือก
    ===================================================== */

    let selfEmployee = null;

    if (currentEmployeeId) {
      let selfQuery = supabaseAdmin
        .from("employees")
        .select(EMPLOYEE_REPORT_SELECT)
        .eq("id", currentEmployeeId);

      selfQuery = applyReportFilters(
        selfQuery,
        filters
      );

      const {
        data: selfData,
        error: selfError,
      } = await selfQuery.maybeSingle();

      if (selfError) {
        throw selfError;
      }

      selfEmployee =
        selfData || null;
    }

    const selfCount =
      selfEmployee ? 1 : 0;

    /* =====================================================
       SCOPE
       -----------------------------------------------------
       ดึงคนอื่นตาม Scope ของ Permission:
       ems.employee_reports.view

       ตัด Current Employee ออกจาก Scoped Query ก่อน
       เพื่อไม่ให้ข้อมูลตัวเองซ้ำ
    ===================================================== */
>>>>>>> test_merge_all

    let query = supabaseAdmin
      .from("employees")
      .select(
<<<<<<< HEAD
        `
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

        citizen_id,
        passport_no,

        birth_date,

        line_id,

        nationality,

        hire_date,
        resignation_date,

        employment_type,

        employee_type_digit,
        employee_year_2d,
        employee_running_no,

        employee_photo_url,

        employee_status_id,

        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,

        created_at,

        branches (
          id,
          branch_code,
          branch_name
        ),

        departments (
          id,
          department_code,
          department_name
        ),

        divisions (
          id,
          division_code,
          division_name
        ),

        units (
          id,
          unit_code,
          unit_name
        ),

        positions (
          id,
          position_code,
          position_name,
          position_level,
          position_group
        ),

        employee_statuses!inner (
          id,
          status_code,
          status_name,
          color
        )
      `,
        { count: "exact" }
      )
      .order("employee_code", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        [
          `employee_code.ilike.%${search}%`,
          `first_name_th.ilike.%${search}%`,
          `last_name_th.ilike.%${search}%`,
          `first_name_en.ilike.%${search}%`,
          `last_name_en.ilike.%${search}%`,
          `nick_name.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `citizen_id.ilike.%${search}%`,
          `passport_no.ilike.%${search}%`,
          `nationality.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (status && status !== "ALL") {
      query = query.eq("employee_statuses.status_code", status);
    }

    if (branchId) {
      query = query.eq("branches.branch_name", branchId);
    }

    if (departmentId) {
      query = query.eq("departments.department_name", departmentId);
    }

    if (divisionId) {
      query = query.eq("divisions.division_name", divisionId);
    }

    if (unitId) {
      query = query.eq("units.unit_name", unitId);
    }

    if (positionId) {
      query = query.eq("position_id", positionId);
    }

    const { data: employees, error, count } = await query;
=======
        EMPLOYEE_REPORT_SELECT,
        {
          count: "exact",
        }
      );

    query =
      guard.applyEmployeeScope(query);

    if (currentEmployeeId) {
      query = query.neq(
        "id",
        currentEmployeeId
      );
    }

    query = applyReportFilters(
      query,
      filters
    );

    /*
     * Combined pagination:
     *
     * page 1:
     *   SELF + scoped rows
     *
     * page 2+:
     *   ชดเชย offset ของ SELF 1 รายการ
     *
     * ทำให้ไม่มี record หาย/ซ้ำระหว่างหน้า
     */
    const combinedFrom =
      (page - 1) * pageSize;

    const combinedTo =
      combinedFrom + pageSize - 1;

    const scopedFrom =
      Math.max(
        combinedFrom - selfCount,
        0
      );

    const scopedTo =
      combinedTo - selfCount;

    if (scopedTo >= scopedFrom) {
      query = query
        .order(
          "employee_code",
          {
            ascending: true,
          }
        )
        .range(
          scopedFrom,
          scopedTo
        );
    } else {
      /*
       * กรณี pageSize = 1 และหน้าแรกมี SELF
       * ไม่ต้องโหลด Scoped row
       */
      query = query
        .order(
          "employee_code",
          {
            ascending: true,
          }
        )
        .range(0, 0)
        .eq(
          "id",
          "00000000-0000-0000-0000-000000000000"
        );
    }

    const {
      data: scopedEmployees,
      error,
      count: scopedCountRaw,
    } = await query;
>>>>>>> test_merge_all

    if (error) {
      throw error;
    }

<<<<<<< HEAD
=======
    const scopedEmployeesSafe =
      Array.isArray(scopedEmployees)
        ? scopedEmployees
        : [];

    const employees =
      page === 1 && selfEmployee
        ? [
            selfEmployee,
            ...scopedEmployeesSafe,
          ]
        : scopedEmployeesSafe;

    const count =
      Number(scopedCountRaw || 0) +
      selfCount;

>>>>>>> test_merge_all
    const rows = employees || [];

    const organizationSummary = {
      branches: {},
      departments: {},
      divisions: {},
      units: {},
      positionLevels: {},
      employmentTypes: {},
      genders: {},
      nationalities: {},
    };

    rows.forEach((item) => {
      const branch = item.branches?.branch_name || "Unknown";
      const department = item.departments?.department_name || "Unknown";
      const division = item.divisions?.division_name || "Unknown";
      const unit = item.units?.unit_name || "Unknown";
<<<<<<< HEAD
      const level = item.positions?.position_level || "N/A";
      const employmentType = item.employment_type || "Unknown";
      const gender = item.gender || "Unknown";
      const nationality = item.nationality || "Unknown";
=======
      const level = item.position_levels?.level_code || "N/A";
      const gender =
        item.genders
          ?.gender_name_th ||
        item.genders
          ?.gender_name_en ||
        "Unknown";
      const employmentType = item.employment_types ?.type_name || "Unknown";

      const nationality =
        item.nationalities
          ?.nationality_name_th ||
        item.nationalities
          ?.nationality_name_en ||
        "Unknown";
>>>>>>> test_merge_all

      organizationSummary.branches[branch] =
        (organizationSummary.branches[branch] || 0) + 1;

      organizationSummary.departments[department] =
        (organizationSummary.departments[department] || 0) + 1;

      organizationSummary.divisions[division] =
        (organizationSummary.divisions[division] || 0) + 1;

      organizationSummary.units[unit] =
        (organizationSummary.units[unit] || 0) + 1;

      organizationSummary.positionLevels[level] =
        (organizationSummary.positionLevels[level] || 0) + 1;

      organizationSummary.employmentTypes[employmentType] =
        (organizationSummary.employmentTypes[employmentType] || 0) + 1;

      organizationSummary.genders[gender] =
        (organizationSummary.genders[gender] || 0) + 1;

      organizationSummary.nationalities[nationality] =
        (organizationSummary.nationalities[nationality] || 0) + 1;
    });

    const totalEmployees = count || 0;

    const activeEmployees = rows.filter(
      (item) => item.employee_statuses?.status_code === "ACTIVE"
    ).length;

    const probationEmployees = rows.filter(
      (item) => item.employee_statuses?.status_code === "PROBATION"
    ).length;

    const resignedEmployees = rows.filter(
      (item) => item.employee_statuses?.status_code === "RESIGNED"
    ).length;

    const retiredEmployees = rows.filter(
      (item) => item.employee_statuses?.status_code === "RETIRED"
    ).length;

    const suspendedEmployees = rows.filter(
      (item) => item.employee_statuses?.status_code === "SUSPENDED"
    ).length;

    const newThisMonth = rows.filter(
      (item) => item.hire_date && item.hire_date >= monthStart
    ).length;

    const resignedThisMonth = rows.filter(
      (item) => item.resignation_date && item.resignation_date >= monthStart
    ).length;

    const newThisYear = rows.filter(
      (item) => item.hire_date && item.hire_date >= yearStart
    ).length;

    const resignedThisYear = rows.filter(
      (item) => item.resignation_date && item.resignation_date >= yearStart
    ).length;

    const turnoverRate =
      totalEmployees > 0
        ? Number(((resignedThisYear / totalEmployees) * 100).toFixed(2))
        : 0;

    const calculateServiceYears = (hireDate) => {
      if (!hireDate) return 0;

      const start = new Date(hireDate);
      const now = new Date();

      return Number(
        ((now - start) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
      );
    };

<<<<<<< HEAD
    const mappedEmployees = rows.map((employee) => ({
      id: employee.id,

      employee_code: employee.employee_code || "",
      first_name_th: employee.first_name_th || "",
      last_name_th: employee.last_name_th || "",
      first_name_en: employee.first_name_en || "",
      last_name_en: employee.last_name_en || "",
      full_name_th: `${employee.first_name_th || ""} ${
        employee.last_name_th || ""
      }`.trim(),
      full_name_en: `${employee.first_name_en || ""} ${
        employee.last_name_en || ""
      }`.trim(),

      nick_name: employee.nick_name || "",
      gender: employee.gender || "",
      phone: employee.phone || "",
      email: employee.email || "",

      citizen_id: employee.citizen_id || "",
      passport_no: employee.passport_no || "",
      birth_date: employee.birth_date || "",
      line_id: employee.line_id || "",
      nationality: employee.nationality || "",

      hire_date: employee.hire_date || "",
      resignation_date: employee.resignation_date || "",

      employment_type: employee.employment_type || "",
      employee_type_digit: employee.employee_type_digit || "",
      employee_year_2d: employee.employee_year_2d || "",
      employee_running_no: employee.employee_running_no || "",
      employee_photo_url: employee.employee_photo_url || "",

      employee_status_id: employee.employee_status_id || "",
      employee_status_code: employee.employee_statuses?.status_code || "",
      employee_status_name: employee.employee_statuses?.status_name || "-",
      employee_status_color: employee.employee_statuses?.color || "slate",

      branch_id: employee.branch_id || "",
      branch_code: employee.branches?.branch_code || "",
      branch_name: employee.branches?.branch_name || "-",

      department_id: employee.department_id || "",
      department_code: employee.departments?.department_code || "",
      department_name: employee.departments?.department_name || "-",

      division_id: employee.division_id || "",
      division_code: employee.divisions?.division_code || "",
      division_name: employee.divisions?.division_name || "-",

      unit_id: employee.unit_id || "",
      unit_code: employee.units?.unit_code || "",
      unit_name: employee.units?.unit_name || "-",

      position_id: employee.position_id || "",
      position_code: employee.positions?.position_code || "",
      position_name: employee.positions?.position_name || "-",
      position_level: employee.positions?.position_level || "",
      position_group: employee.positions?.position_group || "",

      created_at: employee.created_at,
      service_years: calculateServiceYears(employee.hire_date),
    }));
=======
    const mappedEmployees =
    (employees || []).map(
    (employee) => ({
      id:
        employee.id,

      employee_code:
        employee.employee_code,

      full_name_th:
        [
          employee.first_name_th,
          employee.middle_name_th,
          employee.last_name_th,
        ]
          .filter(Boolean)
          .join(" "),

      /* =========================
         Organization
      ========================= */

      company_id:
        employee.company_id || "",

      company_code:
        employee.companies
          ?.company_code || "",

      company_name:
        employee.companies
          ?.company_name_th ||
        employee.companies
          ?.company_name_en ||
        "-",

      branch_group_id:
        employee.branch_group_id ||
        "",

      branch_group_code:
        employee.branch_groups
          ?.group_code || "",

      branch_group_name:
        employee.branch_groups
          ?.group_name || "-",

      branch_id:
        employee.branch_id || "",

      branch_code:
        employee.branches
          ?.branch_code || "",

      branch_name:
        employee.branches
          ?.branch_name || "-",

      department_id:
        employee.department_id ||
        "",

      department_code:
        employee.departments
          ?.department_code || "",

      department_name:
        employee.departments
          ?.department_name || "-",

      division_id:
        employee.division_id || "",

      division_code:
        employee.divisions
          ?.division_code || "",

      division_name:
        employee.divisions
          ?.division_name || "-",

      unit_id:
        employee.unit_id || "",

      unit_code:
        employee.units
          ?.unit_code || "",

      unit_name:
        employee.units
          ?.unit_name || "-",

      /* =========================
         Employment Type
      ========================= */

      employment_type_id:
        employee.employment_type_id ||
        "",

      employment_type_code:
        employee.employment_types
          ?.type_code || "",

      employment_type_name:
        employee.employment_types
          ?.type_name || "-",

      // รองรับ Frontend เดิม
      employment_type:
        employee.employment_types
          ?.type_name || "-",

      /* =========================
        Gender
      ========================= */

      gender_id:
        employee.gender_id || "",

      gender_code:
        employee.genders
          ?.gender_code || "",

      gender_name:
        employee.genders
          ?.gender_name_th ||
        employee.genders
          ?.gender_name_en ||
        "-",

      // รองรับ Frontend เดิมที่อ่าน item.gender
      gender:
        employee.genders
          ?.gender_name_th ||
        employee.genders
          ?.gender_name_en ||
        "-",
        
      /* =========================
         Nationality
      ========================= */

      nationality_id:
        employee.nationality_id ||
        "",

      nationality_code:
        employee.nationalities
          ?.nationality_code || "",

      nationality_name:
        employee.nationalities
          ?.nationality_name_th ||
        employee.nationalities
          ?.nationality_name_en ||
        "-",
      
      nationality:
        employee.nationalities
          ?.nationality_name_th ||
        employee.nationalities
          ?.nationality_name_en ||
        "-",

      /* =========================
         Position Family
      ========================= */

      position_family_id:
        employee.position_family_id ||
        "",

      position_family_code:
        employee.position_families
          ?.family_code || "",

      position_family_name:
        employee.position_families
          ?.family_name || "-",

      /* =========================
         Position Level
      ========================= */

      position_level_id:
        employee.position_level_id ||
        "",

      position_level:
        employee.position_levels
          ?.level_code || "",

      position_level_name:
        employee.position_levels
          ?.level_name || "-",

      /* =========================
         Position
      ========================= */

      position_id:
        employee.position_id || "",

      position_code:
        employee.positions
          ?.position_code || "",

      position_name:
        employee.positions
          ?.position_name || "-",

      /* =========================
         Status
      ========================= */

      employee_status_id:
        employee.employee_status_id ||
        "",

      employee_status_code:
        employee.employee_statuses
          ?.status_code || "",

      employee_status_name:
        employee.employee_statuses
          ?.status_name || "-",

      employee_status_color:
        employee.employee_statuses
          ?.color || "slate",

      status:
        employee.status,

      hire_date:
        employee.start_work_date ||
        employee.hire_date ||
        null,

      start_work_date:
        employee.start_work_date ||
        employee.hire_date ||
        null,

      resignation_date:
        employee.resignation_date ||
        null,
    })
  );
>>>>>>> test_merge_all

    if (search || status || branchId || departmentId || divisionId || unitId ) {
      await writeActivityLog({
        module_name: "employee_reports",
        action_type: "search",
        reference_table: "employees",
        description: "ค้นหารายงานพนักงาน",
        new_data: {
          search,
          status,
          branch: branchId,
          department: departmentId,
          division: divisionId,
          unit: unitId,
          page,
          pageSize,
          total_records: count || 0,
        },
      });
    }


    return NextResponse.json({
      success: true,

      summary: {
        totalEmployees,
        activeEmployees,
        probationEmployees,
        resignedEmployees,
        retiredEmployees,
        suspendedEmployees,

        newThisMonth,
        resignedThisMonth,

        newThisYear,
        resignedThisYear,

        turnoverRate,
      },

      organizationSummary,

      employees: mappedEmployees,
      data: mappedEmployees,

      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
<<<<<<< HEAD
=======

      meta: {
        access: {
          currentEmployeeId:
            currentEmployeeId || null,
          selfIncluded:
            Boolean(selfEmployee),
          rule:
            "SELF_PLUS_SCOPE",
          permission:
            "ems.employee_reports.view",
        },
      },
>>>>>>> test_merge_all
    });
  } catch (error) {
    console.error("EMPLOYEE_REPORTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "โหลดรายงานพนักงานไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}