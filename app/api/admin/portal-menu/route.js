import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAuthenticatedAccess } from "@/lib/auth/requirePortalAccess";
import { hasAccessPermission } from "@/lib/auth/applyAccessScope";

function canAccess(access, permissionCode) {
  if (!permissionCode) return true;
  return hasAccessPermission(access, permissionCode);
}

function mapItem(row, children = []) {
  return {
    key: `menu:${row.id}`,
    id: row.id,
    system_id: row.system_id,
    group_id: row.group_id,
    parent_id: row.parent_id,
    menu_code: row.menu_code,
    menu_type: row.menu_type,
    label: row.menu_name,
    subtitle: row.menu_subtitle,
    href: row.route_path,
    module_code: row.module_code,
    page_code: row.page_code,
    permission_code: row.permission_code,
    icon_code: row.icon_code,
    open_mode: row.open_mode,
    sort_order: row.sort_order,
    children,
  };
}

function buildItemTree(rows, access, parentId = null, lineage = new Set()) {
  return rows
    .filter((row) => (row.parent_id || null) === parentId)
    .sort((a, b) => (a.sort_order - b.sort_order) || a.menu_name.localeCompare(b.menu_name))
    .map((row) => {
      if (lineage.has(row.id)) return null;
      if (!canAccess(access, row.permission_code)) return null;

      const nextLineage = new Set(lineage);
      nextLineage.add(row.id);

      const children = buildItemTree(rows, access, row.id, nextLineage);

      if (row.menu_type === "group" && children.length === 0) {
        return null;
      }

      return mapItem(row, children);
    })
    .filter(Boolean);
}

export async function GET() {
  const auth = await requireAuthenticatedAccess();
  if (!auth.ok) return auth.response;

  try {
    const [systemsResult, groupsResult, itemsResult] = await Promise.all([
      supabaseAdmin
        .from("portal_systems")
        .select(`
          id,
          system_code,
          module_code,
          system_name,
          system_subtitle,
          base_path,
          permission_code,
          icon_code,
          sort_order,
          status
        `)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("system_code", { ascending: true }),

      supabaseAdmin
        .from("portal_menu_groups")
        .select(`
          id,
          system_id,
          group_code,
          group_name,
          group_subtitle,
          icon_code,
          sort_order,
          is_expanded_default,
          status
        `)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("group_code", { ascending: true }),

      supabaseAdmin
        .from("portal_menu_items")
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
          status
        `)
        .eq("status", "active")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
        .order("menu_code", { ascending: true }),
    ]);

    if (systemsResult.error) throw systemsResult.error;
    if (groupsResult.error) throw groupsResult.error;
    if (itemsResult.error) throw itemsResult.error;

    const systems = systemsResult.data || [];
    const groups = groupsResult.data || [];
    const items = itemsResult.data || [];
    const access = auth.access;

    const data = systems
      .filter((system) => canAccess(access, system.permission_code))
      .map((system) => {
        const systemItems = items.filter((item) => item.system_id === system.id);
        const systemGroups = groups.filter((group) => group.system_id === system.id);

        const groupedChildren = systemGroups
          .map((group) => {
            const groupRows = systemItems.filter((item) => item.group_id === group.id);
            const children = buildItemTree(groupRows, access, null);

            if (children.length === 0) return null;

            return {
              key: `group:${group.id}`,
              id: group.id,
              system_id: system.id,
              group_code: group.group_code,
              menu_type: "group",
              label: group.group_name,
              subtitle: group.group_subtitle,
              href: null,
              icon_code: group.icon_code,
              open_mode: "router",
              sort_order: group.sort_order,
              is_expanded_default: group.is_expanded_default,
              children,
            };
          })
          .filter(Boolean);

        const directRows = systemItems.filter((item) => !item.group_id);
        const directChildren = buildItemTree(directRows, access, null);

        const children = [...groupedChildren, ...directChildren].sort(
          (a, b) => (a.sort_order - b.sort_order) || a.label.localeCompare(b.label)
        );

        if (children.length === 0 && !system.base_path) return null;

        return {
          key: `system:${system.id}`,
          id: system.id,
          system_code: system.system_code,
          module_code: system.module_code,
          menu_type: children.length > 0 ? "group" : "link",
          label: system.system_name,
          subtitle: system.system_subtitle,
          href: children.length > 0 ? null : system.base_path,
          permission_code: system.permission_code,
          icon_code: system.icon_code,
          open_mode: "router",
          sort_order: system.sort_order,
          children,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET_PORTAL_MENU_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถโหลด Portal Menu ได้",
      },
      { status: 500 }
    );
  }
}
