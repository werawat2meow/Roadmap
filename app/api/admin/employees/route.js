import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

function getEmployeeTypeDigit({ nationality, employmentType, positionLevel }) {
  const level = String(positionLevel || "").toUpperCase();

  if (["P9", "P10", "P11", "P12"].includes(level)) {
    return "9";
  }

  if (employmentType === "part_time" || employmentType === "intern") {
    return "4";
  }

  if (nationality === "thai") {
    return "1";
  }

  if (nationality === "non_b") {
    return "2";
  }

  if (nationality === "myanmar") {
    return "3";
  }

  return "5";
}

function getYear2Digits(dateStr) {
  const year = new Date(dateStr).getFullYear();
  return String(year).slice(-2);
}

function padRunning(no) {
  return String(no).padStart(5, "0");
}


function calculateProbationEndDate(hireDate, days) {
  if (!hireDate || !days) return null;

  const date = new Date(hireDate);
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

/* =========================
   helper: escape ilike keyword
========================= */
function escapeLike(value = "") {
  return value.replace(/[%_,]/g, "\\$&");
}

/* =========================
   helper: map employee row
========================= */
function mapEmployee(item) {
  return {
    id: item.id,
    employee_code: item.employee_code,
    first_name_th: item.first_name_th,
    last_name_th: item.last_name_th,
    first_name_en: item.first_name_en || "",
    last_name_en: item.last_name_en || "",
    full_name_th: `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim(),
    full_name_en: `${item.first_name_en || ""} ${item.last_name_en || ""}`.trim(),
    nick_name: item.nick_name || "",
    gender: item.gender || "",
    phone: item.phone || "",
    email: item.email || "",
    citizen_id: item.citizen_id || "",
    passport_no: item.passport_no || "",
    birth_date: item.birth_date || "",
    line_id: item.line_id || "",
    employee_photo_url: item.employee_photo_url || "",
    nationality: item.nationality || "",
    hire_date: item.hire_date || "",
    employment_type: item.employment_type || "",
    status: item.status,
    employee_status_id: item.employee_status_id || "",
    resignation_date: item.resignation_date || "",
    employee_status_name: item.employee_statuses?.status_name || "-",
    employee_status_color: item.employee_statuses?.color || "slate",
    branch_id: item.branch_id || "",
    department_id: item.department_id || "",
    division_id: item.division_id || "",
    unit_id: item.unit_id || "",
    position_id: item.position_id || "",
    branch_name: item.branches?.branch_name || "-",
    department_name: item.departments?.department_name || "-",
    division_name: item.divisions?.division_name || "-",
    unit_name: item.units?.unit_name || "-",
    position_name: item.positions?.position_name || "-",
    position_level: item.positions?.position_level || "",
    branch_group_id: item.branch_group_id || "",
    job_id: item.job_id || "",
    management_assignment_id: item.management_assignment_id || "",
    created_at: item.created_at,
    probation_days: item.probation_days ?? null,
    probation_end_date: item.probation_end_date || "",
    probation_status: item.probation_status || "",
    business_unit_id: item.business_unit_id || "",
    cost_center_id: item.cost_center_id || "",
    profit_center_id: item.profit_center_id || "",
    business_unit_code: item.business_units?.business_unit_code || "",
    business_unit_name: item.business_units?.business_unit_name || "-",
    cost_center_code: item.cost_centers?.cost_center_code || "",
    cost_center_name: item.cost_centers?.cost_center_name || "-",
    profit_center_code: item.profit_centers?.profit_center_code || "",
    profit_center_name: item.profit_centers?.profit_center_name || "-",
  };
}

/* =========================
   helper: search in joined master tables
========================= */
async function searchRelatedIds(search) {
  const keyword = `%${escapeLike(search)}%`;

  const [
    branchesRes,
    departmentsRes,
    divisionsRes,
    unitsRes,
    positionsRes,
    employeeStatusesRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("branches")
      .select("id")
      .ilike("branch_name", keyword),

    supabaseAdmin
      .from("departments")
      .select("id")
      .ilike("department_name", keyword),

    supabaseAdmin
      .from("divisions")
      .select("id")
      .ilike("division_name", keyword),

    supabaseAdmin
      .from("units")
      .select("id")
      .ilike("unit_name", keyword),

    supabaseAdmin
      .from("positions")
      .select("id")
      .ilike("position_name", keyword),

    supabaseAdmin
      .from("employee_statuses")
      .select("id")
      .ilike("status_name", keyword),
  ]);

  const responses = [
    branchesRes,
    departmentsRes,
    divisionsRes,
    unitsRes,
    positionsRes,
    employeeStatusesRes,
  ];

  for (const res of responses) {
    if (res.error) throw res.error;
  }

  return {
    branchIds: (branchesRes.data || []).map((item) => item.id),
    departmentIds: (departmentsRes.data || []).map((item) => item.id),
    divisionIds: (divisionsRes.data || []).map((item) => item.id),
    unitIds: (unitsRes.data || []).map((item) => item.id),
    positionIds: (positionsRes.data || []).map((item) => item.id),
    employeeStatusIds: (employeeStatusesRes.data || []).map((item) => item.id),
  };
}

/* =========================
   GET: list employees
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("employees")
      .select(
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
        employee_photo_url,
        nationality,
        hire_date,
        employment_type,
        probation_days,
        probation_end_date,
        probation_status,
        status,
        employee_status_id,
        resignation_date,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        branch_group_id,
        job_id,
        management_assignment_id,
        business_unit_id,
        cost_center_id,
        profit_center_id,
        created_at,
        citizen_id,
        passport_no,
        birth_date,
        line_id,
        branch_groups (
          group_code,
          group_name,
          group_color
        ),
        jobs (
          job_code,
          job_name,
          job_level,
          management_level,
          scope_type,
          job_color,
          job_icon,
          can_manage_employees,
          can_approve_budget
        ),
        employee_statuses (
          status_name,
          color
        ),
        branches (
          branch_name
        ),
        departments (
          department_name
        ),
        divisions (
          division_name
        ),
        units (
          unit_name
        ),
        positions (
          position_name,
          position_level
        ),
        business_units (
          business_unit_code,
          business_unit_name
        ),
        cost_centers (
          cost_center_code,
          cost_center_name
        ),
        profit_centers (
          profit_center_code,
          profit_center_name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search) {
      const safeSearch = escapeLike(search);
      const searchParts = search.split(/\s+/).filter(Boolean);

      const orConditions = [
        `employee_code.ilike.%${safeSearch}%`,
        `first_name_th.ilike.%${safeSearch}%`,
        `last_name_th.ilike.%${safeSearch}%`,
        `first_name_en.ilike.%${safeSearch}%`,
        `last_name_en.ilike.%${safeSearch}%`,
        `nick_name.ilike.%${safeSearch}%`,
        `phone.ilike.%${safeSearch}%`,
        `email.ilike.%${safeSearch}%`,
        `citizen_id.ilike.%${safeSearch}%`,
        `passport_no.ilike.%${safeSearch}%`,
        `line_id.ilike.%${safeSearch}%`,
      ];

      if (searchParts.length >= 2) {
        const firstPart = escapeLike(searchParts[0]);
        const lastPart = escapeLike(searchParts.slice(1).join(" "));

        orConditions.push(
          `and(first_name_th.ilike.%${firstPart}%,last_name_th.ilike.%${lastPart}%)`,
          `and(first_name_en.ilike.%${firstPart}%,last_name_en.ilike.%${lastPart}%)`,
          `and(first_name_th.ilike.%${lastPart}%,last_name_th.ilike.%${firstPart}%)`,
          `and(first_name_en.ilike.%${lastPart}%,last_name_en.ilike.%${firstPart}%)`
        );
      }

      const {
        branchIds,
        departmentIds,
        divisionIds,
        unitIds,
        positionIds,
        employeeStatusIds,
      } = await searchRelatedIds(search);

      if (branchIds.length > 0) {
        orConditions.push(`branch_id.in.(${branchIds.join(",")})`);
      }

      if (departmentIds.length > 0) {
        orConditions.push(`department_id.in.(${departmentIds.join(",")})`);
      }

      if (divisionIds.length > 0) {
        orConditions.push(`division_id.in.(${divisionIds.join(",")})`);
      }

      if (unitIds.length > 0) {
        orConditions.push(`unit_id.in.(${unitIds.join(",")})`);
      }

      if (positionIds.length > 0) {
        orConditions.push(`position_id.in.(${positionIds.join(",")})`);
      }

      if (employeeStatusIds.length > 0) {
        orConditions.push(`employee_status_id.in.(${employeeStatusIds.join(",")})`);
      }

      query = query.or(orConditions.join(","));
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const mappedData = (data || []).map(mapEmployee);

    return NextResponse.json({
      success: true,
      data: mappedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET_EMPLOYEES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create employee
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const first_name_th = body?.first_name_th?.trim();
    const last_name_th = body?.last_name_th?.trim();
    const first_name_en = body?.first_name_en?.trim() || null;
    const last_name_en = body?.last_name_en?.trim() || null;
    const nick_name = body?.nick_name?.trim() || null;
    const gender = body?.gender || null;
    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;

    const citizen_id = body?.citizen_id?.replace(/\D/g, "")?.trim() || null;
    const passport_no = body?.passport_no?.trim() || null;
    const birth_date = body?.birth_date || null;
    const line_id = body?.line_id?.trim() || null;

    const employee_photo_url = body?.employee_photo_url?.trim() || null;
    const nationality = body?.nationality || null;
    const hire_date = body?.hire_date || null;
    const employment_type = body?.employment_type || null;
    const employee_status_id = body?.employee_status_id || null;
    const resignation_date = body?.resignation_date || null;
    const status = body?.status || "active";

    const branch_group_id = body?.branch_group_id || null;
    const branch_id = body?.branch_id || null;
    const department_id = body?.department_id || null;
    const division_id = body?.division_id || null;
    const unit_id = body?.unit_id || null;
    const position_id = body?.position_id || null;
    const job_id = body?.job_id || null;
    const management_assignment_id = body?.management_assignment_id || null;
    const business_unit_id = body?.business_unit_id || null;
    const cost_center_id = body?.cost_center_id || null;
    const profit_center_id = body?.profit_center_id || null;

    let probation_days = null;
    let probation_end_date = null;
    let probation_status = null;
    let selectedJob = null;


    if (!first_name_th || !last_name_th) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อและนามสกุล" },
        { status: 400 }
      );
    }

    if (!hire_date) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกวันที่เริ่มงาน" },
        { status: 400 }
      );
    }

    if (!position_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกตำแหน่ง" },
        { status: 400 }
      );
    }

    if (!nationality) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสัญชาติ" },
        { status: 400 }
      );
    }

    if (!employee_status_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสถานะพนักงาน" },
        { status: 400 }
      );
    }

    if (citizen_id && citizen_id.length !== 13) {
      return NextResponse.json(
        { success: false, error: "เลขบัตรประชาชนต้องมี 13 หลัก" },
        { status: 400 }
      );
    }


    if (employment_type) {
      const { data: employmentTypeData, error: employmentTypeError } =
        await supabaseAdmin
          .from("employment_types")
          .select(`
            type_code,
            probation_required,
            probation_days,
            auto_confirm_after_probation
          `)
          .eq("type_code", employment_type)
          .maybeSingle();

      if (employmentTypeError) throw employmentTypeError;

      if (employmentTypeData?.probation_required) {
        probation_days = Number(employmentTypeData.probation_days || 0);
        probation_end_date = calculateProbationEndDate(hire_date, probation_days);
        probation_status = "probation";
      } else {
        probation_days = null;
        probation_end_date = null;
        probation_status = "passed";
      }
    }

    const { data: selectedPosition, error: positionError } =
      await supabaseAdmin
        .from("positions")
        .select("id, position_level")
        .eq("id", position_id)
        .single();

    if (positionError) throw positionError;

    if (job_id) {
      const { data: jobData, error: jobError } = await supabaseAdmin
        .from("jobs")
        .select(`
          id,
          business_unit_required,
          cost_center_required,
          profit_center_required,
          gl_mapping_required
        `)
        .eq("id", job_id)
        .maybeSingle();

      if (jobError) throw jobError;

      selectedJob = jobData;

      if (selectedJob?.business_unit_required && !business_unit_id) {
        return NextResponse.json(
          { success: false, error: "กรุณาเลือก Business Unit" },
          { status: 400 }
        );
      }

      if (selectedJob?.cost_center_required && !cost_center_id) {
        return NextResponse.json(
          { success: false, error: "กรุณาเลือก Cost Center" },
          { status: 400 }
        );
      }

      if (selectedJob?.profit_center_required && !profit_center_id) {
        return NextResponse.json(
          { success: false, error: "กรุณาเลือก Profit Center" },
          { status: 400 }
        );
      }
    }

    const employee_type_digit = getEmployeeTypeDigit({
      nationality,
      employmentType: employment_type,
      positionLevel: selectedPosition?.position_level,
    });

    const employee_year_2d = getYear2Digits(hire_date);

    const { data: lastEmployee, error: lastError } = await supabaseAdmin
      .from("employees")
      .select("employee_running_no")
      .eq("employee_type_digit", employee_type_digit)
      .eq("employee_year_2d", employee_year_2d)
      .order("employee_running_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastError) throw lastError;

    const employee_running_no = (lastEmployee?.employee_running_no || 0) + 1;
    const employee_code = `${employee_type_digit}${employee_year_2d}${padRunning(
      employee_running_no
    )}`;

    const payload = {
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
      employee_photo_url,
      nationality,
      hire_date,
      employment_type,
      employee_status_id,
      resignation_date,
      status,

      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      job_id,
      management_assignment_id,
      business_unit_id,
      cost_center_id,
      profit_center_id,
      employee_type_digit,
      employee_year_2d,
      employee_running_no,
      probation_days,
      probation_end_date,
      probation_status,
    };

    const { data, error } = await supabaseAdmin
      .from("employees")
      .insert([payload])
      .select(`
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
        employee_photo_url,
        nationality,
        hire_date,
        employment_type,
        status,
        employee_status_id,
        resignation_date,
        probation_days,
        probation_end_date,
        probation_status,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        job_id,
        management_assignment_id,
        business_unit_id,
        cost_center_id,
        profit_center_id,

        created_at,
        updated_at,

        employee_statuses (
          status_name,
          color
        ),

        branch_groups (
          group_code,
          group_name,
          group_color
        ),

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
          position_level
        ),

        business_units (
          business_unit_code,
          business_unit_name
        ),

        cost_centers (
          cost_center_code,
          cost_center_name
        ),

        profit_centers (
          profit_center_code,
          profit_center_name
        ),

        jobs (
          job_code,
          job_name,
          job_level,
          management_level,
          scope_type,
          job_color,
          job_icon,
          can_manage_employees,
          can_approve_budget
        )
      `)
      .single();

    if (error) throw error;

    const mappedEmployee = mapEmployee(data);

    await writeActivityLog({
      module_name: "employees",
      action_type: "create",
      reference_table: "employees",
      reference_id: data.id,
      description: `เพิ่มพนักงาน ${data.first_name_th} ${data.last_name_th} (${data.employee_code})`,
      new_data: mappedEmployee,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลพนักงานสำเร็จ",
      data: mappedEmployee,
    });
  } catch (error) {
    console.error("CREATE_EMPLOYEE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึกข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}