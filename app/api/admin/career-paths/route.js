import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   GET
   ========================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("career_paths")
      .select(
        `
          id,
          path_code,
          path_name,
          description,
          is_active,
          sort_order,
          created_at,
          updated_at,

          position_families (
            id,
            family_code,
            family_name
          )
        `,
        {
          count: "exact",
        }
      );

    /* =========================
       Search
       ========================= */

    if (search.trim()) {
      query = query.or(
        [
          `path_code.ilike.%${search}%`,
          `path_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* =========================
       Sort
       ========================= */

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("path_code", {
        ascending: true,
      });

    /* =========================
       All
       ========================= */

    if (all) {
      const { data, error } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
      });
    }

    /* =========================
       Pagination
       ========================= */

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET Career Paths Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
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

    const pathCode = body?.path_code?.trim().toUpperCase();
    const pathName = body?.path_name?.trim();

    if (!pathCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Career Path Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!pathName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Career Path Name",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.position_family_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Position Family",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Duplicate Code
    ========================= */

    const { data: duplicate } = await supabaseAdmin
      .from("career_paths")
      .select("id")
      .eq("path_code", pathCode)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Career Path Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Payload
    ========================= */

    const payload = {
      path_code: pathCode,
      path_name: pathName,
      position_family_id: body.position_family_id,
      description: body.description?.trim() || null,
      is_active:
        body.is_active === undefined
          ? true
          : body.is_active,
      sort_order:
        Number(body.sort_order) || 0,
    };

    /* =========================
       Insert
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("career_paths")
      .insert(payload)
      .select(
        `
          *,
          position_families(
            id,
            family_code,
            family_name
          )
        `
      )
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      module_name: "Career Paths",
      action_type: "CREATE",
      reference_table: "career_paths",
      reference_id: data.id,
      description: `สร้าง Career Path ${data.path_code} : ${data.path_name}`,
      old_data: null,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message: "สร้าง Career Path สำเร็จ",
      data,
    });
  } catch (error) {
    console.error(
      "POST Career Path Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}





/****
 * 
 * 
 * 
 * 
 *
 * 
 * 
 * 
 * 
 * 
    app/api/admin/career-paths/
    ├── route.js
    └── [id]/
        └── route.js

    app/api/admin/career-path-steps/
    ├── route.js
    └── [id]/
        └── route.js

    app/api/admin/career-path-branches/
    ├── route.js
    └── [id]/
        └── route.js

    app/api/admin/career-path-competencies/
    ├── route.js
    └── [id]/
        └── route.js
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 *  
 * 
 * 
 *
 */