import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

/* =========================================================
   Notification Priority
========================================================= */

const ALLOWED_PRIORITIES = [
  "info",
  "normal",
  "warning",
  "critical",
];

/* =========================================================
   Helpers
========================================================= */

function cleanText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

function cleanNullableText(
  value
) {
  const cleaned =
    cleanText(value);

  return cleaned || null;
}

function normalizePriority(
  value
) {
  const priority =
    cleanText(value)
      .toLowerCase();

  return ALLOWED_PRIORITIES.includes(
    priority
  )
    ? priority
    : "normal";
}

function normalizeNotification(
  payload = {}
) {
  return {
    user_account_id:
      cleanNullableText(
        payload.user_account_id
      ),

    company_id:
      cleanNullableText(
        payload.company_id
      ),

    notification_type:
      cleanText(
        payload.notification_type
      ) || "general",

    title:
      cleanText(
        payload.title
      ),

    message:
      cleanNullableText(
        payload.message
      ),

    module_code:
      cleanNullableText(
        payload.module_code
      ),

    entity_type:
      cleanNullableText(
        payload.entity_type
      ),

    entity_id:
      cleanNullableText(
        payload.entity_id
      ),

    action_url:
      cleanNullableText(
        payload.action_url
      ),

    priority:
      normalizePriority(
        payload.priority
      ),

    metadata:
      payload.metadata &&
      typeof payload.metadata ===
        "object"
        ? payload.metadata
        : {},

    dedupe_key:
      cleanNullableText(
        payload.dedupe_key
      ),

    created_by:
      cleanNullableText(
        payload.created_by
      ),
  };
}

/* =========================================================
   Create One Notification

   ใช้จาก Server API เท่านั้น

   ตัวอย่าง:

   await createNotification({
     user_account_id: managerUserAccountId,
     notification_type: "probation_expiring",
     title: "พนักงานใกล้ครบทดลองงาน",
     message: "นาย A จะครบทดลองงานในอีก 7 วัน",
     module_code: "employees",
     entity_type: "employee",
     entity_id: employee.id,
     action_url: `/admin/employees/${employee.id}`,
     priority: "warning",
     dedupe_key: `probation:${employee.id}:2026-09-12`,
   });
========================================================= */

export async function createNotification(
  payload
) {
  const row =
    normalizeNotification(
      payload
    );

  if (!row.user_account_id) {
    throw new Error(
      "createNotification: user_account_id is required"
    );
  }

  if (!row.title) {
    throw new Error(
      "createNotification: title is required"
    );
  }

  let query;

  if (row.dedupe_key) {
    query =
      supabaseAdmin
        .from(
          "notifications"
        )
        .upsert(
          row,
          {
            onConflict:
              "user_account_id,dedupe_key",
            ignoreDuplicates:
              true,
          }
        )
        .select("*")
        .maybeSingle();
  } else {
    query =
      supabaseAdmin
        .from(
          "notifications"
        )
        .insert(row)
        .select("*")
        .single();
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    console.error(
      "createNotification error:",
      error
    );

    throw error;
  }

  return data || null;
}

/* =========================================================
   Create Many Notifications

   เหมาะกับ Event ที่ต้องแจ้ง Manager/HR หลายคน
   โดย Caller ต้องคัด User ตาม Permission + Scope ก่อน
========================================================= */

export async function createNotifications(
  payloads = []
) {
  const rows =
    payloads
      .map(
        normalizeNotification
      )
      .filter(
        (row) =>
          row.user_account_id &&
          row.title
      );

  if (rows.length === 0) {
    return [];
  }

  const withDedupe =
    rows.filter(
      (row) =>
        row.dedupe_key
    );

  const withoutDedupe =
    rows.filter(
      (row) =>
        !row.dedupe_key
    );

  const result = [];

  if (
    withoutDedupe.length > 0
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "notifications"
        )
        .insert(
          withoutDedupe
        )
        .select("*");

    if (error) {
      console.error(
        "createNotifications insert error:",
        error
      );

      throw error;
    }

    result.push(
      ...(data || [])
    );
  }

  /*
   * Dedupe ทีละรายการเพื่อให้ใช้
   * unique(user_account_id, dedupe_key)
   * ได้อย่างชัดเจนและไม่สร้างข้อมูลซ้ำ
   */
  for (
    const row of withDedupe
  ) {
    const created =
      await createNotification(
        row
      );

    if (created) {
      result.push(created);
    }
  }

  return result;
}
