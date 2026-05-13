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

  if (error || !data || !data.is_active) return null;

  return data;
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

    if (!user.employee_id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Employee ID ของผู้ใช้งาน" },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    const { count: activeBenefitCount } = await supabaseAdmin
      .from("benefits")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: pendingRequestCount } = await supabaseAdmin
      .from("benefit_requests")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", user.employee_id)
      .in("status", ["pending", "in_review"]);

    const { count: usedThisYearCount } = await supabaseAdmin
      .from("benefit_usages")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", user.employee_id)
      .gte("usage_date", `${currentYear}-01-01`)
      .lte("usage_date", `${currentYear}-12-31`);

    const { data: entitlements } = await supabaseAdmin
      .from("benefit_entitlements")
      .select("remaining_amount")
      .eq("employee_id", user.employee_id)
      .eq("entitlement_year", currentYear)
      .eq("status", "active");

    const remainingAmount =
      entitlements?.reduce(
        (sum, item) => sum + Number(item.remaining_amount || 0),
        0
      ) || 0;

    return NextResponse.json({
      success: true,
      data: {
        active_benefits: activeBenefitCount || 0,
        pending_requests: pendingRequestCount || 0,
        used_this_year: usedThisYearCount || 0,
        remaining_amount: remainingAmount,
      },
    });
  } catch (error) {
    console.error("BENEFIT_SUMMARY_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการโหลดข้อมูล Benefit Summary" },
      { status: 500 }
    );
  }
}