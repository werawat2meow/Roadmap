import { supabaseAdmin } from "@/lib/supabaseServer";

export const POLICY_CATEGORIES = [
  "general",
  "hr",
  "employment",
  "conduct",
  "attendance",
  "leave",
  "compensation",
  "benefit",
  "safety",
  "compliance",
  "pdpa",
  "other",
];

export const POLICY_STATUSES = [
  "draft",
  "published",
  "archived",
];

export function cleanText(value) {
  return String(value || "").trim();
}

export function cleanNullableText(value) {
  const valueText = cleanText(value);
  return valueText || null;
}

export function cleanCode(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cleanBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function cleanDate(value) {
  return cleanText(value) || null;
}

export function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("%", "")
    .replaceAll("*", "")
    .trim();
}

export function jsonError(message, status = 500) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}

export function getActorId(guard) {
  return (
    guard?.access?.user_account_id ||
    guard?.access?.user?.id ||
    guard?.user?.id ||
    null
  );
}

export function getErrorStatus(error) {
  if (!error) return 500;
  if (error.code === "23505") return 409;

  if (
    ["23503", "23514", "23502", "22P02"].includes(
      error.code
    )
  ) {
    return 400;
  }

  return 500;
}

export function mapDatabaseError(error) {
  if (!error) return "เกิดข้อผิดพลาดในฐานข้อมูล";

  if (error.code === "23505") {
    return "รหัสนโยบายซ้ำในบริษัทนี้";
  }

  if (error.code === "23503") {
    return "ข้อมูลนโยบายถูกอ้างอิง หรือไม่พบข้อมูลที่เกี่ยวข้อง";
  }

  if (error.code === "23514") {
    return "ข้อมูลนโยบายไม่ผ่านเงื่อนไข";
  }

  if (error.code === "23502") {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (error.code === "22P02") {
    return "รูปแบบ UUID หรือข้อมูลไม่ถูกต้อง";
  }

  return error.message || "เกิดข้อผิดพลาดในฐานข้อมูล";
}

export function normalizePayload(body = {}, current = null) {
  return {
    company_id: cleanText(
      body.company_id ?? current?.company_id
    ),

    policy_code: cleanCode(
      body.policy_code ?? current?.policy_code
    ),

    policy_name: cleanText(
      body.policy_name ?? current?.policy_name
    ),

    policy_category:
      cleanText(
        body.policy_category ?? current?.policy_category
      ) || "general",

    description: cleanNullableText(
      body.description ?? current?.description
    ),

    owner_department: cleanNullableText(
      body.owner_department ?? current?.owner_department
    ),

    status:
      cleanText(body.status ?? current?.status) || "draft",

    effective_date: cleanDate(
      body.effective_date ?? current?.effective_date
    ),

    expire_date: cleanDate(
      body.expire_date ?? current?.expire_date
    ),

    is_mandatory: cleanBoolean(
      body.is_mandatory ?? current?.is_mandatory,
      false
    ),

    version_title: cleanNullableText(
      body.version_title ??
        current?.current_version?.version_title
    ),

    content: cleanText(
      body.content ?? current?.current_version?.content ?? ""
    ),

    change_summary: cleanNullableText(
      body.change_summary ??
        current?.current_version?.change_summary
    ),
  };
}

export function validatePayload(payload) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload.policy_code) {
    return "กรุณากรอกรหัสนโยบาย";
  }

  if (!payload.policy_name) {
    return "กรุณากรอกชื่อนโยบาย";
  }

  if (!POLICY_CATEGORIES.includes(payload.policy_category)) {
    return "หมวดหมู่นโยบายไม่ถูกต้อง";
  }

  if (!POLICY_STATUSES.includes(payload.status)) {
    return "สถานะนโยบายไม่ถูกต้อง";
  }

  if (
    payload.status === "published" &&
    !payload.effective_date
  ) {
    return "นโยบาย Published ต้องระบุวันที่มีผล";
  }

  if (
    payload.effective_date &&
    payload.expire_date &&
    payload.expire_date < payload.effective_date
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่มีผล";
  }

  if (!payload.content) {
    return "กรุณากรอกเนื้อหานโยบาย";
  }

  return null;
}

export async function loadPolicy(id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("hr_policies")
    .select(
      `
        *,
        companies:company_id (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return {
      data,
      error,
    };
  }

  const {
    data: versions,
    error: versionError,
  } = await supabaseAdmin
    .from("hr_policy_versions")
    .select("*")
    .eq("policy_id", id)
    .order("version_no", {
      ascending: false,
    });

  if (versionError) {
    return {
      data: null,
      error: versionError,
    };
  }

  const currentVersion =
    (versions || []).find(
      (item) =>
        Number(item.version_no) ===
        Number(data.current_version_no)
    ) ||
    versions?.[0] ||
    null;

  return {
    data: {
      ...data,
      current_version: currentVersion,
      versions: versions || [],
    },
    error: null,
  };
}

export function hasVersionChange(currentVersion, payload) {
  if (!currentVersion) return true;

  const fields = [
    ["version_title", payload.version_title],
    ["content", payload.content],
    ["change_summary", payload.change_summary],
    ["status", payload.status],
    ["effective_date", payload.effective_date],
    ["expire_date", payload.expire_date],
  ];

  return fields.some(([key, nextValue]) => {
    return (
      cleanText(currentVersion?.[key]) !==
      cleanText(nextValue)
    );
  });
}
