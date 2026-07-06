import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select(`
          id,
          job_code,
          job_name,
          job_level,
          management_level,
          scope_type,
          can_approve_budget,
          can_manage_employees,
          job_color,
          job_icon,
          job_description,
          status,
          sort_order,
          created_at
      `)
      .order("sort_order", { ascending: true })
      .order("job_code", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map((job) => ({
      id: job.id,
      job_code: job.job_code,
      job_name: job.job_name,
      job_level: job.job_level,
      management_level: job.management_level,
      scope_type: job.scope_type,
      can_approve_budget: job.can_approve_budget,
      can_manage_employees: job.can_manage_employees,
      job_color: job.job_color,
      job_icon: job.job_icon,
      job_description: job.job_description,
      status: job.status,
      sort_order: job.sort_order,
      created_at: job.created_at,
    }));

    const filteredData = search? mappedData.filter((item) => {
        const keyword = search.toLowerCase();
        return (
          item.job_code?.toLowerCase().includes(keyword) ||
          item.job_name?.toLowerCase().includes(keyword) ||
          item.job_level?.toLowerCase().includes(keyword) ||
          item.management_level?.toLowerCase().includes(keyword) ||
          item.scope_type?.toLowerCase().includes(keyword) ||
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
    const job_description = body?.job_description?.trim() || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);
    const management_level = body?.management_level?.trim() || null;
    const scope_type = body?.scope_type?.trim() || null;
    const can_approve_budget = !!body?.can_approve_budget;
    const can_manage_employees = !!body?.can_manage_employees;
    const job_color = body?.job_color || "#E2E8F0";
    const job_icon = body?.job_icon || null;

    if (!job_code || !job_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส Job และชื่อ Job" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert([
        {
          job_code,
          job_name,
          job_level,
          job_description,
          status,
          sort_order,
          management_level,
          scope_type,
          can_approve_budget,
          can_manage_employees,
          job_color,
          job_icon,
        },
      ])
      .select(`
        id,
        job_code,
        job_name,
        job_level,
        job_description,
        management_level,
        scope_type,
        can_approve_budget,
        can_manage_employees,
        job_color,
        job_icon,
        status,
        sort_order,
        created_at
      `)
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

    await writeActivityLog({
      module_name: "jobs",
      action_type: "create",
      reference_table: "jobs",
      reference_id: data.id,
      description: `เพิ่ม Job ${data.job_code} - ${data.job_name}`,
      new_data: {
        job_code:data.job_code,
        job_name:data.job_name,
        job_level:data.job_level,
        management_level:data.management_level,
        scope_type:data.scope_type,
        can_approve_budget:data.can_approve_budget,
        can_manage_employees:data.can_manage_employees,
        job_color:data.job_color,
        job_icon:data.job_icon,
        job_description:data.job_description,
        status:data.status
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Job สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_JOB_ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถบันทึก Job ได้" },
      { status: 500 }
    );
  }
}