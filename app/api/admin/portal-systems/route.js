import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { PORTAL_PERMISSION } from "@/lib/portal/portalConstants";
import {
  cleanCode,
  cleanText,
  normalizePositiveInteger,
  isPostgresUniqueViolation,
} from "@/lib/portal/portalHelpers";

function fail(error, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function buildPayload(body = {}) {
  return {
    system_code: cleanCode(body.system_code, { upper: true }),
    module_code: cleanCode(body.module_code),
    system_name: cleanText(body.system_name),
    system_subtitle: cleanText(body.system_subtitle),
    description: cleanText(body.description),
    base_path: cleanText(body.base_path),
    permission_code: cleanText(body.permission_code),
    icon_code: cleanCode(body.icon_code),
    sort_order: normalizePositiveInteger(body.sort_order),
    status: body.status === "inactive" ? "inactive" : "active",
  };
}

export async function GET(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.VIEW);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    let query = supabaseAdmin
      .from("portal_systems")
      .select(
        `
          id,
          system_code,
          module_code,
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
        { count: "exact" }
      )
      .order("sort_order", { ascending: true })
      .order("system_code", { ascending: true });

    if (status) query = query.eq("status", status);

    if (search) {
      const safe = search.replace(/[%_,()]/g, " ").trim();
      if (safe) {
        query = query.or(
          `system_code.ilike.%${safe}%,system_name.ilike.%${safe}%,module_code.ilike.%${safe}%`
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
    console.error("GET_PORTAL_SYSTEMS_ERROR:", error);
    return fail(error?.message || "ไม่สามารถโหลด Portal Systems ได้", 500);
  }
}

export async function POST(req) {
  const auth = await requirePermission(PORTAL_PERMISSION.CREATE);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload.system_code) return fail("กรุณาระบุ system_code");
    if (!payload.system_name) return fail("กรุณาระบุ system_name");

    const { data, error } = await supabaseAdmin
      .from("portal_systems")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isPostgresUniqueViolation(error)) {
        return fail("รหัสระบบนี้มีอยู่แล้ว", 409);
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("CREATE_PORTAL_SYSTEM_ERROR:", error);
    return fail(error?.message || "เพิ่ม Portal System ไม่สำเร็จ", 500);
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
    if (!payload.system_code) return fail("กรุณาระบุ system_code");
    if (!payload.system_name) return fail("กรุณาระบุ system_name");

    const { data, error } = await supabaseAdmin
      .from("portal_systems")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isPostgresUniqueViolation(error)) {
        return fail("รหัสระบบนี้มีอยู่แล้ว", 409);
      }
      throw error;
    }

    if (!data) return fail("ไม่พบ Portal System", 404);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("UPDATE_PORTAL_SYSTEM_ERROR:", error);
    return fail(error?.message || "แก้ไข Portal System ไม่สำเร็จ", 500);
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
      .from("portal_systems")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_PORTAL_SYSTEM_ERROR:", error);
    return fail(error?.message || "ลบ Portal System ไม่สำเร็จ", 500);
  }
}
