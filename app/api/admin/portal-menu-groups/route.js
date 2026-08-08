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

    const systemId =
      searchParams
        .get("system_id")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const all =
      searchParams.get(
        "all"
      ) === "true";

    let query =
      supabaseAdmin
        .from(
          "portal_menu_groups"
        )
        .select(`
          id,
          system_id,
          group_code,
          group_name,
          group_subtitle,
          icon_code,
          sort_order,
          is_expanded_default,
          status,
          created_at,
          updated_at,
          portal_systems (
            id,
            system_code,
            system_name
          )
        `);

    if (systemId) {
      query =
        query.eq(
          "system_id",
          systemId
        );
    }

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    if (!all) {
      query =
        query.eq(
          "status",
          "active"
        );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "group_name",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data:
        data || [],
    });
  } catch (error) {
    console.error(
      "PORTAL_MENU_GROUPS_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลด Portal Menu Groups ได้",
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

    const systemId =
      normalizeText(
        body?.system_id
      );

    const groupCode =
      normalizeText(
        body?.group_code
      ).toUpperCase();

    const groupName =
      normalizeText(
        body?.group_name
      );

    if (!systemId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุระบบ",
        },
        {
          status: 400,
        }
      );
    }

    if (!groupCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุรหัส Group",
        },
        {
          status: 400,
        }
      );
    }

    if (!groupName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุชื่อ Group",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: system,
      error:
        systemError,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .select(
        "id, system_code"
      )
      .eq(
        "id",
        systemId
      )
      .maybeSingle();

    if (systemError) {
      throw systemError;
    }

    if (!system) {
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
      data: duplicate,
      error:
        duplicateError,
    } = await supabaseAdmin
      .from(
        "portal_menu_groups"
      )
      .select("id")
      .eq(
        "system_id",
        systemId
      )
      .eq(
        "group_code",
        groupCode
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
            "รหัส Group นี้มีอยู่แล้วในระบบนี้",
        },
        {
          status: 409,
        }
      );
    }

    const payload = {
      system_id:
        systemId,

      group_code:
        groupCode,

      group_name:
        groupName,

      group_subtitle:
        normalizeNullableText(
          body?.group_subtitle
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

      is_expanded_default:
        Boolean(
          body
            ?.is_expanded_default
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
        "portal_menu_groups"
      )
      .insert(
        payload
      )
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
          "เพิ่ม Portal Menu Group เรียบร้อยแล้ว",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PORTAL_MENU_GROUPS_POST_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถเพิ่ม Portal Menu Group ได้",
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
        "portal_menu_groups"
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
            "ไม่พบ Portal Menu Group",
        },
        {
          status: 404,
        }
      );
    }

    const systemId =
      body?.system_id !==
      undefined
        ? normalizeText(
            body.system_id
          )
        : current.system_id;

    const groupCode =
      body?.group_code !==
      undefined
        ? normalizeText(
            body.group_code
          ).toUpperCase()
        : current.group_code;

    const groupName =
      body?.group_name !==
      undefined
        ? normalizeText(
            body.group_name
          )
        : current.group_name;

    if (!systemId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุระบบ",
        },
        {
          status: 400,
        }
      );
    }

    if (!groupCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุรหัส Group",
        },
        {
          status: 400,
        }
      );
    }

    if (!groupName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุชื่อ Group",
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
        "portal_menu_groups"
      )
      .select("id")
      .eq(
        "system_id",
        systemId
      )
      .eq(
        "group_code",
        groupCode
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
            "รหัส Group นี้มีอยู่แล้วในระบบนี้",
        },
        {
          status: 409,
        }
      );
    }

    const payload = {
      system_id:
        systemId,

      group_code:
        groupCode,

      group_name:
        groupName,

      group_subtitle:
        body?.group_subtitle !==
        undefined
          ? normalizeNullableText(
              body.group_subtitle
            )
          : current
              .group_subtitle,

      icon_code:
        body?.icon_code !==
        undefined
          ? normalizeNullableText(
              body.icon_code
            )
          : current
              .icon_code,

      sort_order:
        body?.sort_order !==
        undefined
          ? Number(
              body.sort_order
            )
          : current.sort_order,

      is_expanded_default:
        body?.is_expanded_default !==
        undefined
          ? Boolean(
              body
                .is_expanded_default
            )
          : current
              .is_expanded_default,

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
        "portal_menu_groups"
      )
      .update(
        payload
      )
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
        "แก้ไข Portal Menu Group เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "PORTAL_MENU_GROUPS_PATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไข Portal Menu Group ได้",
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
        .catch(
          () => null
        );

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
        "portal_menu_groups"
      )
      .select(
        "id, group_name"
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
            "ไม่พบ Portal Menu Group",
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
        "portal_menu_groups"
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
        "ลบ Portal Menu Group เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "PORTAL_MENU_GROUPS_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบ Portal Menu Group ได้",
      },
      {
        status: 500,
      }
    );
  }
}