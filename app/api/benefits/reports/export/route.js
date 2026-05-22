import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
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
      role_id,
      is_active,
      roles (
        role_code
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

export async function GET(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canExport =
      hasPermission(user, "benefit.report.export") ||
      hasPermission(user, "benefit.report.manage");

    if (!canExport) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ Export รายงาน" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const benefitId = searchParams.get("benefitId") || "";
    const status = (searchParams.get("status") || "").trim().toLowerCase();

    let query = supabaseAdmin
      .from("benefit_requests")
      .select(`
        id,
        request_no,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
        approved_at,
        created_at,
        employees (
          employee_code,
          first_name_th,
          last_name_th
        ),
        benefits (
          benefit_code,
          benefit_name,
          benefit_type
        )
      `);

    if (dateFrom) query = query.gte("request_date", dateFrom);
    if (dateTo) query = query.lte("request_date", dateTo);
    if (benefitId) query = query.eq("benefit_id", benefitId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query
      .order("request_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (data || []).map((item, index) => {
      const emp = item.employees;
      const benefit = item.benefits;

      return {
        No: index + 1,
        "Request No": item.request_no || "",
        "Request Date": item.request_date || "",
        "Employee Code": emp?.employee_code || "",
        "Employee Name": `${emp?.first_name_th || ""} ${
          emp?.last_name_th || ""
        }`.trim(),
        "Benefit Code": benefit?.benefit_code || "",
        "Benefit Name": benefit?.benefit_name || "",
        "Benefit Type": benefit?.benefit_type || "",
        "Requested Amount": Number(item.requested_amount || 0),
        "Approved Amount": Number(item.approved_amount || 0),
        Status: item.status || "",
        Remark: item.remark || "",
        "Reject Reason": item.reject_reason || "",
        "Approved At": item.approved_at || "",
        "Created At": item.created_at || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
      { wch: 30 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Benefit Report");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="benefit-report.xlsx"`,
      },
    });
  } catch (error) {
    console.error("BENEFIT_REPORT_EXPORT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Export รายงานไม่สำเร็จ" },
      { status: 500 }
    );
  }
}