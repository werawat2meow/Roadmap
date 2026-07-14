import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

function calculateProbationEndDate(hireDate, days) {
  if (!hireDate || !days) return null;

  const date = new Date(hireDate);
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

function mapEmployee(data) {
  return {
    id: data.id,
    employee_code: data.employee_code,
    first_name_th: data.first_name_th,
    last_name_th: data.last_name_th,
    first_name_en: data.first_name_en || "",
    last_name_en: data.last_name_en || "",
    full_name_th: `${data.first_name_th || ""} ${data.last_name_th || ""}`.trim(),
    nick_name: data.nick_name || "",
    gender: data.gender || "",
    phone: data.phone || "",
    email: data.email || "",
    citizen_id: data.citizen_id || "",
    passport_no: data.passport_no || "",
    birth_date: data.birth_date || "",
    line_id: data.line_id || "",
    employee_photo_url: data.employee_photo_url || "",
    nationality: data.nationality || "",
    hire_date: data.hire_date || "",
    employment_type: data.employment_type || "",
    status: data.status,

    employee_status_id: data.employee_status_id || "",
    resignation_date: data.resignation_date || "",
    employee_status_name: data.employee_statuses?.status_name || "-",
    employee_status_color: data.employee_statuses?.color || "slate",

    branch_group_id: data.branch_group_id || "",
    branch_id: data.branch_id || "",
    department_id: data.department_id || "",
    division_id: data.division_id || "",
    unit_id: data.unit_id || "",
    position_id: data.position_id || "",
    job_id: data.job_id || "",
    management_assignment_id: data.management_assignment_id || "",

    branch_group_code: data.branch_groups?.group_code || "",
    branch_group_name: data.branch_groups?.group_name || "-",
    branch_group_color: data.branch_groups?.group_color || "#E2E8F0",

    branch_name: data.branches?.branch_name || "-",
    department_name: data.departments?.department_name || "-",
    division_name: data.divisions?.division_name || "-",
    unit_name: data.units?.unit_name || "-",

    position_name: data.positions?.position_name || "-",
    position_level: data.positions?.position_level || "",

    job_code: data.jobs?.job_code || "",
    job_name: data.jobs?.job_name || "-",
    job_level: data.jobs?.job_level || "",
    management_level: data.jobs?.management_level || "",
    scope_type: data.jobs?.scope_type || "",
    job_color: data.jobs?.job_color || "#E2E8F0",
    job_icon: data.jobs?.job_icon || "",
    can_manage_employees: data.jobs?.can_manage_employees || false,
    can_approve_budget: data.jobs?.can_approve_budget || false,

    probation_days: data.probation_days ?? null,
    probation_end_date: data.probation_end_date || "",
    probation_status: data.probation_status || "",

    created_at: data.created_at,
    updated_at: data.updated_at,
    business_unit_id: data.business_unit_id || "",
    cost_center_id: data.cost_center_id || "",
    profit_center_id: data.profit_center_id || "",
    business_unit_code: data.business_units?.business_unit_code || "",
    business_unit_name: data.business_units?.business_unit_name || "-",
    cost_center_code: data.cost_centers?.cost_center_code || "",
    cost_center_name: data.cost_centers?.cost_center_name || "-",
    profit_center_code: data.profit_centers?.profit_center_code || "",
    profit_center_name: data.profit_centers?.profit_center_name || "-",
    payroll_company_id: data.payroll_company_id || "",
    payroll_type_id: data.payroll_type_id || "",
    payroll_company_code: data.payroll_companies?.payroll_company_code || "",
    payroll_company_name: data.payroll_companies?.payroll_company_name || "-",
    payroll_payment_day:data.payroll_companies?.payment_day === null || data.payroll_companies?.payment_day === undefined ? null : Number(data.payroll_companies.payment_day),
    payroll_company_master_id: data.payroll_companies?.companies?.id || "",
    payroll_company_master_code: data.payroll_companies?.companies?.company_code || "",
    payroll_company_master_name: data.payroll_companies?.companies?.company_name_th || data.payroll_companies?.companies?.company_name_en || "-",
    payroll_company_tax_id: data.payroll_companies?.companies?.tax_id || "",
    payroll_type_code: data.payroll_types?.payroll_type_code || "",
    payroll_type_name: data.payroll_types?.payroll_type_name || "-",
    payment_frequency: data.payroll_types?.payment_frequency || "",
    default_payment_day: data.payroll_types?.default_payment_day === null || data.payroll_types?.default_payment_day === undefined ? null : Number(data.payroll_types.default_payment_day),
  };
}

/* =========================
   PATCH: update employee
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
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
    const payroll_company_id = body?.payroll_company_id || null;
    const payroll_type_id = body?.payroll_type_id || null;

    let probation_days = null;
    let probation_end_date = null;
    let probation_status = null;

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

    if (citizen_id && citizen_id.length !== 13) {
      return NextResponse.json(
        { success: false, error: "เลขบัตรประชาชนต้องมี 13 หลัก" },
        { status: 400 }
      );
    }

    if (!employee_status_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสถานะพนักงาน" },
        { status: 400 }
      );
    }


    if (!payroll_company_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Payroll Company",
        },
        {
          status: 400,
        }
      );
    }

    if (!payroll_type_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Payroll Type",
        },
        {
          status: 400,
        }
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

    if (job_id) {
      const { data: selectedJob, error: jobError } = await supabaseAdmin
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

    const { data: payrollCompany, error: payrollCompanyError,} =
      await supabaseAdmin
        .from("payroll_companies")
        .select(`
          id,
          payroll_type_id,
          payment_day,
          status
        `)
        .eq("id", payroll_company_id)
        .maybeSingle();

    if (payrollCompanyError)
      throw payrollCompanyError;

    if (!payrollCompany) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Payroll Company",
        },
        {
          status: 400,
        }
      );
    }


    const {data: payrollType,error: payrollTypeError,} = await supabaseAdmin
      .from("payroll_types")
      .select(`
        id,
        payment_frequency,
        default_payment_day,
        status
      `)
      .eq("id", payroll_type_id)
      .maybeSingle();

    if (payrollTypeError)
      throw payrollTypeError;

    if (!payrollType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Payroll Type",
        },
        {
          status: 400,
        }
      );
    }

    const { data: oldEmployee, error: oldEmployeeError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (oldEmployeeError) throw oldEmployeeError;

    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
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
        payroll_company_id,
        payroll_type_id,

        probation_days,
        probation_end_date,
        probation_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("employees")
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
        probation_days,
        probation_end_date,
        probation_status,
        status,
        employee_status_id,
        resignation_date,

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
        payroll_company_id,
        payroll_type_id,
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
        payroll_companies (
          id,
          payroll_company_code,
          payroll_company_name,
          payroll_type_id,
          payment_day,

          companies (
            id,
            company_code,
            company_name_th,
            company_name_en,
            tax_id
          )
        ),
        payroll_types (
          id,
          payroll_type_code,
          payroll_type_name,
          payment_frequency,
          default_payment_day,
          status
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    const mappedEmployee = mapEmployee(data);

    await writeActivityLog({
      module_name: "employees",
      action_type: "update",
      reference_table: "employees",
      reference_id: data.id,
      description: `แก้ไขข้อมูลพนักงาน ${data.first_name_th} ${data.last_name_th} (${data.employee_code})`,
      old_data: oldEmployee,
      new_data: mappedEmployee,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลพนักงานสำเร็จ",
      data: mappedEmployee,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดทข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete employee
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldEmployee, error: oldEmployeeError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (oldEmployeeError) throw oldEmployeeError;

    const { error } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "employees",
      action_type: "delete",
      reference_table: "employees",
      reference_id: oldEmployee.id,
      description: `ลบข้อมูลพนักงาน ${oldEmployee.first_name_th} ${oldEmployee.last_name_th} (${oldEmployee.employee_code})`,
      old_data: oldEmployee,
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลพนักงานสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_EMPLOYEE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}