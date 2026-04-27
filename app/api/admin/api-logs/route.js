import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔹 Filters
    const client_id = searchParams.get("client_id");
    const method = searchParams.get("method");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");

    // 🔹 Pagination (สำคัญ)
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 10), 1),
      100
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 🔹 Base Query
    let query = supabaseAdmin
      .from("api_access_logs")
      .select(
        `
        id,
        client_id,
        token_id,
        method,
        endpoint,
        request_ip,
        user_agent,
        status_code,
        is_success,
        request_query,
        request_body,
        response_body,
        error_message,
        created_at,
        client:api_clients (
          id,
          client_code,
          client_name
        )
      `,
        { count: "exact" } // ⭐ เอา total count
      )
      .order("created_at", { ascending: false })
      .range(from, to); // ⭐ จำกัดข้อมูล

    // 🔹 Filters
    if (client_id) {
      query = query.eq("client_id", client_id);
    }

    if (method) {
      query = query.eq("method", method.toUpperCase());
    }

    if (status === "success") {
      query = query.eq("is_success", true);
    }

    if (status === "error") {
      query = query.eq("is_success", false);
    }

    if (date_from) {
      query = query.gte("created_at", date_from);
    }

    if (date_to) {
      query = query.lte("created_at", date_to);
    }

    if (search) {
      query = query.or(
        [
          `endpoint.ilike.%${search}%`,
          `method.ilike.%${search}%`,
          `request_ip.ilike.%${search}%`,
          `user_agent.ilike.%${search}%`,
          `error_message.ilike.%${search}%`,
        ].join(",")
      );
    }

    // 🔹 Execute
    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/api-logs error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลด API Logs ได้",
      },
      { status: 500 }
    );
  }
}