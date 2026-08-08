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

function sortByOrder(
  rows = []
) {
  return [...rows].sort(
    (first, second) => {
      const firstOrder =
        Number(
          first?.sort_order ??
            0
        );

      const secondOrder =
        Number(
          second?.sort_order ??
            0
        );

      if (
        firstOrder !==
        secondOrder
      ) {
        return (
          firstOrder -
          secondOrder
        );
      }

      const firstName =
        normalizeText(
          first?.menu_name ||
            first?.group_name ||
            first?.system_name
        );

      const secondName =
        normalizeText(
          second?.menu_name ||
            second?.group_name ||
            second?.system_name
        );

      return firstName.localeCompare(
        secondName
      );
    }
  );
}

/* =========================================================
   Map DB Item -> Portal Item
========================================================= */

function mapMenuItem(
  item
) {
  return {
    id:
      item.id,

    key:
      item.menu_code ||
      item.id,

    system_id:
      item.system_id,

    group_id:
      item.group_id,

    parent_id:
      item.parent_id,

    menu_code:
      item.menu_code,

    label:
      item.menu_name,

    subtitle:
      item.menu_subtitle ||
      "",

    menu_type:
      item.menu_type ||
      "link",

    href:
      item.route_path ||
      null,

    permission:
      item.permission_code ||
      null,

    icon_code:
      item.icon_code ||
      null,

    open_mode:
      item.open_mode ||
      "router",

    sort_order:
      Number(
        item.sort_order ??
          0
      ),

    is_visible:
      item.is_visible !==
      false,

    status:
      item.status,

    children: [],
  };
}

/* =========================================================
   Build Nested Menu Tree

   parent_id:
   Settings
      ├─ Employee Code
      ├─ Running Number
      └─ Employee Status
========================================================= */

