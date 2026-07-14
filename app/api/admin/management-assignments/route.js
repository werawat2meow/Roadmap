import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const SELECT_FIELDS = `
  id,
  employee_id,
  management_level,
  scope_type,

  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,

  supervisor_employee_id,

  is_primary,
  status,
  sort_order,

  created_at,
  updated_at,

  employees!management_assignments_employee_id_fkey (
    id,
    employee_code,

    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,

    employee_photo_url,

    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,

    position_id,
    job_id,

    positions (
      id,
      position_code,
      position_name,
      position_level
    ),

    jobs (
      id,
      job_code,
      job_name,
      job_level,
      management_level,
      scope_type,
      can_manage_employees,
      can_approve_budget
    )
  ),

  supervisor:employees!management_assignments_supervisor_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    employee_photo_url,

    positions (
      position_name,
      position_level
    ),

    jobs (
      job_name,
      management_level
    )
  ),

  companies (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),

  branch_groups (
    id,
    group_code,
    group_name,
    group_color
  ),

  branches (
    id,
    branch_code,
    branch_name
  ),

  departments (
    id,
    department_code,
    department_name,
    department_color
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
  )
`;

const mapAssignment = (item) => {
  const employee = item.employees || {};
  const position = employee.positions || {};
  const job = employee.jobs || {};

  const supervisor = item.supervisor || {};
  const supervisorPosition =
    supervisor.positions || {};
  const supervisorJob =
    supervisor.jobs || {};

  const resolvedManagementLevel =
    job.management_level ||
    position.position_level ||
    item.management_level ||
    "";

  const resolvedScopeType =
    item.scope_type ||
    job.scope_type ||
    "";

  return {
    id: item.id,

    employee_id: item.employee_id || "",
    employee_code:
      employee.employee_code || "",

    employee_name:
      `${employee.first_name_th || ""} ${
        employee.last_name_th || ""
      }`.trim() ||
      `${employee.first_name_en || ""} ${
        employee.last_name_en || ""
      }`.trim() ||
      "-",

    employee_photo_url:
      employee.employee_photo_url || "",

    position_id:
      employee.position_id || "",

    position_code:
      position.position_code || "",

    position_name:
      position.position_name || "-",

    position_level:
      position.position_level || "",

    job_id:
      employee.job_id || "",

    job_code:
      job.job_code || "",

    job_name:
      job.job_name || "-",

    job_level:
      job.job_level || "",

    job_management_level:
      job.management_level || "",

    job_scope_type:
      job.scope_type || "",

    can_manage_employees:
      job.can_manage_employees ?? false,

    can_approve_budget:
      job.can_approve_budget ?? false,

    management_level:
      resolvedManagementLevel,

    scope_type:
      resolvedScopeType,

    company_id:
      item.company_id || "",

    company_name:
      item.companies?.company_name_th ||
      item.companies?.company_name_en ||
      "",

    branch_group_id:
      item.branch_group_id ||
      employee.branch_group_id ||
      "",

    branch_group_name:
      item.branch_groups?.group_name || "",

    branch_group_color:
      item.branch_groups?.group_color ||
      "#E2E8F0",

    branch_id:
      item.branch_id ||
      employee.branch_id ||
      "",

    branch_name:
      item.branches?.branch_name || "",

    department_id:
      item.department_id ||
      employee.department_id ||
      "",

    department_name:
      item.departments?.department_name || "",

    department_color:
      item.departments?.department_color ||
      "#E2E8F0",

    division_id:
      item.division_id ||
      employee.division_id ||
      "",

    division_name:
      item.divisions?.division_name || "",

    unit_id:
      item.unit_id ||
      employee.unit_id ||
      "",

    unit_name:
      item.units?.unit_name || "",

    supervisor_employee_id:
      item.supervisor_employee_id || "",

    supervisor_code:
      supervisor.employee_code || "",

    supervisor_name:
      `${supervisor.first_name_th || ""} ${
        supervisor.last_name_th || ""
      }`.trim() ||
      `${supervisor.first_name_en || ""} ${
        supervisor.last_name_en || ""
      }`.trim() ||
      "",

    supervisor_photo_url:
      supervisor.employee_photo_url || "",

    supervisor_position_name:
      supervisorPosition.position_name || "",

    supervisor_management_level:
      supervisorJob.management_level ||
      supervisorPosition.position_level ||
      "",

    is_primary:
      item.is_primary ?? true,

    status:
      item.status || "active",

    sort_order:
      Number(item.sort_order || 0),

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const management_level = searchParams.get("management_level")?.trim() || "";
    const scope_type = searchParams.get("scope_type")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const tree = searchParams.get("tree") === "true";

    let query = supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (management_level) query = query.eq("management_level", management_level);
    if (scope_type) query = query.eq("scope_type", scope_type);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) throw error;

    let mappedData = (data || []).map(mapAssignment);
    mappedData = mappedData.filter(
      (item) =>
        ["P9", "P10", "P11", "P12"].includes(
          item.management_level
        )
    );

    if (search) {
      mappedData = mappedData.filter((item) =>
        [
          item.employee_code,
          item.employee_name,

          item.position_name,

          item.job_code,
          item.job_name,

          item.management_level,
          item.scope_type,

          item.company_name,
          item.branch_group_name,
          item.branch_name,
          item.department_name,
          item.division_name,
          item.unit_name,

          item.supervisor_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(search)
          )
      );
    }

    if (tree) {
      const orgChartData = mappedData.map(
        (item) => ({
          id: item.employee_id,

          parentId:
            item.supervisor_employee_id || null,

          assignment_id:
            item.id,

          employee_id:
            item.employee_id,

          employee_code:
            item.employee_code,

          name:
            item.employee_name,

          employee_photo_url:
            item.employee_photo_url,

          position_name:
            item.position_name,

          job_name:
            item.job_name,

          management_level:
            item.management_level,

          scope_type:
            item.scope_type,

          company_id:
            item.company_id,

          company_name:
            item.company_name,

          branch_group_id:
            item.branch_group_id,

          branch_group_name:
            item.branch_group_name,

          branch_group_color:
            item.branch_group_color,

          branch_id:
            item.branch_id,

          branch_name:
            item.branch_name,

          department_id:
            item.department_id,

          department_name:
            item.department_name,

          department_color:
            item.department_color,

          supervisor_employee_id:
            item.supervisor_employee_id,

          supervisor_name:
            item.supervisor_name,

          status:
            item.status,

          sort_order:
            item.sort_order,
        })
      );

      return NextResponse.json({
        success: true,
        data: mappedData,
        tree: orgChartData,
      });
    }

    return NextResponse.json({
      success: true,
      data: mappedData,
    });
  } catch (error) {
    console.error("GET_MANAGEMENT_ASSIGNMENTS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถดึงข้อมูลสายบังคับบัญชาได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const employee_id = body?.employee_id || null;
    const management_level = body?.management_level?.trim();
    const scope_type = body?.scope_type?.trim();

    const payload = {
      employee_id,
      management_level,
      scope_type,
      company_id: body?.company_id || null,
      branch_group_id: body?.branch_group_id || null,
      branch_id: body?.branch_id || null,
      department_id: body?.department_id || null,
      division_id: body?.division_id || null,
      unit_id: body?.unit_id || null,
      supervisor_employee_id: body?.supervisor_employee_id || null,
      is_primary: body?.is_primary ?? true,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
    };

    if (!employee_id) {
      return NextResponse.json({ error: "กรุณาเลือกพนักงาน" }, { status: 400 });
    }

    if (!management_level) {
      return NextResponse.json({ error: "กรุณาเลือกระดับผู้บริหาร" }, { status: 400 });
    }

    if (!scope_type) {
      return NextResponse.json({ error: "กรุณาเลือกขอบเขตการดูแล" }, { status: 400 });
    }

    if (scope_type === "company" && !payload.company_id) {
      return NextResponse.json({ error: "กรุณาเลือกบริษัท" }, { status: 400 });
    }

    if (scope_type === "branch_group" && !payload.branch_group_id) {
      return NextResponse.json({ error: "กรุณาเลือกกรุ๊ปสังกัด" }, { status: 400 });
    }

    if (scope_type === "branch" && !payload.branch_id) {
      return NextResponse.json({ error: "กรุณาเลือกสังกัด" }, { status: 400 });
    }

    if (scope_type === "department" && !payload.department_id) {
      return NextResponse.json({ error: "กรุณาเลือกแผนก" }, { status: 400 });
    }

    if (scope_type === "division" && !payload.division_id) {
      return NextResponse.json({ error: "กรุณาเลือกฝ่าย" }, { status: 400 });
    }

    if (scope_type === "unit" && !payload.unit_id) {
      return NextResponse.json({ error: "กรุณาเลือกหน่วยงาน" }, { status: 400 });
    }

    if (management_level === "P12" && scope_type !== "all") {
      return NextResponse.json(
        { error: "P12 ควรใช้ขอบเขต all เพื่อดูแลภาพรวมทั้งหมด" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("management_assignments")
      .insert([payload])
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    const mapped = mapAssignment(data);

    await writeActivityLog({
      module_name: "management_assignments",
      action_type: "create",
      reference_table: "management_assignments",
      reference_id: data.id,
      description: `เพิ่มสายบังคับบัญชา ${mapped.employee_name} (${mapped.management_level})`,
      new_data: mapped,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มสายบังคับบัญชาสำเร็จ",
      data: mapped,
    });
  } catch (error) {
    console.error("CREATE_MANAGEMENT_ASSIGNMENT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถบันทึกสายบังคับบัญชาได้" },
      { status: 500 }
    );
  }
}