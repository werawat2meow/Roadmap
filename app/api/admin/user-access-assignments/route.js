import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   Constants
========================================================= */

const TABLE_NAME = "user_access_assignments";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);

  return text || null;
}

function cleanNullableDate(value) {
  const text = cleanText(value);

  return text || null;
}

function cleanBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === "false" || value === 0 || value === "0") {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function isValidDateRange(
  effectiveFrom,
  effectiveTo
) {
  if (!effectiveFrom || !effectiveTo) {
    return true;
  }

  const fromDate = new Date(
    `${effectiveFrom}T00:00:00`
  );

  const toDate = new Date(
    `${effectiveTo}T00:00:00`
  );

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime())
  ) {
    return false;
  }

  return toDate >= fromDate;
}

function normalizeStatus(value) {
  const status =
    cleanText(value).toLowerCase() ||
    "active";

  if (
    !["active", "inactive"].includes(
      status
    )
  ) {
    return null;
  }

  return status;
}

/* =========================================================
   Helper: write activity log safely
========================================================= */

async function safeWriteActivityLog(payload) {
  try {
    await writeActivityLog(payload);
  } catch (error) {
    console.error(
      "[user-access-assignments] activity log error:",
      error
    );
  }
}

/* =========================================================
   Helper: load users and roles separately

   ไม่ใช้ nested relation โดยตรง เพื่อป้องกัน Supabase
   relationship error หากชื่อ constraint ไม่ตรง
========================================================= */

