import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const MODULE = "ems.statutory_settings";
const GROUPS = ["tax", "social_security", "workmen_compensation", "other"];
const TYPES = ["number", "percentage", "currency", "text"];
const STATUSES = ["active", "inactive"];

const clean = (value) => String(value || "").trim();
const nullable = (value) => clean(value) || null;

function error(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalize(body = {}, includeCode = true) {
  const valueType = clean(body.value_type).toLowerCase();

  const data = {
    setting_group: clean(body.setting_group).toLowerCase(),
    setting_name_th: clean(body.setting_name_th),
    setting_name_en: nullable(body.setting_name_en),
    value_type: valueType,
    value_numeric:
      valueType === "text" || body.value_numeric === "" ||
      body.value_numeric === null || body.value_numeric === undefined
        ? null
        : Number(body.value_numeric),
    value_text: valueType === "text" ? nullable(body.value_text) : null,
    unit: nullable(body.unit),
    effective_from: clean(body.effective_from),
    effective_to: nullable(body.effective_to),
    status: clean(body.status || "active").toLowerCase(),
    description: nullable(body.description),
  };

  if (includeCode) {
    data.setting_code = clean(body.setting_code).toUpperCase();
  }

  return data;
}

function validate(data, requireCode = true) {
  if (!GROUPS.includes(data.setting_group)) return "กลุ่มค่าคงที่ไม่ถูกต้อง";

  if (requireCode) {
    if (!data.setting_code) return "กรุณากรอกรหัสค่าคงที่";
    if (!/^[A-Z0-9_.-]+$/.test(data.setting_code)) {
      return "รหัสค่าคงที่ใช้ได้เฉพาะ A-Z, 0-9, _, . และ -";
    }
  }

  if (!data.setting_name_th) return "กรุณากรอกชื่อค่าคงที่";
  if (!TYPES.includes(data.value_type)) return "ชนิดค่าไม่ถูกต้อง";

  if (data.value_type === "text") {
    if (!data.value_text) return "กรุณากรอกค่า";
  } else {
    if (!Number.isFinite(data.value_numeric)) return "ค่าตัวเลขไม่ถูกต้อง";
    if (
      data.value_type === "percentage" &&
      (data.value_numeric < 0 || data.value_numeric > 100)
    ) {
      return "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 ถึง 100";
    }
  }

  if (!data.effective_from) return "กรุณาเลือกวันที่เริ่มมีผล";
  if (data.effective_to && data.effective_to < data.effective_from) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม";
  }
  if (!STATUSES.includes(data.status)) return "สถานะไม่ถูกต้อง";

  return null;
}

async function summary() {
  const { data, error: dbError } = await supabaseAdmin
    .from("statutory_settings")
    .select("setting_group,status");

  if (dbError) throw dbError;

  const rows = data || [];

  return {
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status === "inactive").length,
    tax: rows.filter((row) => row.setting_group === "tax").length,
    social_security:
      rows.filter((row) => row.setting_group === "social_security").length,
  };
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(MODULE, "view");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const search = clean(searchParams.get("search"));
    const group = clean(searchParams.get("setting_group")).toLowerCase();
    const status = clean(searchParams.get("status")).toLowerCase();
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 20), 1),
      100
    );

    if (group && !GROUPS.includes(group)) return error("กลุ่มค่าคงที่ไม่ถูกต้อง", 400);
    if (status && !STATUSES.includes(status)) return error("สถานะไม่ถูกต้อง", 400);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("statutory_settings")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        [
          `setting_code.ilike.%${search}%`,
          `setting_name_th.ilike.%${search}%`,
          `setting_name_en.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (group) query = query.eq("setting_group", group);
    if (status) query = query.eq("status", status);

    query = query
      .order("effective_from", { ascending: false })
      .order("setting_code", { ascending: true })
      .range(from, to);

    const [listResult, summaryResult] = await Promise.all([query, summary()]);

    if (listResult.error) throw listResult.error;

    return NextResponse.json({
      success: true,
      data: listResult.data || [],
      summary: summaryResult,
      pagination: {
        page,
        pageSize,
        total: Number(listResult.count || 0),
      },
    });
  } catch (err) {
    console.error("GET_STATUTORY_SETTINGS_ERROR:", err);
    return error(err?.message || "ไม่สามารถโหลดค่าคงที่ได้");
  }
}

export async function POST(req) {
  try {
    const guard = await requireScopedAccess(MODULE, "create");
    if (!guard.ok) return guard.response;

    let body;
    try { body = await req.json(); }
    catch { return error("รูปแบบ Request Body ไม่ถูกต้อง", 400); }

    const payload = normalize(body, true);
    const validationError = validate(payload, true);

    if (validationError) return error(validationError, 400);

    const actorId =
      guard?.access?.user_account_id ||
      guard?.access?.id ||
      null;

    const { data, error: dbError } = await supabaseAdmin
      .from("statutory_settings")
      .insert({
        ...payload,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("*")
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        return error("รหัสค่าคงที่และวันที่เริ่มมีผลนี้มีอยู่แล้ว", 409);
      }
      throw dbError;
    }

    return NextResponse.json(
      { success: true, message: "เพิ่มค่าคงที่เรียบร้อยแล้ว", data },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST_STATUTORY_SETTING_ERROR:", err);
    return error(err?.message || "ไม่สามารถเพิ่มค่าคงที่ได้");
  }
}
