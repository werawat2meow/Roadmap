import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   Constants
========================================================= */

const ROLE_TABLE = "roles";
const ROLE_PERMISSION_TABLE = "role_permissions";
const PERMISSION_TABLE = "permissions";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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

function cleanNullableText(value) {
  const text = cleanText(value);

  return text || null;
}

function cleanBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function uniqueIds(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

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
      "ROLE_ACTIVITY_LOG_ERROR:",
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
        description,
        is_active,
        is_system,
        created_at,
        updated_at
      `)
      .eq("id", roleId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Load Role Permission Mappings
========================================================= */

async function loadRolePermissionMappings(
  roleIds = []
) {
  const ids = uniqueIds(roleIds);

  if (!ids.length) {
    return [];
  }

  const { data, error } =
    await supabaseAdmin
      .from(ROLE_PERMISSION_TABLE)
      .select(`
        id,
        role_id,
        permission_id,
        created_at
      `)
      .in("role_id", ids);

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   Load Permission Details
========================================================= */

async function loadPermissions(permissionIds = []) {
  const ids = uniqueIds(permissionIds);

  if (!ids.length) {
    return [];
  }

  const { data, error } =
    await supabaseAdmin
      .from(PERMISSION_TABLE)
      .select(`
        id,
        permission_code,
        permission_name,
        description,
        module_code,
        action_code,
        is_active
      `)
      .in("id", ids)
      .order("module_code", {
        ascending: true,
      })
      .order("permission_code", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   Validate Permission IDs
========================================================= */

async function validatePermissionIds(permissionIds = []) {
  const ids = uniqueIds(permissionIds);

  if (!ids.length) {
    return {
      valid: true,
      permissions: [],
      missingIds: [],
      inactivePermissions: [],
    };
  }

  const permissions =
    await loadPermissions(ids);

  const foundIds = new Set(
    permissions.map((item) => item.id)
  );

  const missingIds = ids.filter(
    (id) => !foundIds.has(id)
  );

  const inactivePermissions =
    permissions.filter(
      (item) => item.is_active === false
    );

  return {
    valid:
      missingIds.length === 0 &&
      inactivePermissions.length === 0,

    permissions,
    missingIds,
    inactivePermissions,
  };
}

/* =========================================================
   Enrich Roles with Permissions
========================================================= */

async function enrichRoles(roles = []) {
  if (!roles.length) {
    return [];
  }

  const roleIds = roles.map(
    (role) => role.id
  );

  const mappings =
    await loadRolePermissionMappings(roleIds);

  const permissionIds = mappings.map(
    (item) => item.permission_id
  );

  const permissions =
    await loadPermissions(permissionIds);

  const permissionMap = new Map(
    permissions.map((permission) => [
      permission.id,
      permission,
    ])
  );

  const mappingsByRole = new Map();

  for (const mapping of mappings) {
    if (!mappingsByRole.has(mapping.role_id)) {
      mappingsByRole.set(
        mapping.role_id,
        []
      );
    }

    const permission =
      permissionMap.get(
        mapping.permission_id
      ) || null;

    mappingsByRole
      .get(mapping.role_id)
      .push({
        id: mapping.id,
        role_id: mapping.role_id,
        permission_id:
          mapping.permission_id,
        created_at: mapping.created_at,
        permission,
      });
  }

  return roles.map((role) => {
    const roleMappings =
      mappingsByRole.get(role.id) || [];

    const rolePermissions =
      roleMappings
        .map((item) => item.permission)
        .filter(Boolean);

    return {
      ...role,

      permission_ids:
        rolePermissions.map(
          (permission) => permission.id
        ),

      permission_codes:
        rolePermissions.map(
          (permission) =>
            permission.permission_code
        ),

      permissions: rolePermissions,

      role_permissions: roleMappings,

      permission_count:
        rolePermissions.length,
    };
  });
}

/* =========================================================
   Find Duplicate Role Code
========================================================= */

async function findDuplicateRoleCode({
  roleCode,
  excludeId = null,
}) {
  let query = supabaseAdmin
    .from(ROLE_TABLE)
    .select("id, role_code")
    .ilike("role_code", roleCode);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } =
    await query.limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

/* =========================================================
   Replace Role Permissions
========================================================= */

async function replaceRolePermissions({
  roleId,
  permissionIds,
  oldPermissionIds = [],
}) {
  const { error: deleteError } =
    await supabaseAdmin
      .from(ROLE_PERMISSION_TABLE)
      .delete()
      .eq("role_id", roleId);

  if (deleteError) {
    throw deleteError;
  }

  if (!permissionIds.length) {
    return;
  }

  const rows = permissionIds.map(
    (permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
    })
  );

  const { error: insertError } =
    await supabaseAdmin
      .from(ROLE_PERMISSION_TABLE)
      .insert(rows);

  if (!insertError) {
    return;
  }

  /*
   * Best-effort rollback
   */

  if (oldPermissionIds.length > 0) {
    const rollbackRows =
      oldPermissionIds.map(
        (permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })
      );

    const { error: rollbackError } =
      await supabaseAdmin
        .from(ROLE_PERMISSION_TABLE)
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

/* =========================================================
   GET
   /api/admin/roles

   Query:
   - role_id
   - search
   - is_active=true|false
   - all=true
   - page
   - pageSize
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const roleId = cleanText(
      searchParams.get("role_id")
    );

    const search = cleanText(
      searchParams.get("search")
    );

    const activeParam =
      searchParams.get("is_active");

    const all =
      searchParams.get("all") === "true";

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        DEFAULT_PAGE
      );

    const requestedPageSize =
      parsePositiveInteger(
        searchParams.get("pageSize"),
        DEFAULT_PAGE_SIZE
      );

    const pageSize = Math.min(
      requestedPageSize,
      MAX_PAGE_SIZE
    );

    /* =====================================================
       Detail by role_id
    ===================================================== */

    if (roleId) {
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

      const enriched =
        await enrichRoles([role]);

      return NextResponse.json({
        success: true,
        data: enriched[0],
      });
    }

    /* =====================================================
       List
    ===================================================== */

    let query = supabaseAdmin
      .from(ROLE_TABLE)
      .select(
        `
          id,
          role_code,
          role_name,
          description,
          is_active,
          is_system,
          created_at,
          updated_at
        `,
        {
          count: "exact",
        }
      )
      .order("is_system", {
        ascending: false,
      })
      .order("role_code", {
        ascending: true,
      });

    if (search) {
      query = query.or(
        [
          `role_code.ilike.%${search}%`,
          `role_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (
      activeParam === "true" ||
      activeParam === "false"
    ) {
      query = query.eq(
        "is_active",
        activeParam === "true"
      );
    }

    if (!all) {
      const from =
        (page - 1) * pageSize;

      const to =
        from + pageSize - 1;

      query = query.range(from, to);
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }

    const enriched =
      await enrichRoles(data || []);

    const total = count || 0;

    return NextResponse.json({
      success: true,

      data: enriched,

      pagination: {
        page: all ? 1 : page,

        pageSize: all
          ? total
          : pageSize,

        total,

        totalPages: all
          ? total > 0
            ? 1
            : 0
          : Math.ceil(
              total / pageSize
            ),
      },
    });
  } catch (error) {
    console.error(
      "GET_ROLES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดข้อมูล Role และ Permission ได้",

        code: error?.code || null,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   Create Role + Permissions

   Body:
   {
     "role_code": "HR_ADMIN",
     "role_name": "HR Administrator",
     "description": "...",
     "is_active": true,
     "is_system": false,
     "permission_ids": []
   }
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const roleCode = cleanText(
      body?.role_code
    ).toUpperCase();

    const roleName = cleanText(
      body?.role_name
    );

    const description =
      cleanNullableText(
        body?.description
      );

    const isActive =
      cleanBoolean(
        body?.is_active,
        true
      );

    const isSystem =
      cleanBoolean(
        body?.is_system,
        false
      );

    const permissionIds =
      uniqueIds(
        body?.permission_ids
      );

    if (!roleCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัส Role",
        },
        {
          status: 400,
        }
      );
    }

    if (!roleName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อ Role",
        },
        {
          status: 400,
        }
      );
    }

    const duplicate =
      await findDuplicateRoleCode({
        roleCode,
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัส Role นี้มีอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    const permissionValidation =
      await validatePermissionIds(
        permissionIds
      );

    if (
      permissionValidation
        .missingIds.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "พบ Permission ที่ไม่มีอยู่ในระบบ",

          invalid_permission_ids:
            permissionValidation.missingIds,
        },
        {
          status: 400,
        }
      );
    }

    if (
      permissionValidation
        .inactivePermissions.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "มี Permission ที่ถูกปิดใช้งาน",

          inactive_permissions:
            permissionValidation
              .inactivePermissions,
        },
        {
          status: 400,
        }
      );
    }

    const rolePayload = {
      role_code: roleCode,
      role_name: roleName,
      description,
      is_active: isActive,
      is_system: isSystem,
      created_at:
        new Date().toISOString(),
      updated_at:
        new Date().toISOString(),
    };

    const {
      data: createdRole,
      error: roleError,
    } = await supabaseAdmin
      .from(ROLE_TABLE)
      .insert(rolePayload)
      .select(`
        id,
        role_code,
        role_name,
        description,
        is_active,
        is_system,
        created_at,
        updated_at
      `)
      .single();

    if (roleError) {
      throw roleError;
    }

    try {
      if (permissionIds.length > 0) {
        const rows =
          permissionIds.map(
            (permissionId) => ({
              role_id: createdRole.id,
              permission_id:
                permissionId,
            })
          );

        const { error: mappingError } =
          await supabaseAdmin
            .from(
              ROLE_PERMISSION_TABLE
            )
            .insert(rows);

        if (mappingError) {
          throw mappingError;
        }
      }
    } catch (permissionError) {
      /*
       * ลบ Role หากสร้าง Mapping ไม่สำเร็จ
       */

      await supabaseAdmin
        .from(ROLE_TABLE)
        .delete()
        .eq("id", createdRole.id);

      throw permissionError;
    }

    const enriched =
      await enrichRoles([
        createdRole,
      ]);

    await safeWriteActivityLog({
      module_name: "roles",

      action_type: "CREATE",

      reference_table:
        ROLE_TABLE,

      reference_id:
        createdRole.id,

      description:
        `สร้าง Role ${roleCode} - ${roleName}`,

      old_data: null,

      new_data: {
        role: createdRole,
        permission_ids:
          permissionIds,
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "เพิ่ม Role และ Permission เรียบร้อยแล้ว",

        data:
          enriched[0] ||
          createdRole,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_ROLE_ERROR:",
      error
    );

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,

          error:
            "รหัส Role หรือ Permission ซ้ำ",
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
            "Permission ที่เลือกไม่มีอยู่ในระบบ",
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
          "ไม่สามารถเพิ่ม Role ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
   Update Role + Replace Permissions

   Body:
   {
     "id": "ROLE_UUID",
     "role_code": "HR_ADMIN",
     "role_name": "...",
     "permission_ids": []
   }

   ถ้าไม่ส่ง permission_ids
   จะไม่แก้ Permission เดิม
========================================================= */

export async function PATCH(req) {
  try {
    const body = await req.json();

    const roleId = cleanText(
      body?.id || body?.role_id
    );

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Role ID",
        },
        {
          status: 400,
        }
      );
    }

    const oldRole =
      await loadRole(roleId);

    if (!oldRole) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Role ที่ต้องการแก้ไข",
        },
        {
          status: 404,
        }
      );
    }

    const roleCode =
      body?.role_code !== undefined
        ? cleanText(
            body.role_code
          ).toUpperCase()
        : oldRole.role_code;

    const roleName =
      body?.role_name !== undefined
        ? cleanText(
            body.role_name
          )
        : oldRole.role_name;

    const description =
      body?.description !== undefined
        ? cleanNullableText(
            body.description
          )
        : oldRole.description;

    const isActive =
      body?.is_active !== undefined
        ? cleanBoolean(
            body.is_active,
            oldRole.is_active
          )
        : oldRole.is_active;

    const isSystem =
      body?.is_system !== undefined
        ? cleanBoolean(
            body.is_system,
            oldRole.is_system
          )
        : oldRole.is_system;

    if (!roleCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัส Role",
        },
        {
          status: 400,
        }
      );
    }

    if (!roleName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อ Role",
        },
        {
          status: 400,
        }
      );
    }

    const duplicate =
      await findDuplicateRoleCode({
        roleCode,
        excludeId: roleId,
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัส Role นี้มีอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    const oldMappings =
      await loadRolePermissionMappings([
        roleId,
      ]);

    const oldPermissionIds =
      oldMappings.map(
        (item) => item.permission_id
      );

    let permissionIds = null;

    if (
      body?.permission_ids !== undefined
    ) {
      permissionIds = uniqueIds(
        body.permission_ids
      );

      const validation =
        await validatePermissionIds(
          permissionIds
        );

      if (
        validation.missingIds.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "พบ Permission ที่ไม่มีอยู่ในระบบ",

            invalid_permission_ids:
              validation.missingIds,
          },
          {
            status: 400,
          }
        );
      }

      if (
        validation
          .inactivePermissions
          .length > 0
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "มี Permission ที่ถูกปิดใช้งาน",

            inactive_permissions:
              validation
                .inactivePermissions,
          },
          {
            status: 400,
          }
        );
      }
    }

    const rolePayload = {
      role_code: roleCode,
      role_name: roleName,
      description,
      is_active: isActive,
      is_system: isSystem,
      updated_at:
        new Date().toISOString(),
    };

    const {
      data: updatedRole,
      error: roleUpdateError,
    } = await supabaseAdmin
      .from(ROLE_TABLE)
      .update(rolePayload)
      .eq("id", roleId)
      .select(`
        id,
        role_code,
        role_name,
        description,
        is_active,
        is_system,
        created_at,
        updated_at
      `)
      .single();

    if (roleUpdateError) {
      throw roleUpdateError;
    }

    if (permissionIds !== null) {
      try {
        await replaceRolePermissions({
          roleId,
          permissionIds,
          oldPermissionIds,
        });
      } catch (permissionError) {
        /*
         * คืนค่า Role เดิม
         */

        const {
          error: roleRollbackError,
        } = await supabaseAdmin
          .from(ROLE_TABLE)
          .update({
            role_code:
              oldRole.role_code,

            role_name:
              oldRole.role_name,

            description:
              oldRole.description,

            is_active:
              oldRole.is_active,

            is_system:
              oldRole.is_system,

            updated_at:
              oldRole.updated_at,
          })
          .eq("id", roleId);

        if (roleRollbackError) {
          console.error(
            "ROLLBACK_ROLE_ERROR:",
            roleRollbackError
          );
        }

        throw permissionError;
      }
    }

    const enriched =
      await enrichRoles([
        updatedRole,
      ]);

    await safeWriteActivityLog({
      module_name: "roles",

      action_type: "UPDATE",

      reference_table:
        ROLE_TABLE,

      reference_id: roleId,

      description:
        `แก้ไข Role ${roleCode} - ${roleName}`,

      old_data: {
        role: oldRole,
        permission_ids:
          oldPermissionIds,
      },

      new_data: {
        role: updatedRole,

        permission_ids:
          permissionIds ??
          oldPermissionIds,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไข Role และ Permission เรียบร้อยแล้ว",

      data:
        enriched[0] ||
        updatedRole,
    });
  } catch (error) {
    console.error(
      "UPDATE_ROLE_ERROR:",
      error
    );

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,

          error:
            "รหัส Role หรือ Permission ซ้ำ",
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
            "Permission ที่เลือกไม่มีอยู่ในระบบ",
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
          "ไม่สามารถแก้ไข Role ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
   /api/admin/roles?id=ROLE_UUID

   role_permissions จะถูกลบตาม CASCADE
========================================================= */

export async function DELETE(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const roleId = cleanText(
      searchParams.get("id") ||
        searchParams.get("role_id")
    );

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Role ID",
        },
        {
          status: 400,
        }
      );
    }

    const oldRole =
      await loadRole(roleId);

    if (!oldRole) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Role ที่ต้องการลบ",
        },
        {
          status: 404,
        }
      );
    }

    if (oldRole.is_system) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบ System Role ได้",
        },
        {
          status: 409,
        }
      );
    }

    const oldMappings =
      await loadRolePermissionMappings([
        roleId,
      ]);

    const { error } =
      await supabaseAdmin
        .from(ROLE_TABLE)
        .delete()
        .eq("id", roleId);

    if (error) {
      throw error;
    }

    await safeWriteActivityLog({
      module_name: "roles",

      action_type: "DELETE",

      reference_table:
        ROLE_TABLE,

      reference_id: roleId,

      description:
        `ลบ Role ${oldRole.role_code} - ${oldRole.role_name}`,

      old_data: {
        role: oldRole,

        permission_ids:
          oldMappings.map(
            (item) =>
              item.permission_id
          ),
      },

      new_data: null,
    });

    return NextResponse.json({
      success: true,

      message:
        "ลบ Role และ Permission เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_ROLE_ERROR:",
      error
    );

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          success: false,

          error:
            "ไม่สามารถลบ Role ได้ เนื่องจากยังมีผู้ใช้งานหรือ Assignment อ้างอิงอยู่",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถลบ Role ได้",
      },
      {
        status: 500,
      }
    );
  }
}