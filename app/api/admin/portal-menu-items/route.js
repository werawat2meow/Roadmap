import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { PORTAL_PERMISSION } from "@/lib/portal/portalConstants";
import {
  cleanCode,
  cleanText,
  normalizePositiveInteger,
  isPostgresUniqueViolation,
  isPostgresForeignKeyViolation,
} from "@/lib/portal/portalHelpers";

function fail(error, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function buildPayload(body = {}) {
  const menuType = ["link", "group", "action"].includes(body.menu_type)
    ? body.menu_type
    : "link";

  const openMode = ["router", "hard", "external"].includes(body.open_mode)
    ? body.open_mode
    : "router";

  return {
    system_id: cleanText(body.system_id),
    group_id: cleanText(body.group_id),
    parent_id: cleanText(body.parent_id),
    menu_code: cleanCode(body.menu_code, { upper: true }),
    menu_name: cleanText(body.menu_name),
    menu_subtitle: cleanText(body.menu_subtitle),
    menu_type: menuType,
    route_path: menuType === "group" ? null : cleanText(body.route_path),
    module_code: cleanCode(body.module_code),
    page_code: cleanCode(body.page_code),
    permission_code: cleanText(body.permission_code),
    icon_code: cleanCode(body.icon_code),
    open_mode: openMode,
    sort_order: normalizePositiveInteger(body.sort_order),
    is_visible: body.is_visible !== false,
    status: body.status === "inactive" ? "inactive" : "active",
  };
}

async function validateRelations(payload, currentId = null) {
  const { data: system, error: systemError } = await supabaseAdmin
    .from("portal_systems")
    .select("id")
    .eq("id", payload.system_id)
    .maybeSingle();

  if (systemError) throw systemError;
  if (!system) return "ไม่พบ Portal System ที่เลือก";

  if (payload.group_id) {
    const { data: group, error } = await supabaseAdmin
      .from("portal_menu_groups")
      .select("id, system_id")
      .eq("id", payload.group_id)
      .maybeSingle();

    if (error) throw error;
    if (!group) return "ไม่พบ Menu Group ที่เลือก";
    if (group.system_id !== payload.system_id) return "Menu Group ไม่ได้อยู่ใน System ที่เลือก";
  }

  if (payload.parent_id) {
    if (currentId && payload.parent_id === currentId) {
      return "ไม่สามารถกำหนดเมนูเป็น Parent ของตัวเองได้";
    }

    const { data: parent, error } = await supabaseAdmin
      .from("portal_menu_items")
      .select("id, system_id, group_id, parent_id")
      .eq("id", payload.parent_id)
      .maybeSingle();

    if (error) throw error;
    if (!parent) return "ไม่พบ Parent Menu ที่เลือก";
    if (parent.system_id !== payload.system_id) return "Parent Menu ต้องอยู่ใน System เดียวกัน";

    if ((parent.group_id || null) !== (payload.group_id || null)) {
      return "Parent Menu ต้องอยู่ใน Menu Group เดียวกัน";
    }

    if (currentId) {
      let cursor = parent;
      const visited = new Set();

      while (cursor?.parent_id) {
        if (cursor.parent_id === currentId) {
          return "ไม่สามารถกำหนด Parent แบบวนลูป (cycle) ได้";
        }

        if (visited.has(cursor.parent_id)) break;
        visited.add(cursor.parent_id);

        const { data: next, error: nextError } = await supabaseAdmin
          .from("portal_menu_items")
          .select("id, parent_id")
          .eq("id", cursor.parent_id)
          .maybeSingle();

        if (nextError) throw nextError;
        cursor = next;
      }
    }
  }

  if (payload.menu_type !== "group" && !payload.route_path) {
    return "เมนูประเภท Link/Action ต้องระบุ Route Path";
  }

  if (
    payload.open_mode === "external" &&
    payload.route_path &&
    !/^https?:\/\//i.test(payload.route_path)
  ) {
    return "External URL ต้องขึ้นต้นด้วย http:// หรือ https://";
  }

  return null;
}

export async function GET(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.VIEW);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const systemId = searchParams.get("system_id")?.trim() || "";
    const groupId = searchParams.get("group_id")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    let query = supabaseAdmin
      .from("portal_menu_items")
      .select(
        `
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
          updated_at
        `,
        { count: "exact" }
      )
      .order("sort_order", { ascending: true })
      .order("menu_code", { ascending: true });

    if (systemId) query = query.eq("system_id", systemId);
    if (groupId) query = query.eq("group_id", groupId);
    if (status) query = query.eq("status", status);

    if (search) {
      const safe = search.replace(/[%_,()]/g, " ").trim();
      if (safe) {
        query = query.or(
          `menu_code.ilike.%${safe}%,menu_name.ilike.%${safe}%,route_path.ilike.%${safe}%,permission_code.ilike.%${safe}%`
        );
      }
    }

    if (!all) {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page: all ? 1 : page,
      pageSize: all ? data?.length || 0 : pageSize,
    });
  } catch (error) {
    console.error("GET_PORTAL_MENU_ITEMS_ERROR:", error);
    return fail(error?.message || "ไม่สามารถโหลด Menu Items ได้", 500);
  }
}

export async function POST(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.CREATE);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload.system_id) return fail("กรุณาเลือกระบบ");
    if (!payload.menu_code) return fail("กรุณาระบุ menu_code");
    if (!payload.menu_name) return fail("กรุณาระบุ menu_name");

    const relationError = await validateRelations(payload);
    if (relationError) return fail(relationError);

    const { data, error } = await supabaseAdmin
      .from("portal_menu_items")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isPostgresUniqueViolation(error)) return fail("Menu Code นี้มีอยู่แล้วใน System", 409);
      if (isPostgresForeignKeyViolation(error)) return fail("System / Group / Parent ไม่ถูกต้อง", 400);
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("CREATE_PORTAL_MENU_ITEM_ERROR:", error);
    return fail(error?.message || "เพิ่ม Menu Item ไม่สำเร็จ", 500);
  }
}

export async function PATCH(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.EDIT);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const id = cleanText(body.id);
    if (!id) return fail("กรุณาระบุ id");

    const payload = buildPayload(body);
    if (!payload.system_id) return fail("กรุณาเลือกระบบ");
    if (!payload.menu_code) return fail("กรุณาระบุ menu_code");
    if (!payload.menu_name) return fail("กรุณาระบุ menu_name");

    const relationError = await validateRelations(payload, id);
    if (relationError) return fail(relationError);

    const { data, error } = await supabaseAdmin
      .from("portal_menu_items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isPostgresUniqueViolation(error)) return fail("Menu Code นี้มีอยู่แล้วใน System", 409);
      if (isPostgresForeignKeyViolation(error)) return fail("System / Group / Parent ไม่ถูกต้อง", 400);
      throw error;
    }

    if (!data) return fail("ไม่พบ Menu Item", 404);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("UPDATE_PORTAL_MENU_ITEM_ERROR:", error);
    return fail(error?.message || "แก้ไข Menu Item ไม่สำเร็จ", 500);
  }
}

export async function DELETE(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.DELETE);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const id = cleanText(body.id);
    if (!id) return fail("กรุณาระบุ id");

    const { error } = await supabaseAdmin
      .from("portal_menu_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_PORTAL_MENU_ITEM_ERROR:", error);
    return fail(error?.message || "ลบ Menu Item ไม่สำเร็จ", 500);
  }
}
