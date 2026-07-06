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

async function createAuditLog({
  req,
  user,
  actionType,
  refId = null,
  description,
  oldData = null,
  newData = null,
}) {
  try {
    await supabaseAdmin.from("benefit_audit_logs").insert({
      module_name: "rule",
      action_type: actionType,
      ref_table: "benefit_rules",
      ref_id: refId,
      description,
      old_data: oldData,
      new_data: newData,
      created_by: user?.id || null,
      created_by_name: user?.username || null,
      ip_address:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        null,
      user_agent: req.headers.get("user-agent") || null,
    });
  } catch (error) {
    console.error("CREATE_RULE_AUDIT_LOG_ERROR:", error);
  }
}

function toNumberOrNull(value) {
  if (value === "" || value === undefined || value === null) return null;
  return Number(value);
}

function buildPayload(body) {
  return {
    benefit_id: body.benefit_id,
    rule_year: Number(body.rule_year || new Date().getFullYear()),

    position_level: body.position_level || null,
    employee_status_id: body.employee_status_id || null,
    employment_type_id: body.employment_type_id || null,

    min_service_months: Number(body.min_service_months || 0),
    max_service_months: toNumberOrNull(body.max_service_months),

    quota_amount: toNumberOrNull(body.quota_amount),
    quota_unit: body.quota_unit || null,
    quota_frequency: body.quota_frequency || null,

    discount_percent: toNumberOrNull(body.discount_percent),
    is_unlimited: body.is_unlimited ?? false,
    allow_carry_forward: body.allow_carry_forward ?? false,
    max_carry_forward_amount: toNumberOrNull(body.max_carry_forward_amount),
    carry_forward_expire_month: toNumberOrNull(body.carry_forward_expire_month),

    rule_note: body.rule_note || null,
    is_active: body.is_active ?? true,
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
      !hasPermission(user, "benefit.rule.view") &&
      !hasPermission(user, "benefit.rule.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูข้อมูล Benefit Rules" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .select(`
        id,
        benefit_id,
        rule_year,
        position_level,
        employment_status,
        employee_status_code,
        employment_type_code,
        employee_status_id,
        employment_type_id,
        min_service_months,
        max_service_months,
        quota_amount,
        quota_unit,
        quota_frequency,
        discount_percent,
        is_unlimited,
        allow_carry_forward,
        max_carry_forward_amount,
        carry_forward_expire_month,
        rule_note,
        is_active,
        created_at,
        updated_at,
        benefits (
          id,
          benefit_code,
          benefit_name
        ),
        employee_statuses (
          id,
          status_code,
          status_name
        ),
        employment_types (
          id,
          type_code,
          type_name
        )
      `)
      .order("rule_year", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BENEFIT_RULES_GET_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: benefits } = await supabaseAdmin
      .from("benefits")
      .select("id, benefit_code, benefit_name")
      .eq("is_active", true)
      .order("benefit_name", { ascending: true });

    const { data: employeeStatuses } = await supabaseAdmin
      .from("employee_statuses")
      .select("id, status_code, status_name")
      .order("status_name", { ascending: true });

    const { data: employmentTypes } = await supabaseAdmin
      .from("employment_types")
      .select("id, type_code, type_name")
      .order("type_name", { ascending: true });

    const { data: positionRows } = await supabaseAdmin
      .from("positions")
      .select("position_level")
      .eq("status", "active")
      .not("position_level", "is", null);

    const positionLevels = [
      ...new Set(
        (positionRows || [])
          .map((item) => item.position_level)
          .filter(Boolean)
      ),
    ].sort(
      (a, b) =>
        Number(b.replace("P", "")) -
        Number(a.replace("P", ""))
    );
    
    return NextResponse.json({
      success: true,
      data: data || [],
      benefits: benefits || [],
      employeeStatuses: employeeStatuses || [],
      employmentTypes: employmentTypes || [],
      positionLevels,
    });
  } catch (error) {
    console.error("BENEFIT_RULES_GET_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "โหลดข้อมูล Benefit Rules ไม่สำเร็จ" },
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
      !hasPermission(user, "benefit.rule.create") &&
      !hasPermission(user, "benefit.rule.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์เพิ่ม Benefit Rule" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload.benefit_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสวัสดิการ" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_RULES_POST_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await createAuditLog({
      req,
      user,
      actionType: "create",
      refId: data.id,
      description: `เพิ่ม Benefit Rule: ${data.id}`,
      oldData: null,
      newData: data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("BENEFIT_RULES_POST_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "เพิ่ม Benefit Rule ไม่สำเร็จ" },
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
      !hasPermission(user, "benefit.rule.update") &&
      !hasPermission(user, "benefit.rule.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไข Benefit Rule" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id ของ Benefit Rule" },
        { status: 400 }
      );
    }


    const { data: oldData } = await supabaseAdmin
      .from("benefit_rules")
      .select("*")
      .eq("id", body.id)
      .maybeSingle();

    const payload = buildPayload(body);

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_RULES_PUT_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await createAuditLog({
      req,
      user,
      actionType: "update",
      refId: data.id,
      description: `แก้ไข Benefit Rule: ${data.id}`,
      oldData,
      newData: data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("BENEFIT_RULES_PUT_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "แก้ไข Benefit Rule ไม่สำเร็จ" },
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
      !hasPermission(user, "benefit.rule.delete") &&
      !hasPermission(user, "benefit.rule.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบ Benefit Rule" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id ของ Benefit Rule" },
        { status: 400 }
      );
    }

    const { data: oldData } = await supabaseAdmin
      .from("benefit_rules")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("benefit_rules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BENEFIT_RULES_DELETE_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await createAuditLog({
      req,
      user,
      actionType: "delete",
      refId: id,
      description: `ลบ Benefit Rule: ${oldData?.id || id}`,
      oldData,
      newData: null,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("BENEFIT_RULES_DELETE_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "ลบ Benefit Rule ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}