function buildMenuTree(
  items = []
) {
  const mappedItems =
    sortByOrder(
      items
    ).map(
      mapMenuItem
    );

  const byId =
    new Map();

  const roots = [];

  for (
    const item of
      mappedItems
  ) {
    byId.set(
      item.id,
      item
    );
  }

  for (
    const item of
      mappedItems
  ) {
    if (
      item.parent_id &&
      byId.has(
        item.parent_id
      )
    ) {
      byId
        .get(
          item.parent_id
        )
        .children.push(
          item
        );

      continue;
    }

    roots.push(
      item
    );
  }

  const sortRecursive =
    (rows = []) => {
      rows.sort(
        (first, second) =>
          Number(
            first.sort_order ??
              0
          ) -
          Number(
            second.sort_order ??
              0
          )
      );

      for (
        const item of rows
      ) {
        if (
          Array.isArray(
            item.children
          ) &&
          item.children
            .length > 0
        ) {
          sortRecursive(
            item.children
          );
        }
      }
    };

  sortRecursive(
    roots
  );

  return roots;
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
    } = new URL(
      req.url
    );

    const systemCode =
      searchParams
        .get(
          "system_code"
        )
        ?.trim()
        .toUpperCase() ||
      "";

    const includeInactive =
      searchParams.get(
        "include_inactive"
      ) === "true";

    /* =====================================================
       1. Systems
    ===================================================== */

    let systemsQuery =
      supabaseAdmin
        .from(
          "portal_systems"
        )
        .select(`
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
        `);

    if (
      !includeInactive
    ) {
      systemsQuery =
        systemsQuery.eq(
          "status",
          "active"
        );
    }

    if (systemCode) {
      systemsQuery =
        systemsQuery.eq(
          "system_code",
          systemCode
        );
    }

    const {
      data: systems,
      error:
        systemsError,
    } = await systemsQuery
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

    if (systemsError) {
      throw systemsError;
    }

    if (
      !Array.isArray(
        systems
      ) ||
      systems.length === 0
    ) {
      return NextResponse.json({
        success: true,
        data: [],
        systems: [],
      });
    }

    const systemIds =
      systems.map(
        (system) =>
          system.id
      );

    /* =====================================================
       2. Groups
    ===================================================== */

    let groupsQuery =
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
          updated_at
        `)
        .in(
          "system_id",
          systemIds
        );

    if (
      !includeInactive
    ) {
      groupsQuery =
        groupsQuery.eq(
          "status",
          "active"
        );
    }

    const {
      data: groups,
      error:
        groupsError,
    } = await groupsQuery
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

    if (groupsError) {
      throw groupsError;
    }

    /* =====================================================
       3. Items
    ===================================================== */

    let itemsQuery =
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
          permission_code,
          icon_code,
          open_mode,
          sort_order,
          is_visible,
          status,
          created_at,
          updated_at
        `)
        .in(
          "system_id",
          systemIds
        );

    if (
      !includeInactive
    ) {
      itemsQuery =
        itemsQuery
          .eq(
            "status",
            "active"
          )
          .eq(
            "is_visible",
            true
          );
    }

    const {
      data: items,
      error:
        itemsError,
    } = await itemsQuery
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

    if (itemsError) {
      throw itemsError;
    }

    /* =====================================================
       4. Build Portal Menus

       Output:
       Dashboard
       Employee Management
         ├─ Overview
         ├─ Employee List
         ├─ Add New Employee
         └─ Settings
             ├─ Employee Code
             └─ Running Number
    ===================================================== */

    const portalMenus =
      [];

    const sortedSystems =
      sortByOrder(
        systems
      );

    for (
      const system of
        sortedSystems
    ) {
      const systemGroups =
        sortByOrder(
          (
            groups || []
          ).filter(
            (group) =>
              group.system_id ===
              system.id
          )
        );

      const systemItems =
        (
          items || []
        ).filter(
          (item) =>
            item.system_id ===
            system.id
        );

      /* ===================================================
         Ungrouped Items

         เช่น Dashboard
      =================================================== */

      const ungroupedItems =
        systemItems.filter(
          (item) =>
            !item.group_id
        );

      const ungroupedTree =
        buildMenuTree(
          ungroupedItems
        );

      for (
        const item of
          ungroupedTree
      ) {
        portalMenus.push({
          ...item,

          system_code:
            system.system_code,

          system_name:
            system.system_name,

          system_permission:
            system.permission_code,

          system_status:
            system.status,
        });
      }

      /* ===================================================
         Groups

         เช่น Employee Management
      =================================================== */

      for (
        const group of
          systemGroups
      ) {
        const groupItems =
          systemItems.filter(
            (item) =>
              item.group_id ===
              group.id
          );

        const tree =
          buildMenuTree(
            groupItems
          );

        /*
         * Group ที่ไม่มี Item
         * ไม่แสดงใน Sidebar
         * ยกเว้น include_inactive=true
         */
        if (
          tree.length === 0 &&
          !includeInactive
        ) {
          continue;
        }

        portalMenus.push({
          id:
            group.id,

          key:
            group.group_code ||
            group.id,

          system_id:
            system.id,

          system_code:
            system.system_code,

          system_name:
            system.system_name,

          system_permission:
            system.permission_code,

          group_code:
            group.group_code,

          label:
            group.group_name,

          subtitle:
            group.group_subtitle ||
            system.system_subtitle ||
            "",

          icon_code:
            group.icon_code ||
            system.icon_code ||
            null,

          menu_type:
            "group",

          href: null,

          permission:
            system.permission_code ||
            null,

          open_mode:
            "router",

          sort_order:
            Number(
              group.sort_order ??
                0
            ),

          expanded_default:
            Boolean(
              group
                .is_expanded_default
            ),

          status:
            group.status,

          children:
            tree,
        });
      }
    }

    /* =====================================================
       5. Systems metadata
    ===================================================== */

    const systemResult =
      sortedSystems.map(
        (system) => ({
          id:
            system.id,

          system_code:
            system.system_code,

          system_name:
            system.system_name,

          system_subtitle:
            system.system_subtitle,

          description:
            system.description,

          base_path:
            system.base_path,

          permission_code:
            system.permission_code,

          icon_code:
            system.icon_code,

          sort_order:
            Number(
              system.sort_order ??
                0
            ),

          status:
            system.status,
        })
      );

    /* =====================================================
       Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      data:
        portalMenus,

      systems:
        systemResult,
    });
  } catch (error) {
    console.error(
      "PORTAL_MENU_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลด Portal Menu ได้",
      },
      {
        status: 500,
      }
    );
  }
}