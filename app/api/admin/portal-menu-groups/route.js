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
  return {
    system_id: cleanText(body.system_id),
    group_code: cleanCode(body.group_code, { upper: true }),
    group_name: cleanText(body.group_name),
    group_subtitle: cleanText(body.group_subtitle),
    icon_code: cleanCode(body.icon_code),
    sort_order: normalizePositiveInteger(body.sort_order),
    is_expanded_default: Boolean(body.is_expanded_default),
    status: body.status === "inactive" ? "inactive" : "active",
  };
}

export async function GET(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.VIEW);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const systemId = searchParams.get("system_id")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    let query = supabaseAdmin
      .from("portal_menu_groups")
      .select(
        `
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
        `,
        { count: "exact" }
      )
      .order("sort_order", { ascending: true })
      .order("group_code", { ascending: true });

    if (systemId) query = query.eq("system_id", systemId);
    if (status) query = query.eq("status", status);

    if (search) {
      const safe = search.replace(/[%_,()]/g, " ").trim();
      if (safe) {
        query = query.or(`group_code.ilike.%${safe}%,group_name.ilike.%${safe}%`);
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
    console.error("GET_PORTAL_MENU_GROUPS_ERROR:", error);
    return fail(error?.message || "ไม่สามารถโหลด Menu Groups ได้", 500);
  }
}

export async function POST(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.CREATE);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload.system_id) return fail("กรุณาเลือกระบบ");
    if (!payload.group_code) return fail("กรุณาระบุ group_code");
    if (!payload.group_name) return fail("กรุณาระบุ group_name");

    const { data, error } = await supabaseAdmin
      .from("portal_menu_groups")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isPostgresUniqueViolation(error)) return fail("รหัส Group นี้มีอยู่แล้วในระบบ", 409);
      if (isPostgresForeignKeyViolation(error)) return fail("ไม่พบ Portal System ที่เลือก", 400);
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("CREATE_PORTAL_MENU_GROUP_ERROR:", error);
    return fail(error?.message || "เพิ่ม Menu Group ไม่สำเร็จ", 500);
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
    if (!payload.group_code) return fail("กรุณาระบุ group_code");
    if (!payload.group_name) return fail("กรุณาระบุ group_name");

    const { data, error } = await supabaseAdmin
      .from("portal_menu_groups")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isPostgresUniqueViolation(error)) return fail("รหัส Group นี้มีอยู่แล้วในระบบ", 409);
      if (isPostgresForeignKeyViolation(error)) return fail("ข้อมูล System / Group ไม่ถูกต้อง", 400);
      throw error;
    }

    if (!data) return fail("ไม่พบ Menu Group", 404);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("UPDATE_PORTAL_MENU_GROUP_ERROR:", error);
    return fail(error?.message || "แก้ไข Menu Group ไม่สำเร็จ", 500);
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
      .from("portal_menu_groups")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_PORTAL_MENU_GROUP_ERROR:", error);
    return fail(error?.message || "ลบ Menu Group ไม่สำเร็จ", 500);
  }
}
