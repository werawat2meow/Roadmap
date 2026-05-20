import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

const ATTACHMENT_BUCKET = process.env.BENEFIT_ATTACHMENTS_BUCKET || "benefit-attachments";
const MAX_FILE_SIZE_MB = Number(process.env.BENEFIT_ATTACHMENT_MAX_SIZE_MB || 10);
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key");
  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      role_id,
      username,
      is_active,
      roles (
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (!data || !data.is_active) return null;

  let permissions = [];

  if (data.role_id) {
    const { data: permissionRows } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permissions (
          permission_code,
          is_active
        )
      `)
      .eq("role_id", data.role_id);

    permissions =
      permissionRows
        ?.map((row) => row.permissions)
        ?.filter((perm) => perm?.is_active)
        ?.map((perm) => perm.permission_code) || [];
  }

  return { ...data, permissions };
}

function hasPermission(user, permission) {
  const roleCode = user?.roles?.role_code;
  if (roleCode === "SUPER_ADMIN") return true;
  return user?.permissions?.includes(permission) || false;
}

function validateFile(file) {
  if (!file || typeof file === "string") return null;

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `ไฟล์ ${file.name} ไม่รองรับ รองรับเฉพาะ PDF, JPG, PNG`;
  }

  const sizeMb = Number(file.size || 0) / 1024 / 1024;

  if (sizeMb > MAX_FILE_SIZE_MB) {
    return `ไฟล์ ${file.name} มีขนาดเกิน ${MAX_FILE_SIZE_MB}MB`;
  }

  return null;
}

async function generateRequestNo() {
  const year = new Date().getFullYear();

  const { data, error } = await supabaseAdmin
    .from("benefit_running_numbers")
    .select("id, current_number, prefix, padding_length")
    .eq("module_code", "BENEFIT")
    .eq("document_type", "REQUEST")
    .eq("running_year", year)
    .eq("running_month", 0)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const prefix = `BEN-${year}-`;

    const { data: created, error: createError } = await supabaseAdmin
      .from("benefit_running_numbers")
      .insert({
        module_code: "BENEFIT",
        document_type: "REQUEST",
        prefix,
        current_number: 1,
        padding_length: 6,
        reset_every_year: true,
        running_year: year,
        running_month: 0,
        is_active: true,
      })
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    return `${created.prefix}${String(created.current_number).padStart(
      created.padding_length || 6,
      "0"
    )}`;
  }

  const nextNumber = Number(data.current_number || 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from("benefit_running_numbers")
    .update({
      current_number: nextNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) throw new Error(updateError.message);

  return `${data.prefix || `BEN-${year}-`}${String(nextNumber).padStart(
    data.padding_length || 6,
    "0"
  )}`;
}

async function uploadAttachments({ files, requestId, userId }) {
  const uploadedRows = [];

  for (const file of files) {
    if (!file || typeof file === "string") continue;

    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);

    const fileExt = file.name?.split(".").pop() || "file";
    const safeFileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `requests/${requestId}/${safeFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ATTACHMENT_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    uploadedRows.push({
      benefit_request_id: requestId,
      file_name: file.name,
      file_path: filePath,
      file_url: null,
      file_type: file.type || null,
      file_size: file.size || null,
      uploaded_by: userId,
    });
  }

  if (uploadedRows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("benefit_request_attachments")
      .insert(uploadedRows);

    if (insertError) throw new Error(insertError.message);
  }

  return uploadedRows;
}

async function findSearchIds(search) {
  if (!search) {
    return {
      employeeIds: [],
      benefitIds: [],
    };
  }

  const [employeeResult, benefitResult] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select("id")
      .or(
        `employee_code.ilike.%${search}%,first_name_th.ilike.%${search}%,last_name_th.ilike.%${search}%`
      )
      .limit(100),

    supabaseAdmin
      .from("benefits")
      .select("id")
      .or(
        `benefit_code.ilike.%${search}%,benefit_name.ilike.%${search}%`
      )
      .limit(100),
  ]);

  return {
    employeeIds: employeeResult.data?.map((item) => item.id) || [],
    benefitIds: benefitResult.data?.map((item) => item.id) || [],
  };
}

function buildSearchOr(search, employeeIds = [], benefitIds = []) {
  const conditions = [
    `request_no.ilike.%${search}%`,
    `remark.ilike.%${search}%`,
  ];

  if (employeeIds.length > 0) {
    conditions.push(`employee_id.in.(${employeeIds.join(",")})`);
  }

  if (benefitIds.length > 0) {
    conditions.push(`benefit_id.in.(${benefitIds.join(",")})`);
  }

  return conditions.join(",");
}

