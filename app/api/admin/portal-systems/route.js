import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

/* =========================================================
   Helpers
========================================================= */

function normalizeText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeNullableText(
  value
) {
  const text =
    normalizeText(value);

  return text || null;
}

function normalizeStatus(
  value
) {
  return value ===
    "inactive"
    ? "inactive"
    : "active";
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req
) {
  try {
    const {
      searchParams,
    } = new URL(req.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const all =
      searchParams.get(
        "all"
      ) === "true";

    const page =
      Math.max(
        Number(
          searchParams.get(
            "page"
          ) || 1
        ),
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          Number(
            searchParams.get(
              "pageSize"
            ) || 20
          ),
          1
        ),
        200
      );

    let query =
      supabaseAdmin
        .from(
          "portal_systems"
        )
        .select(
          `
          id,
          system_code,
          system_name,
          system_subtitle,
          description,
          base_path,
          permission_code,
          icon_code,
          sort_order,
          status,
          created_at,
          updated_at
        `,
          {
            count: "exact",
          }
        );

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    if (search) {
      query =
        query.or(
          [
            `system_code.ilike.%${search}%`,
            `system_name.ilike.%${search}%`,
            `system_subtitle.ilike.%${search}%`,
            `description.ilike.%${search}%`,
          ].join(",")
        );
    }

    query =
      query
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "system_name",
          {
            ascending: true,
          }
        );

    if (!all) {
      const from =
        (page - 1) *
        pageSize;

      const to =
        from +
        pageSize -
        1;

      query =
        query.range(
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
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        total:
          all
            ? (
                data?.length ||
                0
              )
            : (
                count || 0
              ),
        page,
        pageSize,
      }
    );
  } catch (error) {
    console.error(
      "PORTAL_SYSTEMS_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดระบบ Portal ได้",
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

export async function POST(
  req
) {
  try {
    const body =
      await req.json();

    const systemCode =
      normalizeText(
        body?.system_code
      ).toUpperCase();

    const systemName =
      normalizeText(
        body?.system_name
      );

    if (!systemCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุรหัสระบบ",
        },
        {
          status: 400,
        }
      );
    }

    if (!systemName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุชื่อระบบ",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicate,
      error:
        duplicateError,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .select("id")
      .eq(
        "system_code",
        systemCode
      )
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสระบบนี้มีอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    const payload = {
      system_code:
        systemCode,

      system_name:
        systemName,

      system_subtitle:
        normalizeNullableText(
          body?.system_subtitle
        ),

      description:
        normalizeNullableText(
          body?.description
        ),

      base_path:
        normalizeNullableText(
          body?.base_path
        ),

      permission_code:
        normalizeNullableText(
          body?.permission_code
        ),

      icon_code:
        normalizeNullableText(
          body?.icon_code
        ),

      sort_order:
        Number(
          body?.sort_order ??
            0
        ),

      status:
        normalizeStatus(
          body?.status
        ),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message:
          "เพิ่มระบบ Portal เรียบร้อยแล้ว",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PORTAL_SYSTEMS_POST_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถเพิ่มระบบ Portal ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  req
) {
  try {
    const body =
      await req.json();

    const id =
      normalizeText(
        body?.id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรหัสรายการ",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: current,
      error:
        currentError,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบระบบ Portal",
        },
        {
          status: 404,
        }
      );
    }

    const systemCode =
      body?.system_code !==
      undefined
        ? normalizeText(
            body.system_code
          ).toUpperCase()
        : current.system_code;

    const systemName =
      body?.system_name !==
      undefined
        ? normalizeText(
            body.system_name
          )
        : current.system_name;

    if (!systemCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุรหัสระบบ",
        },
        {
          status: 400,
        }
      );
    }

    if (!systemName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุชื่อระบบ",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicate,
      error:
        duplicateError,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .select("id")
      .eq(
        "system_code",
        systemCode
      )
      .neq(
        "id",
        id
      )
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสระบบนี้มีอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    const payload = {
      system_code:
        systemCode,

      system_name:
        systemName,

      system_subtitle:
        body?.system_subtitle !==
        undefined
          ? normalizeNullableText(
              body.system_subtitle
            )
          : current
              .system_subtitle,

      description:
        body?.description !==
        undefined
          ? normalizeNullableText(
              body.description
            )
          : current.description,

      base_path:
        body?.base_path !==
        undefined
          ? normalizeNullableText(
              body.base_path
            )
          : current.base_path,

      permission_code:
        body?.permission_code !==
        undefined
          ? normalizeNullableText(
              body.permission_code
            )
          : current
              .permission_code,

      icon_code:
        body?.icon_code !==
        undefined
          ? normalizeNullableText(
              body.icon_code
            )
          : current.icon_code,

      sort_order:
        body?.sort_order !==
        undefined
          ? Number(
              body.sort_order
            )
          : current.sort_order,

      status:
        body?.status !==
        undefined
          ? normalizeStatus(
              body.status
            )
          : current.status,

      updated_at:
        new Date()
          .toISOString(),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .update(payload)
      .eq(
        "id",
        id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message:
        "แก้ไขระบบ Portal เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "PORTAL_SYSTEMS_PATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไขระบบ Portal ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  req
) {
  try {
    const {
      searchParams,
    } = new URL(req.url);

    const body =
      await req
        .json()
        .catch(() => null);

    const id =
      normalizeText(
        body?.id ||
          searchParams.get(
            "id"
          )
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรหัสรายการ",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: current,
      error:
        currentError,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .select(
        "id, system_name"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบระบบ Portal",
        },
        {
          status: 404,
        }
      );
    }

    const {
      error,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .delete()
      .eq(
        "id",
        id
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message:
        "ลบระบบ Portal เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "PORTAL_SYSTEMS_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบระบบ Portal ได้",
      },
      {
        status: 500,
      }
    );
  }
}