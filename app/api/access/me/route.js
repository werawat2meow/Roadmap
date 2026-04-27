/*
  🔑 STEP 2: ใช้ accessToken เรียก API  ยืนยันตัวตน
  GET http://localhost:3000/api/access/me
  Header 
  Authorization: Bearer xxxxx (เอา accessToken มาใส่)
            หรือ Hanuman



  const accessToken = localStorage.getItem("accessToken");
  const res = await fetch("/api/access/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await res.json();

*/
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const payload = await verifyAccessToken(token);

    const { data: user, error } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        auth_user_id,
        employee_id,
        role_id,
        username,
        is_active,
        employees (
          employee_code,
          first_name_th,
          last_name_th
        ),
        roles (
          role_code,
          role_name
        )
      `)
      .eq("id", payload.user_id)
      .maybeSingle();

    if (error) throw error;

    if (!user || !user.is_active) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        auth_user_id: user.auth_user_id,
        employee_id: user.employee_id,
        username: user.username,
        role_id: user.role_id,
        role_code: user.roles?.role_code || "",
        role_name: user.roles?.role_name || "",
        employee_code: user.employees?.employee_code || "",
        employee_name: `${user.employees?.first_name_th || ""} ${
          user.employees?.last_name_th || ""
        }`.trim(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}