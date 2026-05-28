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

  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      role_id,
      username,
      is_active,
      roles (
        id,
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  let permissions = [];

  if (data.role_id) {
    const { data: permissionRows } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permission_id,
        permissions (
          id,
          permission_code,
          permission_name,
          module_code,
          action_code,
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

  return {
    ...data,
    permissions,
  };
}

function hasPermission(user, permission) {
  const roleCode = user?.roles?.role_code || user?.role_code;

  if (roleCode === "SUPER_ADMIN") return true;

  return user?.permissions?.includes(permission) || false;
}

function toNumberOrNull(value) {
  if (value === "" || value === undefined || value === null) return null;
  return Number(value);
}

function buildPayload(body) {
  const quotaAmount = toNumberOrNull(body.quota_amount) || 0;
  const usedAmount = toNumberOrNull(body.used_amount) || 0;

  const remainingAmount =
    body.remaining_amount !== undefined && body.remaining_amount !== null && body.remaining_amount !== ""
      ? Number(body.remaining_amount)
      : Math.max(quotaAmount - usedAmount, 0);

  return {
    employee_id: body.employee_id,
    benefit_id: body.benefit_id,
    entitlement_year: Number(body.entitlement_year || new Date().getFullYear()),

    quota_amount: quotaAmount,
    used_amount: usedAmount,
    remaining_amount: remainingAmount,
    quota_unit: body.quota_unit || null,

    is_unlimited: body.is_unlimited ?? false,
    is_active: body.is_active ?? true,
    remark: body.remark || null,
    updated_at: new Date().toISOString(),
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

    if (
      !hasPermission(user, "benefit.entitlement.view") &&
      !hasPermission(user, "benefit.entitlement.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูข้อมูล Benefit Entitlements" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_entitlements")
      .select(`
        id,
        employee_id,
        benefit_id,
        entitlement_year,
        quota_amount,
        used_amount,
        remaining_amount,
        quota_unit,
        is_unlimited,
        is_active,
        remark,
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
      `)
      .order("entitlement_year", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BENEFIT_ENTITLEMENTS_GET_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("id, employee_code, first_name_th, last_name_th")
      .order("employee_code", { ascending: true })
      .limit(500);

    const { data: benefits } = await supabaseAdmin
      .from("benefits")
      .select("id, benefit_code, benefit_name")
      .eq("is_active", true)
      .order("benefit_name", { ascending: true });

    return NextResponse.json({
      success: true,
      data: data || [],
      employees: employees || [],
      benefits: benefits || [],
    });
  } catch (error) {
    console.error("BENEFIT_ENTITLEMENTS_GET_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "โหลดข้อมูล Benefit Entitlements ไม่สำเร็จ" },
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

    if (
      !hasPermission(user, "benefit.entitlement.create") &&
      !hasPermission(user, "benefit.entitlement.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์เพิ่ม Benefit Entitlement" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload.employee_id || !payload.benefit_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกพนักงานและสวัสดิการ" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_entitlements")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_ENTITLEMENTS_POST_ERROR:", error);

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
    console.error("BENEFIT_ENTITLEMENTS_POST_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "เพิ่ม Benefit Entitlement ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      !hasPermission(user, "benefit.entitlement.update") &&
      !hasPermission(user, "benefit.entitlement.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไข Benefit Entitlement" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id ของ Benefit Entitlement" },
        { status: 400 }
      );
    }

    const payload = buildPayload(body);

    const { data, error } = await supabaseAdmin
      .from("benefit_entitlements")
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_ENTITLEMENTS_PUT_ERROR:", error);

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
    console.error("BENEFIT_ENTITLEMENTS_PUT_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "แก้ไข Benefit Entitlement ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      !hasPermission(user, "benefit.entitlement.delete") &&
      !hasPermission(user, "benefit.entitlement.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบ Benefit Entitlement" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id ของ Benefit Entitlement" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_entitlements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BENEFIT_ENTITLEMENTS_DELETE_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("BENEFIT_ENTITLEMENTS_DELETE_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "ลบ Benefit Entitlement ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}