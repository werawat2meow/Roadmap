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

function normalizeMenuType(
  value
) {
  const menuType =
    normalizeText(
      value
    ).toLowerCase();

  if (
    [
      "link",
      "group",
      "action",
    ].includes(
      menuType
    )
  ) {
    return menuType;
  }

  return "link";
}

function normalizeOpenMode(
  value
) {
  const openMode =
    normalizeText(
      value
    ).toLowerCase();

  if (
    [
      "router",
      "hard",
      "external",
    ].includes(
      openMode
    )
  ) {
    return openMode;
  }

  return "router";
}

function normalizeBoolean(
  value,
  defaultValue = true
) {
  if (
    value === undefined ||
    value === null
  ) {
    return defaultValue;
  }

  return Boolean(value);
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

    const groupId =
      searchParams
        .get("group_id")
        ?.trim() || "";

    const parentId =
      searchParams
        .get("parent_id")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const all =
      searchParams.get(
        "all"
      ) === "true";

    let query =
      supabaseAdmin
        .from(
          "portal_menu_items"
        )
        .select(`
          id,
          system_id,
          group_id,
          parent_id,
          menu_code,
          menu_name,
          menu_subtitle,
          menu_type,
          route_path,
          module_code,
          page_code,
          permission_code,
          icon_code,
          open_mode,
          sort_order,
          is_visible,
          status,
          created_at,
          updated_at,
          portal_systems (
            id,
            system_code,
            system_name
          ),
          portal_menu_groups (
            id,
            group_code,
            group_name
          )
        `);

    if (systemId) {
      query =
        query.eq(
          "system_id",
          systemId
        );
    }

    if (groupId) {
      query =
        query.eq(
          "group_id",
          groupId
        );
    }

    if (parentId) {
      query =
        query.eq(
          "parent_id",
          parentId
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
        query
          .eq(
            "status",
            "active"
          )
          .eq(
            "is_visible",
            true
          );
    }

    if (search) {
      query =
        query.or(
          [
            `menu_code.ilike.%${search}%`,
            `menu_name.ilike.%${search}%`,
            `menu_subtitle.ilike.%${search}%`,
            `route_path.ilike.%${search}%`,
            `module_code.ilike.%${search}%`,
            `page_code.ilike.%${search}%`,
            `permission_code.ilike.%${search}%`,
          ].join(",")
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
        "menu_name",
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
      "PORTAL_MENU_ITEMS_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลด Portal Menu Items ได้",
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

    const groupId =
      normalizeNullableText(
        body?.group_id
      );

    const parentId =
      normalizeNullableText(
        body?.parent_id
      );

    const menuCode =
      normalizeText(
        body?.menu_code
      ).toUpperCase();

    const menuName =
      normalizeText(
        body?.menu_name
      );

    const menuType =
      normalizeMenuType(
        body?.menu_type
      );

    const openMode =
      normalizeOpenMode(
        body?.open_mode
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

    if (!menuCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุรหัสเมนู",
        },
        {
          status: 400,
        }
      );
    }

    if (!menuName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุชื่อเมนู",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       Validate System
    ===================================================== */

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

    /* =====================================================
       Validate Group
    ===================================================== */

    if (groupId) {
      const {
        data: group,
        error:
          groupError,
      } = await supabaseAdmin
        .from(
          "portal_menu_groups"
        )
        .select(
          "id, system_id"
        )
        .eq(
          "id",
          groupId
        )
        .maybeSingle();

      if (groupError) {
        throw groupError;
      }

      if (!group) {
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

      if (
        group.system_id !==
        systemId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Group ไม่ได้อยู่ในระบบเดียวกัน",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       Validate Parent
    ===================================================== */

    if (parentId) {
      const {
        data: parent,
        error:
          parentError,
      } = await supabaseAdmin
        .from(
          "portal_menu_items"
        )
        .select(
          `
          id,
          system_id,
          group_id,
          menu_type
        `
        )
        .eq(
          "id",
          parentId
        )
        .maybeSingle();

      if (parentError) {
        throw parentError;
      }

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่พบ Parent Menu",
          },
          {
            status: 404,
          }
        );
      }

      if (
        parent.system_id !==
        systemId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Parent Menu ไม่ได้อยู่ในระบบเดียวกัน",
          },
          {
            status: 400,
          }
        );
      }

      if (
        groupId &&
        parent.group_id &&
        parent.group_id !==
          groupId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Parent Menu ไม่ได้อยู่ใน Group เดียวกัน",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       Duplicate Menu Code
    ===================================================== */

    const {
      data: duplicate,
      error:
        duplicateError,
    } = await supabaseAdmin
      .from(
        "portal_menu_items"
      )
      .select("id")
      .eq(
        "system_id",
        systemId
      )
      .eq(
        "menu_code",
        menuCode
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
            "รหัสเมนูนี้มีอยู่แล้วในระบบนี้",
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       Validate Route
    ===================================================== */

    const routePath =
      normalizeNullableText(
        body?.route_path
      );

    if (
      menuType === "link" &&
      !routePath
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "เมนูประเภท Link ต้องระบุ Route",
        },
        {
          status: 400,
        }
      );
    }

    if (
      openMode ===
        "external" &&
      routePath &&
      !/^https?:\/\//i.test(
        routePath
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "External URL ต้องขึ้นต้นด้วย http:// หรือ https://",
        },
        {
          status: 400,
        }
      );
    }

    const payload = {
      system_id:
        systemId,

      group_id:
        groupId,

      parent_id:
        parentId,

      menu_code:
        menuCode,

      menu_name:
        menuName,

      menu_subtitle:
        normalizeNullableText(
          body?.menu_subtitle
        ),

      menu_type:
        menuType,

      route_path:
        routePath,

      module_code:
        normalizeNullableText(
          body?.module_code
        ),

        page_code:
        normalizeNullableText(
          body?.page_code
        ),

      permission_code:
        normalizeNullableText(
          body?.permission_code
        ),

      icon_code:
        normalizeNullableText(
          body?.icon_code
        ),

      open_mode:
        openMode,

      sort_order:
        Number(
          body?.sort_order ??
            0
        ),

      is_visible:
        normalizeBoolean(
          body?.is_visible,
          true
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
        "portal_menu_items"
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
          "เพิ่ม Portal Menu Item เรียบร้อยแล้ว",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PORTAL_MENU_ITEMS_POST_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถเพิ่ม Portal Menu Item ได้",
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
        "portal_menu_items"
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
            "ไม่พบ Portal Menu Item",
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

    const groupId =
      body?.group_id !==
      undefined
        ? normalizeNullableText(
            body.group_id
          )
        : current.group_id;

    const parentId =
      body?.parent_id !==
      undefined
        ? normalizeNullableText(
            body.parent_id
          )
        : current.parent_id;

    const menuCode =
      body?.menu_code !==
      undefined
        ? normalizeText(
            body.menu_code
          ).toUpperCase()
        : current.menu_code;

    const menuName =
      body?.menu_name !==
      undefined
        ? normalizeText(
            body.menu_name
          )
        : current.menu_name;

    const menuType =
      body?.menu_type !==
      undefined
        ? normalizeMenuType(
            body.menu_type
          )
        : current.menu_type;

    const openMode =
      body?.open_mode !==
      undefined
        ? normalizeOpenMode(
            body.open_mode
          )
        : current.open_mode;

    const routePath =
      body?.route_path !==
      undefined
        ? normalizeNullableText(
            body.route_path
          )
        : current.route_path;

    

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

    if (!menuCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุรหัสเมนู",
        },
        {
          status: 400,
        }
      );
    }

    if (!menuName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุชื่อเมนู",
        },
        {
          status: 400,
        }
      );
    }

    if (
      parentId === id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "เมนูไม่สามารถเป็น Parent ของตัวเองได้",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       Validate System
    ===================================================== */

    const {
      data: system,
      error:
        systemError,
    } = await supabaseAdmin
      .from(
        "portal_systems"
      )
      .select("id")
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

    /* =====================================================
       Validate Group
    ===================================================== */

    if (groupId) {
      const {
        data: group,
        error:
          groupError,
      } = await supabaseAdmin
        .from(
          "portal_menu_groups"
        )
        .select(
          "id, system_id"
        )
        .eq(
          "id",
          groupId
        )
        .maybeSingle();

      if (groupError) {
        throw groupError;
      }

      if (!group) {
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

      if (
        group.system_id !==
        systemId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Group ไม่ได้อยู่ในระบบเดียวกัน",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       Validate Parent
    ===================================================== */

    if (parentId) {
      const {
        data: parent,
        error:
          parentError,
      } = await supabaseAdmin
        .from(
          "portal_menu_items"
        )
        .select(
          `
          id,
          system_id,
          group_id
        `
        )
        .eq(
          "id",
          parentId
        )
        .maybeSingle();

      if (parentError) {
        throw parentError;
      }

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่พบ Parent Menu",
          },
          {
            status: 404,
          }
        );
      }

      if (
        parent.system_id !==
        systemId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Parent Menu ไม่ได้อยู่ในระบบเดียวกัน",
          },
          {
            status: 400,
          }
        );
      }

      if (
        groupId &&
        parent.group_id &&
        parent.group_id !==
          groupId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Parent Menu ไม่ได้อยู่ใน Group เดียวกัน",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       Duplicate
    ===================================================== */

    const {
      data: duplicate,
      error:
        duplicateError,
    } = await supabaseAdmin
      .from(
        "portal_menu_items"
      )
      .select("id")
      .eq(
        "system_id",
        systemId
      )
      .eq(
        "menu_code",
        menuCode
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
            "รหัสเมนูนี้มีอยู่แล้วในระบบนี้",
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       Validate Route
    ===================================================== */

    if (
      menuType === "link" &&
      !routePath
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "เมนูประเภท Link ต้องระบุ Route",
        },
        {
          status: 400,
        }
      );
    }

    if (
      openMode ===
        "external" &&
      routePath &&
      !/^https?:\/\//i.test(
        routePath
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "External URL ต้องขึ้นต้นด้วย http:// หรือ https://",
        },
        {
          status: 400,
        }
      );
    }

    const payload = {
      system_id:
        systemId,

      group_id:
        groupId,

      parent_id:
        parentId,

      menu_code:
        menuCode,

      menu_name:
        menuName,

      menu_subtitle:
        body?.menu_subtitle !==
        undefined
          ? normalizeNullableText(
              body.menu_subtitle
            )
          : current
              .menu_subtitle,

      menu_type:
        menuType,

      route_path:
        routePath,

      module_code:
        body?.module_code !==
        undefined
          ? normalizeNullableText(
              body.module_code
            )
          : current.module_code,

      page_code:
        body?.page_code !==
        undefined
          ? normalizeNullableText(
              body.page_code
            )
          : current.page_code,

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

      open_mode:
        openMode,

      sort_order:
        body?.sort_order !==
        undefined
          ? Number(
              body.sort_order
            )
          : current.sort_order,

      is_visible:
        body?.is_visible !==
        undefined
          ? normalizeBoolean(
              body.is_visible,
              true
            )
          : current.is_visible,

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
        "portal_menu_items"
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
        "แก้ไข Portal Menu Item เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "PORTAL_MENU_ITEMS_PATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไข Portal Menu Item ได้",
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
        "portal_menu_items"
      )
      .select(
        `
        id,
        menu_name
      `
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
            "ไม่พบ Portal Menu Item",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       Child Count

       parent_id FK เป็น on delete cascade
       แต่เช็กไว้เพื่อให้ UI แจ้งเตือนได้
    ===================================================== */

    const {
      count:
        childCount,
      error:
        childCountError,
    } = await supabaseAdmin
      .from(
        "portal_menu_items"
      )
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "parent_id",
        id
      );

    if (childCountError) {
      throw childCountError;
    }

    const {
      error,
    } = await supabaseAdmin
      .from(
        "portal_menu_items"
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

      deleted_children:
        childCount || 0,

      message:
        childCount > 0
          ? `ลบเมนูและเมนูย่อย ${childCount} รายการเรียบร้อยแล้ว`
          : "ลบ Portal Menu Item เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "PORTAL_MENU_ITEMS_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบ Portal Menu Item ได้",
      },
      {
        status: 500,
      }
    );
  }
}