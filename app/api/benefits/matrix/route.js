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

  return data;
}

function canManageBenefit(user) {
  const roleCode = user?.roles?.role_code;

  if (roleCode === "SUPER_ADMIN") return true;
  if (roleCode === "HR_ADMIN") return true;
  if (roleCode === "BENEFIT_ADMIN") return true;

  return false;
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

    const { searchParams } = new URL(req.url);

    const year = Number(
      searchParams.get("year") || new Date().getFullYear()
    );

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .select(`
        id,
        benefit_id,
        rule_year,
        position_level,
        employee_status_id,
        quota_amount,
        quota_unit,
        quota_frequency,
        entitlement_period,
        is_unlimited,
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
          status_name
        )
      `)
      .eq("rule_year", year)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_MATRIX_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "โหลด Benefit Matrix ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();

    if (!user || !canManageBenefit(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มีสิทธิ์จัดการ Benefit Matrix",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const benefitId = body?.benefit_id;

    const ruleYear = Number(
      body?.rule_year || new Date().getFullYear()
    );

    if (!benefitId) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกสวัสดิการ",
        },
        { status: 400 }
      );
    }

    const payload = {
      benefit_id: benefitId,
      rule_year: ruleYear,

      position_level: body?.position_level || null,

      employee_status_id:
        body?.employee_status_id || null,

      quota_amount: body?.is_unlimited
        ? null
        : Number(body?.quota_amount || 0),

      quota_unit: body?.quota_unit || "amount",

      quota_frequency:
        body?.quota_frequency || "yearly",

      entitlement_period:
        body?.entitlement_period || "yearly",

      is_unlimited: Boolean(body?.is_unlimited),

      is_active: body?.is_active ?? true,

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Benefit Matrix สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("BENEFIT_MATRIX_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "เพิ่ม Benefit Matrix ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser();

    if (!user || !canManageBenefit(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มีสิทธิ์จัดการ Benefit Matrix",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Matrix ID",
        },
        { status: 400 }
      );
    }

    const payload = {
      benefit_id: body?.benefit_id,

      rule_year: Number(
        body?.rule_year || new Date().getFullYear()
      ),

      position_level: body?.position_level || null,

      employee_status_id:
        body?.employee_status_id || null,

      quota_amount: body?.is_unlimited
        ? null
        : Number(body?.quota_amount || 0),

      quota_unit: body?.quota_unit || "amount",

      quota_frequency:
        body?.quota_frequency || "yearly",

      entitlement_period:
        body?.entitlement_period || "yearly",

      is_unlimited: Boolean(body?.is_unlimited),

      is_active: body?.is_active ?? true,

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไข Benefit Matrix สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("BENEFIT_MATRIX_PUT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "แก้ไข Benefit Matrix ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser();

    if (!user || !canManageBenefit(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มีสิทธิ์จัดการ Benefit Matrix",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Matrix ID",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_rules")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบ Benefit Matrix สำเร็จ",
    });
  } catch (error) {
    console.error("BENEFIT_MATRIX_DELETE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ลบ Benefit Matrix ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}