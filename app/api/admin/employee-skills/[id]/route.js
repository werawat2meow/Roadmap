import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const employee_id =
      body?.employee_id || null;

    const skill_id =
      body?.skill_id || null;

    const current_level =
      Number(body?.current_level || 1);

    const target_level =
      body?.target_level
        ? Number(body.target_level)
        : null;

    const importance_level =
      body?.importance_level ||
      "medium";

    const is_verified =
      Boolean(body?.is_verified);

    const verified_by =
      body?.verified_by || null;

    const assessment_date =
      body?.assessment_date || null;

    const expiry_date =
      body?.expiry_date || null;

    const description =
      body?.description?.trim() ||
      null;

    const status =
      body?.status || "active";

    const sort_order =
      Number(body?.sort_order || 0);

    /* =========================
       Validate
    ========================= */

    if (!employee_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกพนักงาน",
        },
        { status: 400 }
      );
    }

    if (!skill_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Skill",
        },
        { status: 400 }
      );
    }

    /* =========================
       Duplicate
    ========================= */

    const {
      data: duplicate,
    } = await supabaseAdmin
      .from("employee_skills")
      .select("id")
      .eq("employee_id", employee_id)
      .eq("skill_id", skill_id)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "พนักงานมี Skill นี้อยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Update
    ========================= */

    const {
      error,
    } = await supabaseAdmin
      .from("employee_skills")
      .update({
        employee_id,
        skill_id,
        current_level,
        target_level,
        importance_level,
        is_verified,
        verified_by,
        assessment_date,
        expiry_date,
        description,
        status,
        sort_order,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    /* =========================
       Load View
    ========================= */

    const {
      data,
      error: loadError,
    } = await supabaseAdmin
      .from("vw_employee_skills")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError) throw loadError;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,

      module:
        "Employee Skills",

      action: "UPDATE",

      description:
        `แก้ไข Skill ${data.skill_name} ของ ${data.employee_name}`,
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขข้อมูลสำเร็จ",

      data,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Update Failed",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    /* =========================
       Check Data
    ========================= */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("vw_employee_skills")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูล",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       Delete
    ========================= */

    const {
      error,
    } = await supabaseAdmin
      .from("employee_skills")
      .delete()
      .eq("id", id);

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,

      module: "Employee Skills",

      action: "DELETE",

      description:
        `ลบ Skill ${oldData.skill_name} ของ ${oldData.employee_name}`,

      oldData,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลสำเร็จ",
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Delete Failed",
      },
      {
        status: 500,
      }
    );
  }
}