import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-key"
  );

  const userId = decoded?.user_id;
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      is_active,
      role_permissions (
        permissions (
          permission_code
        )
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  const permissions =
    data.role_permissions
      ?.map((item) => item.permissions?.permission_code)
      ?.filter(Boolean) || [];

  return {
    ...data,
    permissions,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.permissions.includes("benefit.request.view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .select(`
        id,
        request_no,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
        created_at,
        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `)
      .eq("employee_id", user.employee_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: "โหลดคำขอสวัสดิการไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_REQUESTS_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.permissions.includes("benefit.request.create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!user.employee_id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Employee ID ของผู้ใช้งาน" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const benefitCode = body?.benefitCode;
    const benefitId = body?.benefitId;
    const requestedAmount = body?.requestedAmount ?? null;
    const remark = body?.remark || null;

    if (!benefitCode && !benefitId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสวัสดิการ" },
        { status: 400 }
      );
    }

    let benefit = null;

    if (benefitId) {
      const { data, error } = await supabaseAdmin
        .from("benefits")
        .select("id, benefit_code, benefit_name, is_active")
        .eq("id", benefitId)
        .maybeSingle();

      if (error) throw error;
      benefit = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("benefits")
        .select("id, benefit_code, benefit_name, is_active")
        .eq("benefit_code", benefitCode)
        .maybeSingle();

      if (error) throw error;
      benefit = data;
    }

    if (!benefit || !benefit.is_active) {
      return NextResponse.json(
        { success: false, error: "ไม่พบสวัสดิการ หรือสวัสดิการถูกปิดใช้งาน" },
        { status: 404 }
      );
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("benefit_requests")
      .insert({
        employee_id: user.employee_id,
        benefit_id: benefit.id,
        requested_amount: requestedAmount,
        remark,
        status: "pending",
        created_by: user.id,
      })
      .select(`
        id,
        request_no,
        employee_id,
        benefit_id,
        requested_amount,
        request_date,
        status,
        remark,
        created_at,
        benefits (
          benefit_code,
          benefit_name
        )
      `)
      .single();

    if (insertError) {
      console.error("BENEFIT_REQUEST_INSERT_ERROR:", insertError);

      return NextResponse.json(
        { success: false, error: "สร้างคำขอสวัสดิการไม่สำเร็จ" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("benefit_request_approvals")
      .insert({
        benefit_request_id: inserted.id,
        action: "submitted",
        action_by: user.id,
        action_note: "ส่งคำขอสวัสดิการ",
      });

    return NextResponse.json({
      success: true,
      message: "ส่งคำขอสวัสดิการเรียบร้อยแล้ว",
      data: inserted,
    });
  } catch (error) {
    console.error("BENEFIT_REQUESTS_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}