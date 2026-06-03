import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    const { data } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        role_id,
        username,
        is_active,
        roles (
          role_code,
          role_name
        )
      `)
      .eq("id", decoded.user_id)
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
  } catch {
    return null;
  }
}

function hasPermission(user, permission) {
  if (user?.roles?.role_code === "SUPER_ADMIN") return true;
  return user?.permissions?.includes(permission) || false;
}

function canView(user) {
  return (
    hasPermission(user, "benefit.policy.view") ||
    hasPermission(user, "benefit.policy.manage")
  );
}

function canCreate(user) {
  return (
    hasPermission(user, "benefit.policy.create") ||
    hasPermission(user, "benefit.policy.manage")
  );
}

function canUpdate(user) {
  return (
    hasPermission(user, "benefit.policy.edit") ||
    hasPermission(user, "benefit.policy.update") ||
    hasPermission(user, "benefit.policy.manage")
  );
}

function canDelete(user) {
  return (
    hasPermission(user, "benefit.policy.delete") ||
    hasPermission(user, "benefit.policy.manage")
  );
}

function buildPayload(body) {
  return {
    benefit_id: body.benefit_id,
    policy_name: body.policy_name,
    policy_code: body.policy_code,
    rule_year: Number(body.rule_year || new Date().getFullYear()),

    company_id: body.company_id || null,
    branch_id: body.branch_id || null,
    department_id: body.department_id || null,
    division_id: body.division_id || null,
    unit_id: body.unit_id || null,

    position_level: body.position_level || null,
    employment_type_id: body.employment_type_id || null,
    employee_status_id: body.employee_status_id || null,

    min_service_months:
      body.min_service_months === null || body.min_service_months === undefined
        ? 0
        : Number(body.min_service_months),

    max_service_months:
      body.max_service_months === null || body.max_service_months === undefined
        ? null
        : Number(body.max_service_months),

    min_age:
      body.min_age === null || body.min_age === undefined
        ? null
        : Number(body.min_age),

    max_age:
      body.max_age === null || body.max_age === undefined
        ? null
        : Number(body.max_age),

    probation_required: body.probation_required ?? false,

    quota_amount:
      body.quota_amount === null || body.quota_amount === undefined
        ? 0
        : Number(body.quota_amount),

    quota_unit: body.quota_unit || "amount",
    quota_frequency: body.quota_frequency || "yearly",

    is_unlimited: body.is_unlimited ?? false,
    priority: Number(body.priority || 100),
    is_active: body.is_active ?? true,

    updated_at: new Date().toISOString(),
  };
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

    if (!canView(user)) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดู Policy Rules" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const year = searchParams.get("year");
    const benefitId = searchParams.get("benefit_id");
    const search = (searchParams.get("search") || "").trim();
    const active = searchParams.get("active");

    let query = supabaseAdmin
      .from("benefit_policy_rules")
      .select(`
        id,
        benefit_id,
        policy_name,
        policy_code,
        rule_year,
        company_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_level,
        employment_type_id,
        employee_status_id,
        min_service_months,
        max_service_months,
        min_age,
        max_age,
        probation_required,
        quota_amount,
        quota_unit,
        quota_frequency,
        is_unlimited,
        priority,
        is_active,
        created_at,
        updated_at,
        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (year) query = query.eq("rule_year", Number(year));
    if (benefitId) query = query.eq("benefit_id", benefitId);

    if (active === "true") query = query.eq("is_active", true);
    if (active === "false") query = query.eq("is_active", false);

    if (search) {
      query = query.or(
        `policy_name.ilike.%${search}%,policy_code.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: data?.length || 0,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_POLICY_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลด Policy Rules ไม่สำเร็จ" },
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

    if (!canCreate(user)) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์เพิ่ม Policy Rule" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.benefit_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือก Benefit" },
        { status: 400 }
      );
    }

    if (!body.policy_name || !body.policy_code) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ Policy Name และ Policy Code" },
        { status: 400 }
      );
    }

    const payload = buildPayload(body);

    const { data, error } = await supabaseAdmin
      .from("benefit_policy_rules")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Policy Rule สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("BENEFIT_POLICY_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เพิ่ม Policy Rule ไม่สำเร็จ" },
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

    if (!canUpdate(user)) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไข Policy Rule" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id Policy Rule" },
        { status: 400 }
      );
    }

    const payload = buildPayload(body);

    const { data, error } = await supabaseAdmin
      .from("benefit_policy_rules")
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไข Policy Rule สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("BENEFIT_POLICY_PUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "แก้ไข Policy Rule ไม่สำเร็จ" },
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

    if (!canDelete(user)) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบ Policy Rule" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id Policy Rule" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_policy_rules")
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
      message: "ลบ Policy Rule สำเร็จ",
    });
  } catch (error) {
    console.error("BENEFIT_POLICY_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบ Policy Rule ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}