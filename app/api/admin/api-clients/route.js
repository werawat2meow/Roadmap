import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { logActivity } from "@/lib/logActivity";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 10), 1),
      100
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("api_clients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        [
          `client_code.ilike.%${search}%`,
          `client_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
          `contact_name.ilike.%${search}%`,
          `contact_email.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    }

    if (status === "inactive") {
      query = query.eq("is_active", false);
    }

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
    console.error("GET /api/admin/api-clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลด API Clients ได้",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const client_code = body.client_code?.trim()?.toUpperCase() || "";
    const client_name = body.client_name?.trim() || "";
    const description = body.description?.trim() || null;
    const contact_name = body.contact_name?.trim() || null;
    const contact_email = body.contact_email?.trim() || null;
    const is_active =
      typeof body.is_active === "boolean" ? body.is_active : true;

    if (!client_code || !client_name) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอก Client Code และ Client Name",
        },
        { status: 400 }
      );
    }

    const { data: duplicate } = await supabaseAdmin
      .from("api_clients")
      .select("id")
      .eq("client_code", client_code)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Client Code นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const payload = {
      client_code,
      client_name,
      description,
      contact_name,
      contact_email,
      is_active,
    };

    const { data, error } = await supabaseAdmin
      .from("api_clients")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    await logActivity({
      moduleName: "API_CLIENTS",
      actionType: "CREATE",
      referenceTable: "api_clients",
      referenceId: data.id,
      description: `สร้าง API Client: ${data.client_name} (${data.client_code})`,
      newData: data,
    });

    return NextResponse.json({
      success: true,
      message: "สร้าง API Client สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("POST /api/admin/api-clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถสร้าง API Client ได้",
      },
      { status: 500 }
    );
  }
}