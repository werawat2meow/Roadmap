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
        employee_id,
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

    return data;
  } catch (error) {
    console.error("GET_CURRENT_USER_HISTORY_ERROR:", error);
    return null;
  }
}

function isBenefitAdmin(user) {
  const roleCode =
    user?.roles?.role_code ||
    user?.role_code ||
    user?.role;

  return ["SUPER_ADMIN", "HR_ADMIN", "BENEFIT_ADMIN"].includes(roleCode);
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

    const adminView = isBenefitAdmin(user);

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
        benefits (
          id,
          benefit_code,
          benefit_name
        ),
        employees (
          id,
          employee_code,
          first_name_th,
          last_name_th
        )
      `)
      .order("created_at", { ascending: false });

    if (!adminView) {
      if (!user.employee_id) {
        return NextResponse.json(
          { success: false, error: "ไม่พบข้อมูลพนักงาน" },
          { status: 400 }
        );
      }

      query = query.eq("employee_id", user.employee_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("BENEFIT_REQUEST_HISTORY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      adminView,
      total: data?.length || 0,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_REQUEST_HISTORY_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลดประวัติคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}