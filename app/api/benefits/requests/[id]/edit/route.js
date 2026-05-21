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
  if (user?.roles?.role_code === "SUPER_ADMIN") return true;
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

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.request.edit")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไขคำขอ" },
        { status: 403 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("benefit_requests")
      .select("id, employee_id, status")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "ไม่พบคำขอสวัสดิการ" },
        { status: 404 }
      );
    }

    if (existing.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "แก้ไขได้เฉพาะคำขอสถานะ pending เท่านั้น" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const benefitId = formData.get("benefit_id") || formData.get("benefitId");
    const requestedAmountRaw =
      formData.get("requested_amount") || formData.get("requestedAmount");
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

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .update({
        benefit_id: benefitId,
        requested_amount: requestedAmount,
        remark,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const uploadedAttachments = await uploadAttachments({
      files: attachments,
      requestId: id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data,
      attachments: uploadedAttachments,
    });
  } catch (error) {
    console.error("BENEFIT_REQUEST_EDIT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "แก้ไขคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}