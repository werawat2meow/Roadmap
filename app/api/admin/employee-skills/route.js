import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   helper
========================= */

function mapEmployeeSkill(item) {
  return {
    id: item.id,

    employee_id: item.employee_id,
    employee_code: item.employee_code || "",
    employee_name: item.employee_name || "",

    skill_id: item.skill_id,
    skill_code: item.skill_code || "",
    skill_name: item.skill_name || "",

    skill_category_id: item.category_id || null,
    skill_category_code:
      item.category_code || "",
    skill_category_name:
      item.category_name || "",

    current_level:
      Number(item.current_level || 1),

    target_level:
      item.target_level == null
        ? null
        : Number(item.target_level),

    importance_level:
      item.importance_level || "medium",

    is_verified:
      Boolean(item.is_verified),

    verified_by:
      item.verified_by,

    verified_by_code:
      item.verified_by_code || "",

    verified_by_name:
      item.verified_by_name || "",

    assessment_date:
      item.assessment_date,

    expiry_date:
      item.expiry_date,

    description:
      item.description || "",

    status:
      item.status || "active",

    sort_order:
      Number(item.sort_order || 0),

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
}

/* =========================
   GET
========================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const search =
      searchParams.get("search") || "";

    const employeeId =
      searchParams.get("employee_id") ||
      "";

    const skillId =
      searchParams.get("skill_id") ||
      "";

    const categoryId =
      searchParams.get("category_id") ||
      "";

    const importanceLevel =
      searchParams.get(
        "importance_level"
      ) || "";

    const verified =
      searchParams.get(
        "is_verified"
      ) || "";

    const status =
      searchParams.get("status") || "";

    const all =
      searchParams.get("all") ===
      "true";

    let query =
      supabaseAdmin
        .from("vw_employee_skills")
        .select("*", {
          count: "exact",
        });

    /* =========================
       Search
    ========================= */

    if (search) {
      query = query.or(
        [
          `employee_code.ilike.%${search}%`,
          `employee_name.ilike.%${search}%`,
          `skill_code.ilike.%${search}%`,
          `skill_name.ilike.%${search}%`,
          `category_code.ilike.%${search}%`,
          `category_name.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* =========================
       Filters
    ========================= */

    if (employeeId) {
      query = query.eq(
        "employee_id",
        employeeId
      );
    }

    if (skillId) {
      query = query.eq(
        "skill_id",
        skillId
      );
    }

    if (categoryId) {
      query = query.eq(
        "category_id",
        categoryId
      );
    }

    if (importanceLevel) {
      query = query.eq(
        "importance_level",
        importanceLevel
      );
    }

    if (verified !== "") {
      query = query.eq(
        "is_verified",
        verified === "true"
      );
    }

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("employee_code", {
        ascending: true,
      });

    if (!all) {
      const from =
        (page - 1) * pageSize;

      const to =
        from + pageSize - 1;

      query = query.range(
        from,
        to
      );
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,

      data:
        (data || []).map(
          mapEmployeeSkill
        ),

      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: all
          ? 1
          : Math.ceil(
              (count || 0) /
                pageSize
            ),
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Load Failed",
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================
   POST
========================= */

export async function POST(req) {
  try {
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
      .eq(
        "employee_id",
        employee_id
      )
      .eq(
        "skill_id",
        skill_id
      )
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
       Insert
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("employee_skills")
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

    /* =========================
       Load View
    ========================= */

    const {
      data: result,
      error: loadError,
    } = await supabaseAdmin
      .from("vw_employee_skills")
      .select("*")
      .eq("id", data.id)
      .single();

    if (loadError) throw loadError;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,

      module:
        "Employee Skills",

      action: "CREATE",

      description:
        `เพิ่ม Skill ${result.skill_name} ให้ ${result.employee_name}`,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มข้อมูลสำเร็จ",

      data:
        mapEmployeeSkill(
          result
        ),
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Create Failed",
      },
      {
        status: 500,
      }
    );
  }
}
