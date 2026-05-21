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

export async function GET(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canView =
      hasPermission(user, "benefit.usage.view") ||
      hasPermission(user, "benefit.usage.manage");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูประวัติการใช้สิทธิ์" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 10), 1),
      100
    );

    const employeeId = searchParams.get("employeeId") || "";
    const benefitId = searchParams.get("benefitId") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("benefit_usages")
      .select(
        `
        id,
        employee_id,
        benefit_id,
        benefit_request_id,
        entitlement_id,
        usage_date,
        used_amount,
        usage_unit,
        reference_no,
        remark,
        created_by,
        created_at,
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
        ),
        benefit_requests (
          id,
          request_no,
          status
        ),
        benefit_entitlements (
          id,
          entitlement_year,
          quota_amount,
          used_amount,
          remaining_amount
        )
      `,
        { count: "exact" }
      );

    if (employeeId) query = query.eq("employee_id", employeeId);
    if (benefitId) query = query.eq("benefit_id", benefitId);

    const { data, error, count } = await query
      .order("usage_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("BENEFIT_USAGES_GET_ERROR:", error);
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
    });
  } catch (error) {
    console.error("BENEFIT_USAGES_GET_FATAL:", error);
    return NextResponse.json(
      { success: false, error: "โหลดประวัติการใช้สิทธิ์ไม่สำเร็จ" },
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

    const canCreate =
      hasPermission(user, "benefit.usage.create") ||
      hasPermission(user, "benefit.usage.manage");

    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์บันทึกการใช้สิทธิ์" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const employee_id = body?.employee_id || null;
    const benefit_id = body?.benefit_id || null;
    const benefit_request_id = body?.benefit_request_id || null;
    const entitlement_id = body?.entitlement_id || null;
    const usage_date = body?.usage_date || new Date().toISOString().slice(0, 10);
    const used_amount =
      body?.used_amount !== undefined && body?.used_amount !== ""
        ? Number(body.used_amount)
        : null;
    const usage_unit = body?.usage_unit?.trim() || null;
    const reference_no = body?.reference_no?.trim() || null;
    const remark = body?.remark?.trim() || null;

    if (!employee_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกพนักงาน" },
        { status: 400 }
      );
    }

    if (!benefit_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสวัสดิการ" },
        { status: 400 }
      );
    }

    if (used_amount !== null && (Number.isNaN(used_amount) || used_amount < 0)) {
      return NextResponse.json(
        { success: false, error: "จำนวนที่ใช้ต้องเป็นตัวเลขเท่านั้น" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_usages")
      .insert({
        employee_id,
        benefit_id,
        benefit_request_id,
        entitlement_id,
        usage_date,
        used_amount,
        usage_unit,
        reference_no,
        remark,
        created_by: user.id,
      })
      .select(`
        id,
        employee_id,
        benefit_id,
        benefit_request_id,
        entitlement_id,
        usage_date,
        used_amount,
        usage_unit,
        reference_no,
        remark,
        created_by,
        created_at,
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
      `)
      .single();

    if (error) {
      console.error("BENEFIT_USAGES_POST_ERROR:", error);
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
    console.error("BENEFIT_USAGES_POST_FATAL:", error);
    return NextResponse.json(
      { success: false, error: "บันทึกการใช้สิทธิ์ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}