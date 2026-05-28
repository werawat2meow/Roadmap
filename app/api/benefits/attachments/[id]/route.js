import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

const ATTACHMENT_BUCKET =
  process.env.BENEFIT_ATTACHMENTS_BUCKET || "benefit-attachments";

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
      is_active,
      roles (
        role_code
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

async function getAttachment(id) {
  const { data, error } = await supabaseAdmin
    .from("benefit_request_attachments")
    .select(`
      id,
      benefit_request_id,
      file_name,
      file_path,
      file_type,
      benefit_requests (
        id,
        employee_id
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canViewAll =
      hasPermission(user, "benefit.attachment.view") ||
      hasPermission(user, "benefit.attachment.manage") ||
      hasPermission(user, "benefit.request.view") ||
      hasPermission(user, "benefit.request.approve");

    const canViewOwn =
      hasPermission(user, "benefit.request.create") ||
      hasPermission(user, "benefit.request.view_own");

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดาวน์โหลดไฟล์" },
        { status: 403 }
      );
    }

    const attachment = await getAttachment(id);

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "ไม่พบไฟล์แนบ" },
        { status: 404 }
      );
    }

    if (
      !canViewAll &&
      attachment.benefit_requests?.employee_id !== user.employee_id
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้" },
        { status: 403 }
      );
    }

    const { data: signedData, error: signedError } =
      await supabaseAdmin.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrl(attachment.file_path, 60);

    if (signedError) {
      return NextResponse.json(
        { success: false, error: signedError.message },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedData.signedUrl);
  } catch (error) {
    console.error("BENEFIT_ATTACHMENT_DOWNLOAD_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ดาวน์โหลดไฟล์ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canDelete =
      hasPermission(user, "benefit.attachment.delete") ||
      hasPermission(user, "benefit.attachment.manage");

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบไฟล์แนบ" },
        { status: 403 }
      );
    }

    const attachment = await getAttachment(id);

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "ไม่พบไฟล์แนบ" },
        { status: 404 }
      );
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from(ATTACHMENT_BUCKET)
      .remove([attachment.file_path]);

    if (storageError) {
      return NextResponse.json(
        { success: false, error: storageError.message },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("benefit_request_attachments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบไฟล์แนบสำเร็จ",
    });
  } catch (error) {
    console.error("BENEFIT_ATTACHMENT_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบไฟล์แนบไม่สำเร็จ" },
      { status: 500 }
    );
  }
}