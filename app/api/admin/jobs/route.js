import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const jobSelect = `
  id,
  job_code,
  job_name,
  job_level,
  job_family,
  job_category,
  role_type,
  management_level,
  scope_type,
  accounting_scope,
  cost_center_required,
  profit_center_required,
  business_unit_required,
  gl_mapping_required,
  can_approve_budget,
  can_manage_employees,
  job_color,
  job_icon,
  job_description,
  status,
  sort_order,
  created_at,
  updated_at
`;

function mapJob(job) {
  return {
    id: job.id,
    job_code: job.job_code,
    job_name: job.job_name,
    job_level: job.job_level || "",
    job_family: job.job_family || "",
    job_category: job.job_category || "",
    role_type: job.role_type || "business",
    management_level: job.management_level || "",
    scope_type: job.scope_type || "",
    accounting_scope: job.accounting_scope || "none",
    cost_center_required: !!job.cost_center_required,
    profit_center_required: !!job.profit_center_required,
    business_unit_required: !!job.business_unit_required,
    gl_mapping_required: !!job.gl_mapping_required,
    can_approve_budget: !!job.can_approve_budget,
    can_manage_employees: !!job.can_manage_employees,
    job_color: job.job_color || "#E2E8F0",
    job_icon: job.job_icon || "",
    job_description: job.job_description || "",
    status: job.status || "active",
    sort_order: job.sort_order || 0,
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select(jobSelect)
      .order("sort_order", { ascending: true })
      .order("job_code", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map(mapJob);

    const filteredData = search
      ? mappedData.filter((item) => {
          const keyword = search.toLowerCase();

          return (
            item.job_code?.toLowerCase().includes(keyword) ||
            item.job_name?.toLowerCase().includes(keyword) ||
            item.job_level?.toLowerCase().includes(keyword) ||
            item.job_family?.toLowerCase().includes(keyword) ||
            item.job_category?.toLowerCase().includes(keyword) ||
            item.role_type?.toLowerCase().includes(keyword) ||
            item.management_level?.toLowerCase().includes(keyword) ||
            item.scope_type?.toLowerCase().includes(keyword) ||
            item.accounting_scope?.toLowerCase().includes(keyword) ||
            item.job_description?.toLowerCase().includes(keyword)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_JOBS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลด Job ได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const job_code = body?.job_code?.trim()?.toUpperCase();
    const job_name = body?.job_name?.trim();
    const job_level = body?.job_level?.trim() || null;
    const job_family = body?.job_family?.trim() || null;
    const job_category = body?.job_category?.trim() || null;
    const role_type = body?.role_type?.trim() || "business";
    const management_level = body?.management_level?.trim() || null;
    const scope_type = body?.scope_type?.trim() || null;
    const accounting_scope = body?.accounting_scope?.trim() || "none";

    const cost_center_required = !!body?.cost_center_required;
    const profit_center_required = !!body?.profit_center_required;
    const business_unit_required = !!body?.business_unit_required;
    const gl_mapping_required = !!body?.gl_mapping_required;
    const can_approve_budget = !!body?.can_approve_budget;
    const can_manage_employees = !!body?.can_manage_employees;

    const job_color = body?.job_color || "#E2E8F0";
    const job_icon = body?.job_icon || null;
    const job_description = body?.job_description?.trim() || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!job_code || !job_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส Job และชื่อ Job" },
        { status: 400 }
      );
    }

    const payload = {
      job_code,
      job_name,
      job_level,
      job_family,
      job_category,
      role_type,
      management_level,
      scope_type,
      accounting_scope,
      cost_center_required,
      profit_center_required,
      business_unit_required,
      gl_mapping_required,
      can_approve_budget,
      can_manage_employees,
      job_color,
      job_icon,
      job_description,
      status,
      sort_order,
    };

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert([payload])
      .select(jobSelect)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "รหัส Job นี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    const mappedJob = mapJob(data);

    await writeActivityLog({
      module_name: "jobs",
      action_type: "create",
      reference_table: "jobs",
      reference_id: data.id,
      description: `เพิ่ม Job ${data.job_code} - ${data.job_name}`,
      new_data: mappedJob,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Job สำเร็จ",
      data: mappedJob,
    });
  } catch (error) {
    console.error("CREATE_JOB_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถบันทึก Job ได้" },
      { status: 500 }
    );
  }
}