export async function GET(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canViewAll =
      hasPermission(user, "benefit.request.view") ||
      hasPermission(user, "benefit.request.approve");

    const canViewOwn =
      hasPermission(user, "benefit.request.create") ||
      hasPermission(user, "benefit.request.view_own");

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูคำขอสวัสดิการ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 10), 1),
      100
    );

    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const search = (searchParams.get("search") || "").trim();

    const allowedStatuses = [
      "draft",
      "pending",
      "in_review",
      "approved",
      "rejected",
      "cancelled",
      "paid",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `สถานะไม่ถูกต้อง: ${status}` },
        { status: 400 }
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let employeeIds = [];
    let benefitIds = [];

    if (search) {
      const [employeeResult, benefitResult] = await Promise.all([
        supabaseAdmin
          .from("employees")
          .select("id")
          .or(
            `employee_code.ilike.%${search}%,first_name_th.ilike.%${search}%,last_name_th.ilike.%${search}%`
          )
          .limit(100),

        supabaseAdmin
          .from("benefits")
          .select("id")
          .or(`benefit_code.ilike.%${search}%,benefit_name.ilike.%${search}%`)
          .limit(100),
      ]);

      employeeIds = employeeResult.data?.map((item) => item.id) || [];
      benefitIds = benefitResult.data?.map((item) => item.id) || [];
    }

    let query = supabaseAdmin
      .from("benefit_requests")
      .select(
        `
        id,
        request_no,
        employee_id,
        benefit_id,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
        created_at,
        updated_at,
        employees (
          id,
          employee_code,
          first_name_th,
          last_name_th
        ),
        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `,
        { count: "exact" }
      );

    if (!canViewAll && user.employee_id) {
      query = query.eq("employee_id", user.employee_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const orFilters = [
        `request_no.ilike.%${search}%`,
        `remark.ilike.%${search}%`,
        `reject_reason.ilike.%${search}%`,
      ];

      if (employeeIds.length > 0) {
        orFilters.push(`employee_id.in.(${employeeIds.join(",")})`);
      }

      if (benefitIds.length > 0) {
        orFilters.push(`benefit_id.in.(${benefitIds.join(",")})`);
      }

      query = query.or(orFilters.join(","));
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("BENEFIT_REQUESTS_GET_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      filters: {
        status,
        search,
      },
    });
  } catch (error) {
    console.error("BENEFIT_REQUESTS_GET_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "โหลดคำขอสวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  let createdRequestId = null;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.request.create")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์สร้างคำขอสวัสดิการ" },
        { status: 403 }
      );
    }

    if (!user.employee_id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const benefitId = formData.get("benefitId") || formData.get("benefit_id");
    const requestedAmountRaw =
      formData.get("requestedAmount") || formData.get("requested_amount");
    const remark = formData.get("remark") || null;
    const attachments = formData.getAll("attachments");

    if (!benefitId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสวัสดิการ" },
        { status: 400 }
      );
    }

    const requestedAmount =
      requestedAmountRaw !== null && requestedAmountRaw !== ""
        ? Number(requestedAmountRaw)
        : null;

    if (
      requestedAmount !== null &&
      (Number.isNaN(requestedAmount) || requestedAmount < 0)
    ) {
      return NextResponse.json(
        { success: false, error: "จำนวนที่ขอต้องเป็นตัวเลขเท่านั้น" },
        { status: 400 }
      );
    }

    for (const file of attachments) {
      const validationError = validateFile(file);

      if (validationError) {
        return NextResponse.json(
          { success: false, error: validationError },
          { status: 400 }
        );
      }
    }

    const currentYear = new Date().getFullYear();

    const { data: entitlement } = await supabaseAdmin
      .from("benefit_entitlements")
      .select(`
        id,
        quota_amount,
        used_amount,
        remaining_amount,
        quota_unit,
        status
      `)
      .eq("employee_id", user.employee_id)
      .eq("benefit_id", benefitId)
      .eq("entitlement_year", currentYear)
      .eq("status", "active")
      .maybeSingle();

    if (entitlement && requestedAmount !== null) {
      const remaining = Number(entitlement.remaining_amount || 0);

      if (remaining > 0 && requestedAmount > remaining) {
        return NextResponse.json(
          {
            success: false,
            error: `ยอดที่ขอเกินสิทธิ์คงเหลือ (${remaining.toLocaleString()} ${
              entitlement.quota_unit || ""
            })`,
          },
          { status: 400 }
        );
      }
    }

    const requestNo = await generateRequestNo();

    const payload = {
      request_no: requestNo,
      employee_id: user.employee_id,
      benefit_id: benefitId,
      requested_amount: requestedAmount,
      status: "pending",
      remark,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data: requestData, error } = await supabaseAdmin
      .from("benefit_requests")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_REQUEST_POST_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    createdRequestId = requestData.id;

    const uploadedAttachments = await uploadAttachments({
      files: attachments,
      requestId: requestData.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: requestData,
      attachments: uploadedAttachments,
    });
  } catch (error) {
    console.error("BENEFIT_REQUEST_POST_FATAL:", error);

    if (createdRequestId) {
      await supabaseAdmin
        .from("benefit_requests")
        .delete()
        .eq("id", createdRequestId);
    }

    return NextResponse.json(
      { success: false, error: error.message || "สร้างคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}