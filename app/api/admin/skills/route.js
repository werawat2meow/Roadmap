import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
<<<<<<< HEAD
=======
import { writeActivityLog } from "@/lib/activityLogger";

>>>>>>> test_merge_all

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
<<<<<<< HEAD
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);
=======
    const categoryId = searchParams.get("category_id")?.trim() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const pageSize = Math.max(
      Number(searchParams.get("pageSize") || 20),
      1
    );
>>>>>>> test_merge_all

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("skills")
<<<<<<< HEAD
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("skill_name", { ascending: true });

    if (search) {
      query = query.or(
        `skill_code.ilike.%${search}%,skill_name.ilike.%${search}%,skill_category.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

=======
      .select(
        `
          id,
          category_id,
          skill_code,
          skill_name,
          description,
          status,
          sort_order,
          created_at,
          updated_at,

          skill_categories (
            id,
            category_code,
            category_name
          )
        `,
        {
          count: "exact",
        }
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("skill_name", {
        ascending: true,
      });

    /* ==========================================
     * Search
     * ========================================== */

    if (search) {
      query = query.or(
        [
          `skill_code.ilike.%${search}%`,
          `skill_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* ==========================================
     * Category
     * ========================================== */

    if (categoryId) {
      query = query.eq(
        "category_id",
        categoryId
      );
    }

    /* ==========================================
     * Status
     * ========================================== */

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    /* ==========================================
     * Pagination
     * ========================================== */

>>>>>>> test_merge_all
    if (!all) {
      query = query.range(from, to);
    }

<<<<<<< HEAD
    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: all ? data?.length || 0 : pageSize,
        total: count || 0,
        totalPages: all ? 1 : Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET_SKILLS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Load skills failed" },
      { status: 500 }
=======
    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }

    /* ==========================================
     * Flatten Category
     * ========================================== */

    const rows = (data || []).map(
      (item) => ({
        ...item,

        category_code:
          item.skill_categories
            ?.category_code || "",

        category_name:
          item.skill_categories
            ?.category_name || "",
      })
    );

    return NextResponse.json({
      success: true,

      data: rows,

      pagination: {
        page,

        pageSize: all
          ? rows.length
          : pageSize,

        total: count || 0,

        totalPages: all
          ? 1
          : Math.ceil(
              (count || 0) /
                pageSize
            ),
      },
    });

  } catch (error) {
    console.error(
      "GET_SKILLS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Load skills failed",
      },
      {
        status: 500,
      }
>>>>>>> test_merge_all
    );
  }
}

<<<<<<< HEAD
=======

>>>>>>> test_merge_all
export async function POST(req) {
  try {
    const body = await req.json();

    const skillCode = body?.skill_code?.trim()?.toUpperCase();
    const skillName = body?.skill_name?.trim();
<<<<<<< HEAD

    if (!skillCode) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส Skill" },
=======
    const categoryId = body?.category_id || null;

    /* ==========================================
     * Validation
     * ========================================== */

    if (!skillCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสทักษะ",
        },
>>>>>>> test_merge_all
        { status: 400 }
      );
    }

    if (!skillName) {
      return NextResponse.json(
<<<<<<< HEAD
        { success: false, error: "กรุณากรอกชื่อ Skill" },
=======
        {
          success: false,
          error: "กรุณากรอกชื่อทักษะ",
        },
>>>>>>> test_merge_all
        { status: 400 }
      );
    }

<<<<<<< HEAD
    const payload = {
      skill_code: skillCode,
      skill_name: skillName,
      skill_category: body?.skill_category?.trim() || null,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("skills")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Skill สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("POST_SKILL_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Create skill failed" },
      { status: 500 }
=======
    /* ==========================================
     * Validate Category
     * ========================================== */

    if (categoryId) {
      const { data: category } = await supabaseAdmin
        .from("skill_categories")
        .select("id")
        .eq("id", categoryId)
        .maybeSingle();

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: "ไม่พบหมวดหมู่ทักษะ",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ==========================================
     * Duplicate Code
     * ========================================== */

    const { data: duplicateCode } =
      await supabaseAdmin
        .from("skills")
        .select("id")
        .eq("skill_code", skillCode)
        .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสทักษะนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================================
     * Duplicate Name
     * ========================================== */

    const { data: duplicateName } =
      await supabaseAdmin
        .from("skills")
        .select("id")
        .ilike("skill_name", skillName)
        .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อทักษะนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================================
     * Insert
     * ========================================== */

    const payload = {
      category_id: categoryId,

      skill_code: skillCode,

      skill_name: skillName,

      description:
        body?.description?.trim() || null,

      status:
        body?.status || "active",

      sort_order: Number(
        body?.sort_order || 0
      ),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("skills")
      .insert(payload)
      .select(
        `
          id,
          category_id,
          skill_code,
          skill_name,
          description,
          status,
          sort_order,
          created_at,
          updated_at,

          skill_categories(
            id,
            category_code,
            category_name
          )
        `
      )
      .single();

    if (error) {
      throw error;
    }

    const response = {
      ...data,

      category_code:
        data.skill_categories
          ?.category_code || "",

      category_name:
        data.skill_categories
          ?.category_name || "",
    };

    /* ==========================================
     * Activity Log
     * ========================================== */

    try {
      await writeActivityLog({
        module: "skills",
        action: "CREATE",
        description: `สร้างทักษะ ${response.skill_code} : ${response.skill_name}`,
        reference_id: response.id,
        reference_code:
          response.skill_code,
        old_data: null,
        new_data: response,
      });
    } catch (logError) {
      console.error(
        "WRITE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "เพิ่มทักษะสำเร็จ",
      data: response,
    });

  } catch (error) {
    console.error(
      "POST_SKILL_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Create skill failed",
      },
      {
        status: 500,
      }
>>>>>>> test_merge_all
    );
  }
}