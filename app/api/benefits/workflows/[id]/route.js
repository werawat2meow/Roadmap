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
      !hasPermission(user, "benefit.workflow.edit") &&
      !hasPermission(user, "benefit.workflow.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไข Workflow" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const benefit_id = body?.benefit_id || null;
    const workflow_name = body?.workflow_name?.trim() || "";
    const step_no = Number(body?.step_no);
    const approver_role_code = body?.approver_role_code?.trim() || null;
    const approver_user_id = body?.approver_user_id || null;
    const is_required = body?.is_required !== false;
    const is_active = body?.is_active !== false;

    if (!benefit_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือก Benefit" },
        { status: 400 }
      );
    }

    if (!workflow_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Workflow Name" },
        { status: 400 }
      );
    }

    if (Number.isNaN(step_no) || step_no <= 0) {
      return NextResponse.json(
        { success: false, error: "Step No ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_approval_workflows")
      .update({
        benefit_id,
        workflow_name,
        step_no,
        approver_role_code,
        approver_user_id,
        is_required,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        benefit_id,
        workflow_name,
        step_no,
        approver_role_code,
        approver_user_id,
        is_required,
        is_active,
        created_at,
        updated_at,
        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Benefit นี้มี Step No นี้แล้ว" },
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
    console.error("BENEFIT_WORKFLOW_PUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "แก้ไข Workflow ไม่สำเร็จ" },
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
      !hasPermission(user, "benefit.workflow.delete") &&
      !hasPermission(user, "benefit.workflow.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบ Workflow" },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_approval_workflows")
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
      message: "ลบ Workflow สำเร็จ",
    });
  } catch (error) {
    console.error("BENEFIT_WORKFLOW_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบ Workflow ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}