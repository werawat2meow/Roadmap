import {NextResponse} from "next/server";
import {supabaseAdmin,} from "@/lib/supabaseServer";
import {writeActivityLog} from "@/lib/activityLogger";

import {requireScopedAccess,} from "@/lib/auth/requireScopedAccess";


export async function GET(req) {
  try {
    /* =====================================================
       1. Permission + Scope
    ===================================================== */

    const { searchParams } = new URL(req.url);
    const scopeContext = searchParams.get("scope_context")?.trim() || "";
    const permissionModule =
      scopeContext === "ems.employees"
        ? "ems.employees"
        : "ems.branch_groups";

    const guard = await requireScopedAccess(
      permissionModule,
      "view",
      { scopeType: "branch_group" }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    /* =====================================================
       3. Query
    ===================================================== */

    let query =
      supabaseAdmin
        .from(
          "branch_groups"
        )
        .select(`
          id,
          group_code,
          group_name,
          group_color,
          sort_order,
          status,
          created_at,
          updated_at
        `)
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    /* =====================================================
       4. Apply Scope
       branch_groups.id = allowed_branch_group_ids
    ===================================================== */

    query =
      guard.applyScope(
        query,
        "id"
      );

    /* =====================================================
       5. Search

       ให้ Database เป็นคน Search
       ไม่ต้องโหลดทั้งหมดแล้ว filter ใน JS
    ===================================================== */

    if (search) {
      query = query.or(
        [
          `group_code.ilike.%${search}%`,
          `group_name.ilike.%${search}%`,
          `status.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* =====================================================
       6. Execute
    ===================================================== */

    const {data,error} = await query;
    if (error) {
      throw error;
    }

    /* =====================================================
       7. Response
    ===================================================== */

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error(
      "GET_BRANCH_GROUPS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "ไม่สามารถดึงข้อมูลกลุ่มสังกัดได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    /* =====================================================
       1. Permission

       scopeType ยังระบุ branch_group
       แต่ CREATE ไม่บังคับ ALL Scope
    ===================================================== */

    const guard =
      await requireScopedAccess(
        "ems.branch_groups",
        "create",
        {
          scopeType:
            "branch_group",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Body
    ===================================================== */

    const body =
      await req.json();

    const group_code =
      body?.group_code
        ?.trim()
        ?.toUpperCase();

    const group_name =
      body?.group_name
        ?.trim();

    const group_color =
      body?.group_color
        ?.trim() ||
      "#E2E8F0";

    const sort_order =
      Number(
        body?.sort_order ||
          0
      );

    const status =
      body?.status ||
      "active";

    /* =====================================================
       3. Validate
    ===================================================== */

    if (
      !group_code ||
      !group_name
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "กรุณากรอกรหัสกลุ่มและชื่อกลุ่มสังกัด",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       4. Insert
    ===================================================== */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "branch_groups"
        )
        .insert([
          {
            group_code,
            group_name,
            group_color,
            sort_order,
            status,
          },
        ])
        .select(`
          id,
          group_code,
          group_name,
          group_color,
          sort_order,
          status,
          created_at,
          updated_at
        `)
        .single();

    /* =====================================================
       5. DB Error
    ===================================================== */

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "รหัสกลุ่มสังกัดนี้มีอยู่แล้ว",
          },
          {
            status: 400,
          }
        );
      }

      throw error;
    }

    /* =====================================================
       6. Activity Log
    ===================================================== */

    await writeActivityLog({
      module_name:
        "branch_groups",

      action_type:
        "create",

      reference_table:
        "branch_groups",

      reference_id:
        data.id,

      description:
        `เพิ่มกลุ่มสังกัด ${data.group_code} - ${data.group_name}`,

      new_data:
        data,
    });

    /* =====================================================
       7. Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มกลุ่มสังกัดสำเร็จ",

      data,
    });
  } catch (error) {
    console.error(
      "CREATE_BRANCH_GROUP_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "ไม่สามารถบันทึกข้อมูลกลุ่มสังกัดได้",
      },
      {
        status: 500,
      }
    );
  }
}