import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

const ALLOWED_STATUSES = [
  "draft",
  "pending",
  "in_review",
  "approved",
  "rejected",
  "cancelled",
  "paid",
  "reversed",
];

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

async function findSearchIds(search) {
  if (!search) {
    return { employeeIds: [], benefitIds: [] };
  }

  const [employeeResult, benefitResult] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select("id")
      .or(
        `employee_code.ilike.%${search}%,first_name_th.ilike.%${search}%,last_name_th.ilike.%${search}%`
      )
      .limit(100),

    supabaseAdmin
      .from("benefits")
      .select("id")
      .or(`benefit_code.ilike.%${search}%,benefit_name.ilike.%${search}%`)
      .limit(100),
  ]);

  return {
    employeeIds: employeeResult.data?.map((item) => item.id) || [],
    benefitIds: benefitResult.data?.map((item) => item.id) || [],
  };
}

async function autoDeductBenefitUsage({ request, user }) {
  const amount = Number(
    request.approved_amount || request.requested_amount || 0
  );

  if (!amount || amount <= 0) {
    throw new Error("ยอดอนุมัติไม่ถูกต้อง");
  }

  const currentYear = new Date().getFullYear();

  const { data: entitlement, error: entitlementError } = await supabaseAdmin
    .from("benefit_entitlements")
    .select(`
      id,
      employee_id,
      benefit_id,
      entitlement_year,
      entitlement_month,
      quota_amount,
      used_amount,
      remaining_amount,
      quota_unit,
      status
    `)
    .eq("employee_id", request.employee_id)
    .eq("benefit_id", request.benefit_id)
    .eq("entitlement_year", currentYear)
    .eq("status", "active")
    .order("entitlement_month", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (entitlementError) {
    throw new Error(entitlementError.message);
  }

  if (!entitlement) {
    throw new Error("ไม่พบสิทธิ์ของพนักงานสำหรับสวัสดิการนี้");
  }

  const usedBefore = Number(entitlement.used_amount || 0);

  const remainingBefore =
    entitlement.remaining_amount === null
      ? null
      : Number(entitlement.remaining_amount || 0);

  if (remainingBefore !== null && remainingBefore < amount) {
    throw new Error("สิทธิ์คงเหลือไม่เพียงพอ");
  }

  const usedAfter = usedBefore + amount;

  const remainingAfter =
    remainingBefore === null ? null : remainingBefore - amount;

  const { data: existingUsage, error: existingUsageError } = await supabaseAdmin
    .from("benefit_usages")
    .select("id")
    .eq("benefit_request_id", request.id)
    .maybeSingle();

  if (existingUsageError) {
    throw new Error(existingUsageError.message);
  }

  if (existingUsage) {
    throw new Error("คำขอนี้ถูกตัดสิทธิ์ไปแล้ว");
  }

  const { error: usageError } = await supabaseAdmin
    .from("benefit_usages")
    .insert({
      employee_id: request.employee_id,
      benefit_id: request.benefit_id,
      benefit_request_id: request.id,
      entitlement_id: entitlement.id,
      usage_date: new Date().toISOString().slice(0, 10),
      used_amount: amount,
      usage_unit: entitlement.quota_unit || "amount",
      reference_no: request.request_no,
      remark: "Auto deduction from approved benefit request",
      created_by: user.id,
    });

  if (usageError) {
    throw new Error(usageError.message);
  }

  const { error: usageLogError } = await supabaseAdmin
    .from("benefit_usage_logs")
    .insert({
      employee_id: request.employee_id,
      benefit_id: request.benefit_id,
      benefit_entitlement_id: entitlement.id,
      benefit_request_id: request.id,
      usage_type: "request",
      usage_status: "approved",
      amount,
      balance_before: remainingBefore,
      balance_after: remainingAfter,
      remark: "Auto deduction log from approved benefit request",
      created_by: user.id,
    });

  if (usageLogError) {
    throw new Error(usageLogError.message);
  }

  const { error: updateEntitlementError } = await supabaseAdmin
    .from("benefit_entitlements")
    .update({
      used_amount: usedAfter,
      remaining_amount: remainingAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entitlement.id);

  if (updateEntitlementError) {
    throw new Error(updateEntitlementError.message);
  }

  return {
    entitlement_id: entitlement.id,
    used_before: usedBefore,
    used_after: usedAfter,
    remaining_before: remainingBefore,
    remaining_after: remainingAfter,
    deducted_amount: amount,
  };
}

async function reverseDeductBenefitUsage({ request, user }) {
  const { data: usage, error: usageError } = await supabaseAdmin
    .from("benefit_usages")
    .select(`
      id,
      employee_id,
      benefit_id,
      benefit_request_id,
      entitlement_id,
      used_amount
    `)
    .eq("benefit_request_id", request.id)
    .maybeSingle();

  if (usageError) throw new Error(usageError.message);
  if (!usage) throw new Error("ไม่พบรายการ Usage ที่ต้องคืนสิทธิ์");

  const { data: entitlement, error: entitlementError } = await supabaseAdmin
    .from("benefit_entitlements")
    .select(`
      id,
      used_amount,
      remaining_amount
    `)
    .eq("id", usage.entitlement_id)
    .maybeSingle();

  if (entitlementError) throw new Error(entitlementError.message);
  if (!entitlement) throw new Error("ไม่พบ Entitlement ที่ต้องคืนสิทธิ์");

  const amount = Number(usage.used_amount || 0);
  const usedBefore = Number(entitlement.used_amount || 0);
  const remainingBefore =
    entitlement.remaining_amount === null
      ? null
      : Number(entitlement.remaining_amount || 0);

  const usedAfter = Math.max(usedBefore - amount, 0);
  const remainingAfter =
    remainingBefore === null ? null : remainingBefore + amount;

  const { error: logError } = await supabaseAdmin
    .from("benefit_usage_logs")
    .insert({
      employee_id: usage.employee_id,
      benefit_id: usage.benefit_id,
      benefit_entitlement_id: entitlement.id,
      benefit_request_id: request.id,
      usage_type: "reverse",
      usage_status: "reversed",
      amount,
      balance_before: remainingBefore,
      balance_after: remainingAfter,
      remark: "Reverse deduction from approved benefit request",
      created_by: user.id,
    });

  if (logError) throw new Error(logError.message);

  const { error: updateEntitlementError } = await supabaseAdmin
    .from("benefit_entitlements")
    .update({
      used_amount: usedAfter,
      remaining_amount: remainingAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entitlement.id);

  if (updateEntitlementError) throw new Error(updateEntitlementError.message);

  const { error: deleteUsageError } = await supabaseAdmin
    .from("benefit_usages")
    .delete()
    .eq("id", usage.id);

  if (deleteUsageError) throw new Error(deleteUsageError.message);

  return {
    entitlement_id: entitlement.id,
    reversed_amount: amount,
    used_before: usedBefore,
    used_after: usedAfter,
    remaining_before: remainingBefore,
    remaining_after: remainingAfter,
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

    const canView =
      hasPermission(user, "benefit.request.view") ||
      hasPermission(user, "benefit.request.approve");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูรายการอนุมัติ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const search = (searchParams.get("search") || "").trim();

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `สถานะไม่ถูกต้อง: ${status}` },
        { status: 400 }
      );
    }

    const { employeeIds, benefitIds } = await findSearchIds(search);

    let query = supabaseAdmin
      .from("benefit_requests")
      .select(`
        id,
        request_no,
        employee_id,
        benefit_id,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
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
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const orFilters = [
        `request_no.ilike.%${search}%`,
        `remark.ilike.%${search}%`,
        `reject_reason.ilike.%${search}%`,
      ];

      if (employeeIds.length > 0) {
        orFilters.push(`employee_id.in.(${employeeIds.join(",")})`);
      }

      if (benefitIds.length > 0) {
        orFilters.push(`benefit_id.in.(${benefitIds.join(",")})`);
      }

      query = query.or(orFilters.join(","));
    }

    const { data, error } = await query;

    if (error) {
      console.error("BENEFIT_APPROVALS_GET_QUERY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      filters: {
        status,
        search,
      },
    });
  } catch (error) {
    console.error("BENEFIT_APPROVALS_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลดข้อมูลอนุมัติไม่สำเร็จ" },
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

    const body = await req.json();

    const requestId = body?.request_id;
    const status = body?.status?.trim()?.toLowerCase();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ request_id" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected", "reversed"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "สถานะไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (
      status === "approved" &&
      !hasPermission(user, "benefit.request.approve")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์อนุมัติ" },
        { status: 403 }
      );
    }


    if (
      status === "reversed" &&
      !hasPermission(user, "benefit.request.reverse")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์คืนสิทธิ์คำขอ" },
        { status: 403 }
      );
    }

    if (
      status === "rejected" &&
      !hasPermission(user, "benefit.request.reject")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ปฏิเสธคำขอ" },
        { status: 403 }
      );
    }

    const { data: currentRequest, error: currentRequestError } =
      await supabaseAdmin
        .from("benefit_requests")
        .select(`
          id,
          request_no,
          employee_id,
          benefit_id,
          requested_amount,
          approved_amount,
          status
        `)
        .eq("id", requestId)
        .maybeSingle();

    if (currentRequestError) {
      return NextResponse.json(
        { success: false, error: currentRequestError.message },
        { status: 500 }
      );
    }

    if (!currentRequest) {
      return NextResponse.json(
        { success: false, error: "ไม่พบคำขอ" },
        { status: 404 }
      );
    }

    if (status === "approved" && currentRequest.status === "approved") {
      return NextResponse.json(
        { success: false, error: "คำขอนี้อนุมัติไปแล้ว" },
        { status: 400 }
      );
    }

    if (status === "reversed" && currentRequest.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "คืนสิทธิ์ได้เฉพาะคำขอที่อนุมัติแล้วเท่านั้น" },
        { status: 400 }
      );
    }

    if (currentRequest.status === "rejected") {
      return NextResponse.json(
        { success: false, error: "คำขอนี้ถูกปฏิเสธไปแล้ว" },
        { status: 400 }
      );
    }

    const payload = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "reversed") {
      payload.approved_by = null;
      payload.approved_at = null;
    }

    if (status === "approved") {
      payload.approved_by = user.id;
      payload.approved_at = new Date().toISOString();
      payload.approved_amount =
        currentRequest.approved_amount || currentRequest.requested_amount || 0;
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .update(payload)
      .eq("id", requestId)
      .select(`
        id,
        request_no,
        employee_id,
        benefit_id,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
        approved_by,
        approved_at,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error("BENEFIT_APPROVALS_PUT_QUERY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let deduction = null;

    if (status === "approved") {
      try {
        deduction = await autoDeductBenefitUsage({
          request: data,
          user,
        });
      } catch (deductionError) {
        await supabaseAdmin
          .from("benefit_requests")
          .update({
            status: currentRequest.status,
            approved_by: null,
            approved_at: null,
            approved_amount: currentRequest.approved_amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        return NextResponse.json(
          {
            success: false,
            error: deductionError.message || "ตัดสิทธิ์อัตโนมัติไม่สำเร็จ",
          },
          { status: 500 }
        );
      }
    }


    let reverse = null;

    if (status === "reversed") {
      try {
        reverse = await reverseDeductBenefitUsage({
          request: data,
          user,
        });
      } catch (reverseError) {
        return NextResponse.json(
          {
            success: false,
            error: reverseError.message || "คืนสิทธิ์อัตโนมัติไม่สำเร็จ",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data,
      deduction,
      reverse,
    });
  } catch (error) {
    console.error("BENEFIT_APPROVALS_PUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "อัปเดตสถานะไม่สำเร็จ" },
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

    if (!hasPermission(user, "benefit.request.delete")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบคำขอ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BENEFIT_APPROVALS_DELETE_QUERY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BENEFIT_APPROVALS_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}