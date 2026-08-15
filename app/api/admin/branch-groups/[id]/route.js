import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  writeActivityLog,
} from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   PATCH /api/admin/branch-groups/[id]

   Permission:
   ems.branch_groups.edit

   Scope:
   branch_group
   → allowed_branch_group_ids
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    /* =====================================================
       1. Permission + Scope Context
    ===================================================== */

    const guard =
      await requireScopedAccess(
        "ems.branch_groups",
        "edit",
        {
          scopeType:
            "branch_group",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Params
    ===================================================== */

    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรหัสกลุ่มสังกัด",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. Scope Check

       Permission edit อย่างเดียวไม่พอ
       record ต้องอยู่ใน Scope ด้วย
    ===================================================== */

    if (
      !guard.canAccessId(id)
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "คุณไม่มีสิทธิ์แก้ไขกลุ่มสังกัดนี้",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       4. Load Old Data

       ใช้ตรวจ:
       - Record มีจริงหรือไม่
       - Activity Log
    ===================================================== */

    const {
      data: oldData,
      error: oldError,
    } =
      await supabaseAdmin
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
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,

          error:
            "ไม่พบข้อมูลกลุ่มสังกัด",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       5. Body
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
       6. Validate
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
       7. Update
    ===================================================== */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "branch_groups"
        )
        .update({
          group_code,
          group_name,
          group_color,
          sort_order,
          status,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
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
        .single();

    /* =====================================================
       8. DB Error
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
       9. Activity Log
    ===================================================== */

    await writeActivityLog({
      module_name:
        "branch_groups",

      action_type:
        "update",

      reference_table:
        "branch_groups",

      reference_id:
        data.id,

      description:
        `แก้ไขกลุ่มสังกัด ${data.group_code} - ${data.group_name}`,

      old_data:
        oldData,

      new_data:
        data,
    });

    /* =====================================================
       10. Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขข้อมูลสำเร็จ",

      data,
    });
  } catch (error) {
    console.error(
      "UPDATE_BRANCH_GROUP_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "ไม่สามารถแก้ไขข้อมูลกลุ่มสังกัดได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE /api/admin/branch-groups/[id]

   Permission:
   ems.branch_groups.delete

   Scope:
   branch_group
   → allowed_branch_group_ids
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    /* =====================================================
       1. Permission + Scope Context
    ===================================================== */

    const guard =
      await requireScopedAccess(
        "ems.branch_groups",
        "delete",
        {
          scopeType:
            "branch_group",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Params
    ===================================================== */

    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,

          error:
            "ไม่พบรหัสกลุ่มสังกัด",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. Scope Check

       ต้องตรวจ Scope ก่อนเช็ค Reference

       เพื่อไม่เปิดเผยข้อมูลของ Branch Group
       ที่ User ไม่มีสิทธิ์เข้าถึง
    ===================================================== */

    if (
      !guard.canAccessId(id)
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "คุณไม่มีสิทธิ์ลบกลุ่มสังกัดนี้",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       4. Load Old Data
    ===================================================== */

    const {
      data: oldData,
      error: oldError,
    } =
      await supabaseAdmin
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
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,

          error:
            "ไม่พบข้อมูลกลุ่มสังกัด",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       5. Check Branch References

       branches.group_id
       → branch_groups.id
    ===================================================== */

    const {
      count,
      error: countError,
    } =
      await supabaseAdmin
        .from(
          "branches"
        )
        .select(
          "id",
          {
            head: true,
            count: "exact",
          }
        )
        .eq(
          "group_id",
          id
        );

    if (countError) {
      throw countError;
    }

    if (
      Number(count || 0) >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            `ไม่สามารถลบได้ เนื่องจากมี ${count} สังกัด ใช้งานกลุ่มนี้อยู่`,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       6. Delete
    ===================================================== */

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "branch_groups"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    /* =====================================================
       7. Activity Log
    ===================================================== */

    await writeActivityLog({
      module_name:
        "branch_groups",

      action_type:
        "delete",

      reference_table:
        "branch_groups",

      reference_id:
        id,

      description:
        `ลบกลุ่มสังกัด ${oldData.group_code} - ${oldData.group_name}`,

      old_data:
        oldData,
    });

    /* =====================================================
       8. Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        "ลบข้อมูลสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_BRANCH_GROUP_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "ไม่สามารถลบข้อมูลกลุ่มสังกัดได้",
      },
      {
        status: 500,
      }
    );
  }
}