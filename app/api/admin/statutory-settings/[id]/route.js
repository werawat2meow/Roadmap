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

function normalize(body = {}) {
  const valueType = clean(body.value_type).toLowerCase();

  return {
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
}

function validate(data) {
  if (!GROUPS.includes(data.setting_group)) return "กลุ่มค่าคงที่ไม่ถูกต้อง";
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

async function load(id) {
  return supabaseAdmin
    .from("statutory_settings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
}

export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE, "view");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data, error: dbError } = await load(id);

    if (dbError) throw dbError;
    if (!data) return error("ไม่พบค่าคงที่ที่เลือก", 404);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET_STATUTORY_SETTING_ERROR:", err);
    return error(err?.message || "ไม่สามารถโหลดค่าคงที่ได้");
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE, "edit");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: existing, error: loadError } = await load(id);

    if (loadError) throw loadError;
    if (!existing) return error("ไม่พบค่าคงที่ที่เลือก", 404);

    let body;
    try { body = await req.json(); }
    catch { return error("รูปแบบ Request Body ไม่ถูกต้อง", 400); }

    const payload = normalize(body);
    const validationError = validate(payload);

    if (validationError) return error(validationError, 400);

    const actorId =
      guard?.access?.user_account_id ||
      guard?.access?.id ||
      null;

    const { data, error: dbError } = await supabaseAdmin
      .from("statutory_settings")
      .update({
        ...payload,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        return error("รหัสค่าคงที่และวันที่เริ่มมีผลนี้มีอยู่แล้ว", 409);
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขค่าคงที่เรียบร้อยแล้ว",
      data,
    });
  } catch (err) {
    console.error("PATCH_STATUTORY_SETTING_ERROR:", err);
    return error(err?.message || "ไม่สามารถแก้ไขค่าคงที่ได้");
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE, "delete");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: existing, error: loadError } = await load(id);

    if (loadError) throw loadError;
    if (!existing) return error("ไม่พบค่าคงที่ที่เลือก", 404);

    const { error: dbError } = await supabaseAdmin
      .from("statutory_settings")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      message: "ลบค่าคงที่เรียบร้อยแล้ว",
    });
  } catch (err) {
    console.error("DELETE_STATUTORY_SETTING_ERROR:", err);

    if (err?.code === "23503") {
      return error(
        "ไม่สามารถลบค่าคงที่นี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
        409
      );
    }

    return error(err?.message || "ไม่สามารถลบค่าคงที่ได้");
  }
}