async function enrichAssignments(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const userAccountIds = [
    ...new Set(
      items
        .map((item) => item.user_account_id)
        .filter(Boolean)
    ),
  ];

  const roleIds = [
    ...new Set(
      items
        .map((item) => item.role_id)
        .filter(Boolean)
    ),
  ];

  let userAccounts = [];
  let roles = [];

  if (userAccountIds.length > 0) {
    const { data, error } =
      await supabaseAdmin
        .from("user_accounts")
        .select(`
          id,
          employee_id,
          username,
          is_active,
          last_login_at,
          employees (
            id,
            employee_code,
            first_name_th,
            last_name_th,
            first_name_en,
            last_name_en,
            nick_name,
            employee_photo_url,
            branch_id,
            department_id,
            division_id,
            unit_id,
            position_id
          )
        `)
        .in("id", userAccountIds);

    if (error) {
      console.error(
        "[user-access-assignments] load user accounts error:",
        error
      );
    } else {
      userAccounts = data || [];
    }
  }

  if (roleIds.length > 0) {
    const { data, error } =
      await supabaseAdmin
        .from("roles")
        .select(`
          id,
          role_code,
          role_name,
          is_active,
          is_system
        `)
        .in("id", roleIds);

    if (error) {
      console.error(
        "[user-access-assignments] load roles error:",
        error
      );
    } else {
      roles = data || [];
    }
  }

  const userAccountMap = new Map(
    userAccounts.map((item) => [
      item.id,
      item,
    ])
  );

  const roleMap = new Map(
    roles.map((item) => [
      item.id,
      item,
    ])
  );

  return items.map((item) => {
    const userAccount =
      userAccountMap.get(
        item.user_account_id
      ) || null;

    const role =
      roleMap.get(item.role_id) || null;

    const employee =
      userAccount?.employees || null;

    const employeeFullNameTh = [
      employee?.first_name_th,
      employee?.last_name_th,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const employeeFullNameEn = [
      employee?.first_name_en,
      employee?.last_name_en,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...item,

      user_account: userAccount
        ? {
            id: userAccount.id,
            employee_id:
              userAccount.employee_id,
            username: userAccount.username,
            is_active:
              userAccount.is_active,
            last_login_at:
              userAccount.last_login_at,
          }
        : null,

      employee: employee
        ? {
            ...employee,
            full_name_th:
              employeeFullNameTh,
            full_name_en:
              employeeFullNameEn,
          }
        : null,

      role,
    };
  });
}

/* =========================================================
   Helper: validate user account
========================================================= */

async function validateUserAccount(
  userAccountId
) {
  const { data, error } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        username,
        employee_id,
        is_active
      `)
      .eq("id", userAccountId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Helper: validate role
========================================================= */

async function validateRole(roleId) {
  const { data, error } =
    await supabaseAdmin
      .from("roles")
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
   Helper: duplicate assignment

   ป้องกัน User เดียวกันมี Role เดียวกัน
   และช่วง Assignment เดียวกันซ้ำ
========================================================= */

async function findDuplicateAssignment({
  userAccountId,
  roleId,
  excludeId = null,
}) {
  let query = supabaseAdmin
    .from(TABLE_NAME)
    .select(`
      id,
      user_account_id,
      role_id,
      status
    `)
    .eq("user_account_id", userAccountId)
    .eq("role_id", roleId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(
    1
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

/* =========================================================
   Helper: ensure one primary assignment per user
========================================================= */

async function clearOtherPrimaryAssignments({
  userAccountId,
  excludeId = null,
}) {
  let query = supabaseAdmin
    .from(TABLE_NAME)
    .update({
      is_primary: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq("user_account_id", userAccountId)
    .eq("is_primary", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}

/**
 *   เพิ่มการนับขอบเขตงาน
 */
async function attachScopes(
  assignments = []
) {
  if (!assignments.length) {
    return [];
  }

  const assignmentIds =
    assignments
      .map((item) => item.id)
      .filter(Boolean);

  const { data, error } =
    await supabaseAdmin
      .from(
        "user_access_assignment_scopes"
      )
      .select(`
        id,
        user_access_assignment_id,
        scope_type,
        company_id,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        status,
        sort_order
      `)
      .in(
        "user_access_assignment_id",
        assignmentIds
      )
      .eq("status", "active")
      .order("sort_order", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  const scopeMap = new Map();

  for (const scope of data || []) {
    const assignmentId =
      scope.user_access_assignment_id;

    if (!scopeMap.has(assignmentId)) {
      scopeMap.set(
        assignmentId,
        []
      );
    }

    scopeMap
      .get(assignmentId)
      .push(scope);
  }

  return assignments.map(
    (assignment) => {
      const scopes =
        scopeMap.get(
          assignment.id
        ) || [];

      return {
        ...assignment,
        scopes,
        scope_count:
          scopes.length,
      };
    }
  );
}

/* =========================================================
   GET
   /api/admin/user-access-assignments

   Query:
   - search
   - status
   - role_id
   - user_account_id
   - is_primary
   - page
   - pageSize
   - all=true
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(
      req.url
    );

    const search = cleanText(
      searchParams.get("search")
    );

    const status = cleanText(
      searchParams.get("status")
    ).toLowerCase();

    const roleId = cleanText(
      searchParams.get("role_id")
    );

    const userAccountId = cleanText(
      searchParams.get("user_account_id")
    );

    const isPrimaryParam =
      searchParams.get("is_primary");

    const all =
      searchParams.get("all") === "true";

    const page = parsePositiveInteger(
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

    /*
     * Search ต้องค้นจาก username, employee name,
     * employee code และ role ก่อน แล้วนำ ID
     * มากรอง Assignment
     */

    let matchedUserAccountIds = null;
    let matchedRoleIds = null;

    if (search) {
      const searchPattern = `%${search}%`;

      const [
        userAccountResult,
        employeeResult,
        roleResult,
      ] = await Promise.all([
        supabaseAdmin
          .from("user_accounts")
          .select("id")
          .ilike(
            "username",
            searchPattern
          ),

        supabaseAdmin
          .from("employees")
          .select("id")
          .or(
            [
              `employee_code.ilike.${searchPattern}`,
              `first_name_th.ilike.${searchPattern}`,
              `last_name_th.ilike.${searchPattern}`,
              `first_name_en.ilike.${searchPattern}`,
              `last_name_en.ilike.${searchPattern}`,
              `nick_name.ilike.${searchPattern}`,
            ].join(",")
          ),

        supabaseAdmin
          .from("roles")
          .select("id")
          .or(
            [
              `role_code.ilike.${searchPattern}`,
              `role_name.ilike.${searchPattern}`,
            ].join(",")
          ),
      ]);

      if (userAccountResult.error) {
        throw userAccountResult.error;
      }

      if (employeeResult.error) {
        throw employeeResult.error;
      }

      if (roleResult.error) {
        throw roleResult.error;
      }

      const employeeIds = (
        employeeResult.data || []
      ).map((item) => item.id);

      let employeeUserAccountIds = [];

      if (employeeIds.length > 0) {
        const { data, error } =
          await supabaseAdmin
            .from("user_accounts")
            .select("id")
            .in(
              "employee_id",
              employeeIds
            );

        if (error) {
          throw error;
        }

        employeeUserAccountIds = (
          data || []
        ).map((item) => item.id);
      }

      matchedUserAccountIds = [
        ...new Set([
          ...(userAccountResult.data || []).map(
            (item) => item.id
          ),
          ...employeeUserAccountIds,
        ]),
      ];

      matchedRoleIds = [
        ...new Set(
          (roleResult.data || []).map(
            (item) => item.id
          )
        ),
      ];

      /*
       * ถ้า Search ไม่พบทั้ง User และ Role
       * ให้ส่งผลลัพธ์ว่างทันที
       */

      if (
        matchedUserAccountIds.length ===
          0 &&
        matchedRoleIds.length === 0
      ) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            pageSize: all
              ? 0
              : pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    let query = supabaseAdmin
      .from(TABLE_NAME)
      .select(
        `
          id,
          user_account_id,
          role_id,
          assignment_name,
          is_primary,
          status,
          effective_from,
          effective_to,
          created_by,
          updated_by,
          created_at,
          updated_at
        `,
        {
          count: "exact",
        }
      )
      .order("is_primary", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (
      status &&
      ["active", "inactive"].includes(
        status
      )
    ) {
      query = query.eq("status", status);
    }

    if (roleId) {
      query = query.eq("role_id", roleId);
    }

    if (userAccountId) {
      query = query.eq(
        "user_account_id",
        userAccountId
      );
    }

    if (
      isPrimaryParam === "true" ||
      isPrimaryParam === "false"
    ) {
      query = query.eq(
        "is_primary",
        isPrimaryParam === "true"
      );
    }

    if (search) {
      const conditions = [];

      if (
        matchedUserAccountIds?.length > 0
      ) {
        conditions.push(
          `user_account_id.in.(${matchedUserAccountIds.join(
            ","
          )})`
        );
      }

      if (matchedRoleIds?.length > 0) {
        conditions.push(
          `role_id.in.(${matchedRoleIds.join(
            ","
          )})`
        );
      }

      if (conditions.length > 0) {
        query = query.or(
          conditions.join(",")
        );
      }
    }

    if (!all) {
      const from =
        (page - 1) * pageSize;

      const to = from + pageSize - 1;

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

    const enrichedAssignments =
  await enrichAssignments(
    data || []
  );

const enrichedData =
  await attachScopes(
    enrichedAssignments
  );
    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: enrichedData,
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
          : Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/user-access-assignments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "ไม่สามารถโหลดข้อมูลการกำหนดบทบาทผู้ใช้งานได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   /api/admin/user-access-assignments
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const userAccountId = cleanText(
      body?.user_account_id
    );

    const roleId = cleanText(
      body?.role_id
    );

    const assignmentName =
      cleanNullableText(
        body?.assignment_name
      );

    const isPrimary = cleanBoolean(
      body?.is_primary,
      false
    );

    const status = normalizeStatus(
      body?.status
    );

    const effectiveFrom =
      cleanNullableDate(
        body?.effective_from
      ) ||
      new Date()
        .toISOString()
        .slice(0, 10);

    const effectiveTo =
      cleanNullableDate(
        body?.effective_to
      );

    const createdBy =
      cleanNullableText(
        body?.created_by
      );

    if (!userAccountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเลือกผู้ใช้งานระบบ",
        },
        {
          status: 400,
        }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเลือกบทบาท",
        },
        {
          status: 400,
        }
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message:
            "สถานะต้องเป็น active หรือ inactive เท่านั้น",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidDateRange(
        effectiveFrom,
        effectiveTo
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
        },
        {
          status: 400,
        }
      );
    }

    const [
      userAccount,
      role,
      duplicate,
    ] = await Promise.all([
      validateUserAccount(userAccountId),
      validateRole(roleId),
      findDuplicateAssignment({
        userAccountId,
        roleId,
      }),
    ]);

    if (!userAccount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบผู้ใช้งานระบบที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบบทบาทที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (!role.is_active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "บทบาทที่เลือกถูกปิดใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ผู้ใช้งานนี้ได้รับบทบาทดังกล่าวแล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ถ้ารายการใหม่เป็น Primary
     * ให้ยกเลิก Primary เดิมของ User ก่อน
     */

    if (isPrimary) {
      await clearOtherPrimaryAssignments({
        userAccountId,
      });
    }

    const payload = {
      user_account_id: userAccountId,
      role_id: roleId,
      assignment_name:
        assignmentName,
      is_primary: isPrimary,
      status,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      created_by: createdBy,
      updated_by: createdBy,
      created_at:
        new Date().toISOString(),
      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabaseAdmin
        .from(TABLE_NAME)
        .insert(payload)
        .select(`
          id,
          user_account_id,
          role_id,
          assignment_name,
          is_primary,
          status,
          effective_from,
          effective_to,
          created_by,
          updated_by,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      throw error;
    }

    const enriched =
      await enrichAssignments([data]);

    await safeWriteActivityLog({
      module_name:
        "user_access_assignments",
      action_type: "CREATE",
      reference_table: TABLE_NAME,
      reference_id: data.id,
      description: `กำหนดบทบาท ${role.role_name} ให้ผู้ใช้งาน ${userAccount.username}`,
      old_data: null,
      new_data: data,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่มการกำหนดบทบาทผู้ใช้งานเรียบร้อยแล้ว",
        data: enriched[0] || data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/user-access-assignments error:",
      error
    );

    /*
     * PostgreSQL unique violation
     */

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "ผู้ใช้งานนี้ได้รับบทบาทดังกล่าวแล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * PostgreSQL foreign key violation
     */

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          success: false,
          message:
            "ข้อมูลผู้ใช้งานหรือบทบาทไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "ไม่สามารถเพิ่มการกำหนดบทบาทผู้ใช้งานได้",
      },
      {
        status: 500,
      }
    );
  }
}