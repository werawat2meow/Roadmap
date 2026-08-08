import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanNullableText(value) {
  const cleaned = cleanText(value);

  return cleaned || null;
}

function normalizeStatus(value) {
  const status = cleanText(
    value
  ).toLowerCase();

  return ALLOWED_STATUSES.includes(
    status
  )
    ? status
    : "active";
}

function normalizePayload(body = {}) {
  return {
    branch_id:
      cleanNullableText(
        body.branch_id
      ),

    department_id:
      cleanNullableText(
        body.department_id
      ),

    status:
      normalizeStatus(
        body.status
      ),
  };
}

function validatePayload(payload) {
  if (!payload.branch_id) {
    return "กรุณาเลือกสังกัด";
  }

  if (!payload.department_id) {
    return "กรุณาเลือกแผนก";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  return null;
}

function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (error.code === "23505") {
    return "สังกัดนี้มีแผนกดังกล่าวอยู่แล้ว";
  }

  if (error.code === "23503") {
    return "ไม่พบสังกัดหรือแผนกที่อ้างอิง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const branchId =
      searchParams
        .get("branch_id")
        ?.trim() || "";

    const departmentId =
      searchParams
        .get("department_id")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const all =
      searchParams.get("all") ===
      "true";

    const page = Math.max(
      Number(
        searchParams.get("page")
      ) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get(
            "pageSize"
          )
        ) ||
          DEFAULT_PAGE_SIZE,
        1
      ),
      MAX_PAGE_SIZE
    );

    let query = supabaseAdmin
      .from(
        "branch_departments"
      )
      .select(
        `
          id,
          branch_id,
          department_id,
          status,
          created_at,

          branches:branch_id (
            id,
            company_id,
            branch_code,
            branch_name,
            status,

            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            )
          ),

          departments:department_id (
            id,
            department_code,
            department_name,
            status,
            sort_order
          )
        `,
        {
          count: all
            ? undefined
            : "exact",
        }
      );

    if (branchId) {
      query = query.eq(
        "branch_id",
        branchId
      );
    }

    if (departmentId) {
      query = query.eq(
        "department_id",
        departmentId
      );
    }

    if (
      status &&
      ALLOWED_STATUSES.includes(
        status
      )
    ) {
      query = query.eq(
        "status",
        status
      );
    }

    if (search) {
      const safeSearch = search
        .replaceAll(",", " ")
        .trim();

      query = query.or(
        [
          `branches.branch_code.ilike.%${safeSearch}%`,
          `branches.branch_name.ilike.%${safeSearch}%`,
          `departments.department_code.ilike.%${safeSearch}%`,
          `departments.department_name.ilike.%${safeSearch}%`,
        ].join(","),
        {
          referencedTable:
            "branches",
        }
      );
    }

    query = query
      .order("created_at", {
        ascending: false,
      });

    if (all) {
      query = query.limit(5000);
    } else {
      const from =
        (page - 1) *
        pageSize;

      const to =
        from +
        pageSize -
        1;

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

    if (error) {
      console.error(
        "GET branch-departments error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดข้อมูลความสัมพันธ์สังกัดและแผนกได้",
          error:
            mapDatabaseError(
              error
            ),
        },
        {
          status: 500,
        }
      );
    }

    if (all) {
      return NextResponse.json({
        success: true,
        data: data || [],
        total:
          data?.length || 0,
      });
    }

    const total =
      Number(count || 0);

    return NextResponse.json({
      success: true,

      data: data || [],

      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(
          Math.ceil(
            total / pageSize
          ),
          1
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET branch-departments exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการโหลดข้อมูลความสัมพันธ์สังกัดและแผนก",
        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(req) {
  try {
    const body =
      await req.json();

    const payload =
      normalizePayload(body);

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Validate Branch
    ----------------------------------------------------- */

    const {
      data: branch,
      error: branchError,
    } = await supabaseAdmin
      .from("branches")
      .select(
        `
          id,
          branch_code,
          branch_name,
          status
        `
      )
      .eq(
        "id",
        payload.branch_id
      )
      .maybeSingle();

    if (branchError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบสังกัดได้",
          error:
            branchError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบสังกัดที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (
      branch.status !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "สังกัดที่เลือกไม่ได้เปิดใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Validate Department
    ----------------------------------------------------- */

    const {
      data: department,
      error: departmentError,
    } = await supabaseAdmin
      .from("departments")
      .select(
        `
          id,
          department_code,
          department_name,
          status
        `
      )
      .eq(
        "id",
        payload.department_id
      )
      .maybeSingle();

    if (departmentError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบแผนกได้",
          error:
            departmentError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบแผนกที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (
      department.status !==
      "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "แผนกที่เลือกไม่ได้เปิดใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Duplicate Check
    ----------------------------------------------------- */

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from(
        "branch_departments"
      )
      .select("id")
      .eq(
        "branch_id",
        payload.branch_id
      )
      .eq(
        "department_id",
        payload.department_id
      )
      .maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบข้อมูลซ้ำได้",
          error:
            duplicateError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "สังกัดนี้มีแผนกดังกล่าวอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       Insert
    ----------------------------------------------------- */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "branch_departments"
      )
      .insert(payload)
      .select(
        `
          id,
          branch_id,
          department_id,
          status,
          created_at,

          branches:branch_id (
            id,
            company_id,
            branch_code,
            branch_name
          ),

          departments:department_id (
            id,
            department_code,
            department_name,
            status,
            sort_order
          )
        `
      )
      .single();

    if (error) {
      console.error(
        "POST branch-departments error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            mapDatabaseError(
              error
            ),
          error:
            error.message,
        },
        {
          status:
            error.code ===
            "23505"
              ? 409
              : 500,
        }
      );
    }

    try {
      await writeActivityLog({
        moduleName:
          "branch_departments",

        actionType:
          "CREATE",

        referenceTable:
          "branch_departments",

        referenceId:
          data.id,

        description:
          `ผูกแผนก ${department.department_name} กับสังกัด ${branch.branch_name}`,

        oldData: null,

        newData: data,
      });
    } catch (logError) {
      console.error(
        "Write branch department activity log error:",
        logError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่มความสัมพันธ์สังกัดและแผนกเรียบร้อยแล้ว",
        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST branch-departments exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการเพิ่มความสัมพันธ์สังกัดและแผนก",
        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}