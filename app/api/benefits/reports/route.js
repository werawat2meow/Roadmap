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

  return { ...data, permissions };
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

    if (!user.permissions.includes("benefit.report.view")) {
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
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: "โหลดรายงานไม่สำเร็จ" },
        { status: 500 }
      );
    }

    const rows = data || [];

    const summary = {
      total_requests: rows.length,
      approved_requests: rows.filter((x) => x.status === "approved").length,
      pending_requests: rows.filter((x) =>
        ["pending", "in_review"].includes(x.status)
      ).length,
      total_amount: rows.reduce(
        (sum, item) => sum + Number(item.approved_amount || item.requested_amount || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      summary,
      data: rows,
    });
  } catch (error) {
    console.error("BENEFIT_REPORTS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}