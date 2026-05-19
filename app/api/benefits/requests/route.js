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

  return {
    ...data,
    permissions,
  };
}

function hasPermission(user, permission) {
  const roleCode = user?.roles?.role_code;

  if (roleCode === "SUPER_ADMIN") return true;

  return user?.permissions?.includes(permission) || false;
}

async function generateRequestNo() {
  const year = new Date().getFullYear();

  const { data, error } = await supabaseAdmin
    .from("benefit_running_numbers")
    .select("id, current_number, prefix, padding_length")
    .eq("module_code", "BENEFIT")
    .eq("document_type", "REQUEST")
    .eq("running_year", year)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const prefix = `BEN-${year}-`;

    const { data: created, error: createError } = await supabaseAdmin
      .from("benefit_running_numbers")
      .insert({
        module_code: "BENEFIT",
        document_type: "REQUEST",
        prefix,
        current_number: 1,
        padding_length: 6,
        reset_every_year: true,
        running_year: year,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    return `${created.prefix}${String(created.current_number).padStart(
      created.padding_length || 6,
      "0"
    )}`;
  }

  const nextNumber = Number(data.current_number || 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from("benefit_running_numbers")
    .update({
      current_number: nextNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return `${data.prefix || `BEN-${year}-`}${String(nextNumber).padStart(
    data.padding_length || 6,
    "0"
  )}`;
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

    if (!hasPermission(user, "benefit.request.create")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์สร้างคำขอสวัสดิการ" },
        { status: 403 }
      );
    }

    if (!user.employee_id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const benefitId = body?.benefitId || body?.benefit_id;
    const requestedAmount = body?.requestedAmount ?? body?.requested_amount ?? null;
    const remark = body?.remark || null;

    if (!benefitId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสวัสดิการ" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();

    const { data: entitlement } = await supabaseAdmin
      .from("benefit_entitlements")
      .select(`
        id,
        quota_amount,
        used_amount,
        remaining_amount,
        quota_unit,
        status
      `)
      .eq("employee_id", user.employee_id)
      .eq("benefit_id", benefitId)
      .eq("entitlement_year", currentYear)
      .eq("status", "active")
      .maybeSingle();

    if (entitlement && requestedAmount !== null) {
      const remaining = Number(entitlement.remaining_amount || 0);
      const requestAmount = Number(requestedAmount || 0);

      if (remaining > 0 && requestAmount > remaining) {
        return NextResponse.json(
          {
            success: false,
            error: `ยอดที่ขอเกินสิทธิ์คงเหลือ (${remaining.toLocaleString()} ${
              entitlement.quota_unit || ""
            })`,
          },
          { status: 400 }
        );
      }
    }

    const requestNo = await generateRequestNo();

    const payload = {
      request_no: requestNo,
      employee_id: user.employee_id,
      benefit_id: benefitId,
      requested_amount: requestedAmount,
      status: "pending",
      remark,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_REQUEST_POST_ERROR:", error);

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
    console.error("BENEFIT_REQUEST_POST_FATAL:", error);

    return NextResponse.json(
      { success: false, error: error.message || "สร้างคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}