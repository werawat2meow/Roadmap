import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   Constants
========================================================= */

const ROLE_PERMISSION_TABLE =
  "role_permissions";

const ROLE_TABLE =
  "roles";

const PERMISSION_TABLE =
  "permissions";

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function uniqueIds(values = []) {
  return [
    ...new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean)
    ),
  ];
}

async function safeWriteActivityLog(payload) {
  try {
    await writeActivityLog(payload);
  } catch (error) {
    console.error(
      "ROLE_PERMISSION_ACTIVITY_LOG_ERROR:",
      error
    );
  }
}

/* =========================================================
   Load Role
========================================================= */

async function loadRole(roleId) {
  const { data, error } =
    await supabaseAdmin
      .from(ROLE_TABLE)
      .select(`
        id,
        role_code,
        role_name,
        is_active,
        is_system
      `)
      .eq("id", roleId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Load Permission Details
========================================================= */

async function loadPermissionDetails(
  permissionIds = []
) {
  const ids = uniqueIds(permissionIds);

  if (!ids.length) {
    return [];
  }

  /*
   * ไม่ใส่ is_system ใน select
   * เพราะต้องตรวจว่าตาราง permissions
   * ของระบบมีคอลัมน์นี้จริงหรือไม่
   */

  const { data, error } =
    await supabaseAdmin
      .from(PERMISSION_TABLE)
      .select(`
        id,
        module_code,
        action_code,
        permission_code,
        permission_name,
        description,
        is_active
      `)
      .in("id", ids);

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   GET
   /api/admin/role-permissions?role_id=UUID
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(
      req.url
    );

    const roleId = cleanText(
      searchParams.get("role_id")
    );

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุ role_id",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       1. ตรวจสอบ Role
    ===================================================== */

    const role = await loadRole(roleId);

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Role ที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       2. โหลด Mapping จาก role_permissions
    ===================================================== */

    const {
      data: mappingRows,
      error: mappingError,
    } = await supabaseAdmin
      .from(ROLE_PERMISSION_TABLE)
      .select(`
        id,
        role_id,
        permission_id
      `)
      .eq("role_id", roleId);

    if (mappingError) {
      throw mappingError;
    }

    const permissionIds = uniqueIds(
      (mappingRows || []).map(
        (item) => item.permission_id
      )
    );

    /* =====================================================
       3. โหลดรายละเอียด Permissions
    ===================================================== */

    const permissions =
      await loadPermissionDetails(
        permissionIds
      );

    const permissionMap = new Map(
      permissions.map((permission) => [
        permission.id,
        permission,
      ])
    );

    const data = (mappingRows || []).map(
      (item) => ({
        id: item.id,

        role_id: item.role_id,

        permission_id:
          item.permission_id,

        permission:
          permissionMap.get(
            item.permission_id
          ) || null,
      })
    );

    return NextResponse.json({
      success: true,

      role,

      permission_ids: permissionIds,

      permissions,

      data,

      total: data.length,
    });
  } catch (error) {
    console.error(
      "GET_ROLE_PERMISSIONS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถดึงข้อมูลสิทธิ์ของ Role ได้",

        code: error?.code || null,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   Replace Permissions ของ Role ทั้งหมด

   Body:
   {
     "role_id": "ROLE_UUID",
     "permission_ids": [
       "PERMISSION_UUID_1",
       "PERMISSION_UUID_2"
     ]
   }
========================================================= */

export async function PUT(req) {
  try {
    const body = await req.json();

    const roleId = cleanText(
      body?.role_id
    );

    const permissionIds = uniqueIds(
      Array.isArray(body?.permission_ids)
        ? body.permission_ids
        : []
    );

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Role",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       1. ตรวจสอบ Role
    ===================================================== */

    const role = await loadRole(roleId);

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Role ที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       2. ตรวจ Permission IDs ที่ส่งมา
    ===================================================== */

    const selectedPermissions =
      await loadPermissionDetails(
        permissionIds
      );

    const foundPermissionIds = new Set(
      selectedPermissions.map(
        (permission) => permission.id
      )
    );

    const missingPermissionIds =
      permissionIds.filter(
        (permissionId) =>
          !foundPermissionIds.has(
            permissionId
          )
      );

    if (missingPermissionIds.length > 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "พบ Permission ที่ไม่มีอยู่ในระบบ",

          invalid_permission_ids:
            missingPermissionIds,
        },
        {
          status: 400,
        }
      );
    }

    const inactivePermissions =
      selectedPermissions.filter(
        (permission) =>
          permission.is_active === false
      );

    if (inactivePermissions.length > 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "มี Permission ที่ถูกปิดใช้งาน กรุณาเลือกใหม่",

          inactive_permissions:
            inactivePermissions.map(
              (permission) => ({
                id: permission.id,

                permission_code:
                  permission.permission_code,

                permission_name:
                  permission.permission_name,
              })
            ),
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. โหลด Mapping เดิม
    ===================================================== */

    const {
      data: oldMappings,
      error: oldMappingError,
    } = await supabaseAdmin
      .from(ROLE_PERMISSION_TABLE)
      .select(`
        id,
        role_id,
        permission_id
      `)
      .eq("role_id", roleId);

    if (oldMappingError) {
      throw oldMappingError;
    }

    const oldPermissionIds = uniqueIds(
      (oldMappings || []).map(
        (item) => item.permission_id
      )
    );

    const oldPermissionDetails =
      await loadPermissionDetails(
        oldPermissionIds
      );

    /* =====================================================
       4. ลบ Mapping เดิม
    ===================================================== */

    const { error: deleteError } =
      await supabaseAdmin
        .from(ROLE_PERMISSION_TABLE)
        .delete()
        .eq("role_id", roleId);

    if (deleteError) {
      throw deleteError;
    }

    /* =====================================================
       5. Insert Mapping ใหม่
    ===================================================== */

    if (permissionIds.length > 0) {
      const insertRows =
        permissionIds.map(
          (permissionId) => ({
            role_id: roleId,

            permission_id:
              permissionId,
          })
        );

      const { error: insertError } =
        await supabaseAdmin
          .from(ROLE_PERMISSION_TABLE)
          .insert(insertRows);

      if (insertError) {
        /*
         * พยายามคืนค่าเดิม หาก Insert ใหม่ล้ม
         */

        if (oldPermissionIds.length > 0) {
          const rollbackRows =
            oldPermissionIds.map(
              (permissionId) => ({
                role_id: roleId,

                permission_id:
                  permissionId,
              })
            );

          const {
            error: rollbackError,
          } = await supabaseAdmin
            .from(
              ROLE_PERMISSION_TABLE
            )
            .insert(rollbackRows);

          if (rollbackError) {
            console.error(
              "ROLLBACK_ROLE_PERMISSIONS_ERROR:",
              rollbackError
            );
          }
        }

        throw insertError;
      }
    }

    /* =====================================================
       6. Activity Log
    ===================================================== */

    await safeWriteActivityLog({
      module_name:
        "role_permissions",

      action_type: "UPDATE",

      reference_table:
        ROLE_PERMISSION_TABLE,

      reference_id: role.id,

      description:
        `แก้ไขสิทธิ์ของ Role ` +
        `${role.role_code} - ${role.role_name}`,

      old_data: {
        role_id: role.id,

        role_code: role.role_code,

        role_name: role.role_name,

        permission_ids:
          oldPermissionIds,

        permissions:
          oldPermissionDetails.map(
            (permission) => ({
              permission_id:
                permission.id,

              permission_code:
                permission.permission_code,

              permission_name:
                permission.permission_name,
            })
          ),
      },

      new_data: {
        role_id: role.id,

        role_code: role.role_code,

        role_name: role.role_name,

        permission_ids:
          permissionIds,

        permissions:
          selectedPermissions.map(
            (permission) => ({
              permission_id:
                permission.id,

              permission_code:
                permission.permission_code,

              permission_name:
                permission.permission_name,
            })
          ),
      },
    });

    return NextResponse.json({
      success: true,

      message:
        `บันทึกสิทธิ์ของ Role ` +
        `${role.role_name} สำเร็จ`,

      data: {
        role,

        permission_ids:
          permissionIds,

        permissions:
          selectedPermissions,

        total:
          permissionIds.length,
      },
    });
  } catch (error) {
    console.error(
      "SAVE_ROLE_PERMISSIONS_ERROR:",
      error
    );

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error:
            "พบ Permission ซ้ำใน Role นี้",
        },
        {
          status: 409,
        }
      );
    }

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Role หรือ Permission ที่เลือกไม่มีอยู่ในระบบ",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถบันทึกสิทธิ์ของ Role ได้",

        code: error?.code || null,
      },
      {
        status: 500,
      }
    );
  }
}