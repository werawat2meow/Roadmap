import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* ==========================================================
 * GET
 * Skill Categories
 * ========================================================== */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("skill_categories")
      .select(
        `
          id,
          category_code,
          category_name,
          description,
          status,
          sort_order,
          created_at,
          updated_at
        `,
        {
          count: "exact",
        }
      )
      .order("sort_order", { ascending: true })
      .order("category_name", { ascending: true });

    // ==========================================
    // Search
    // ==========================================
    if (search) {
      query = query.or(
        [
          `category_code.ilike.%${search}%`,
          `category_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    // ==========================================
    // Status
    // ==========================================
    if (status) {
      query = query.eq("status", status);
    }

    // ==========================================
    // Pagination
    // ==========================================
    if (!all) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: all ? data?.length || 0 : pageSize,
        total: count || 0,
        totalPages: all
          ? 1
          : Math.ceil((count || 0) / pageSize),
      },
    });
        return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: all ? data?.length || 0 : pageSize,
        total: count || 0,
        totalPages: all
          ? 1
          : Math.ceil((count || 0) / pageSize),
      },
    });

  } catch (error) {
    console.error("GET_SKILL_CATEGORIES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load skill categories failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * POST
 * Create Skill Category
 * ========================================================== */
export async function POST(req) {
  try {
    const body = await req.json();

    const categoryCode = body?.category_code?.trim()?.toUpperCase();
    const categoryName = body?.category_name?.trim();

    if (!categoryCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสหมวดหมู่ทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    if (!categoryName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อหมวดหมู่ทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Duplicate Category Code
    // ==========================================
    const { data: duplicateCode } = await supabaseAdmin
      .from("skill_categories")
      .select("id")
      .eq("category_code", categoryCode)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสหมวดหมู่นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Duplicate Category Name
    // ==========================================
    const { data: duplicateName } = await supabaseAdmin
      .from("skill_categories")
      .select("id")
      .ilike("category_name", categoryName)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const payload = {
      category_code: categoryCode,

      category_name: categoryName,

      description: body?.description?.trim() || null,

      status: body?.status || "active",

      sort_order: Number(body?.sort_order || 0),
    };

    const { data, error } = await supabaseAdmin
      .from("skill_categories")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }
        // ==========================================
    // Activity Log
    // ==========================================
    try {
      await writeActivityLog({
        module: "skill_categories",
        action: "CREATE",
        description: `สร้างหมวดหมู่ทักษะ ${data.category_code} : ${data.category_name}`,
        reference_id: data.id,
        reference_code: data.category_code,
        old_data: null,
        new_data: data,
      });
    } catch (logError) {
      console.error(
        "WRITE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "เพิ่มหมวดหมู่ทักษะสำเร็จ",
      data,
    });

  } catch (error) {
    console.error(
      "POST_SKILL_CATEGORY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Create skill category failed",
      },
      {
        status: 500,
      }
    );
  }
}