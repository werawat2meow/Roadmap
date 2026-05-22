import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

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
      role_id,
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

    if (
      !hasPermission(user, "benefit.running.edit") &&
      !hasPermission(user, "benefit.running.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไขเลขรันเอกสาร" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const module_code = body?.module_code?.trim().toUpperCase();
    const document_type = body?.document_type?.trim().toUpperCase();
    const prefix = body?.prefix?.trim();
    const current_number = Number(body?.current_number || 0);
    const padding_length = Number(body?.padding_length || 6);
    const running_year = Number(body?.running_year);
    const running_month = Number(body?.running_month || 0);
    const reset_every_year = body?.reset_every_year !== false;
    const is_active = body?.is_active !== false;

    if (!module_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Module Code" },
        { status: 400 }
      );
    }

    if (!document_type) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Document Type" },
        { status: 400 }
      );
    }

    if (!prefix) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Prefix" },
        { status: 400 }
      );
    }

    if (Number.isNaN(current_number) || current_number < 0) {
      return NextResponse.json(
        { success: false, error: "Current Number ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (Number.isNaN(padding_length) || padding_length <= 0) {
      return NextResponse.json(
        { success: false, error: "Padding Length ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (Number.isNaN(running_year) || running_year < 2000) {
      return NextResponse.json(
        { success: false, error: "Running Year ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (Number.isNaN(running_month) || running_month < 0 || running_month > 12) {
      return NextResponse.json(
        { success: false, error: "Running Month ต้องอยู่ระหว่าง 0-12" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_running_numbers")
      .update({
        module_code,
        document_type,
        prefix,
        current_number,
        padding_length,
        reset_every_year,
        running_year,
        running_month,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "เลขรันชุดนี้มีอยู่แล้ว" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("BENEFIT_RUNNING_PUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "แก้ไขเลขรันเอกสารไม่สำเร็จ" },
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

    if (
      !hasPermission(user, "benefit.running.delete") &&
      !hasPermission(user, "benefit.running.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบเลขรันเอกสาร" },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_running_numbers")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบเลขรันเอกสารสำเร็จ",
    });
  } catch (error) {
    console.error("BENEFIT_RUNNING_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบเลขรันเอกสารไม่สำเร็จ" },
      { status: 500 }
    );
  }
}