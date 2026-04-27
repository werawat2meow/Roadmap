import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { logActivity } from "@/lib/logActivity";
import { generateApiToken } from "@/lib/tokenUtils";

function cleanTokenName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[็]/g, "")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
    .replace(/^["'“”‘’`´]+|["'“”‘’`´]+$/g, "")
    .trim();
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("api_tokens")
      .select(`
        id,
        client_id,
        token_name,
        token_prefix,
        last_used_at,
        expires_at,
        is_active,
        revoked_at,
        created_at,
        client:api_clients (
          id,
          client_code,
          client_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("GET /api/admin/api-tokens error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลด API Tokens ได้",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {

    const body = await req.json();
    const client_id = body.client_id || null;
    const token_name = cleanTokenName(body.token_name);
    const expires_at = body.expires_at || null;

    if (!client_id || !token_name) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเลือก Client และกรอก Token Name",
        },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from("api_clients")
      .select("id, client_code, client_name, is_active")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ API Client ที่เลือก",
        },
        { status: 404 }
      );
    }

    if (!client.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: "API Client นี้ถูกปิดการใช้งานอยู่",
        },
        { status: 400 }
      );
    }

    const { plainToken, tokenPrefix, tokenHash } = generateApiToken();

    const insertPayload = {
      client_id,
      token_name,
      token_prefix: tokenPrefix,
      token_hash: tokenHash,
      expires_at,
      is_active: true,
    };

    const { data, error } = await supabaseAdmin
      .from("api_tokens")
      .insert(insertPayload)
      .select(`
        id,
        client_id,
        token_name,
        token_prefix,
        expires_at,
        is_active,
        created_at
      `)
      .single();

    if (error) throw error;

    await logActivity({
      moduleName: "API_TOKENS",
      actionType: "CREATE",
      referenceTable: "api_tokens",
      referenceId: data.id,
      description: `สร้าง API Token: ${token_name} สำหรับ ${client.client_name} (${client.client_code})`,
      newData: {
        ...data,
        plain_token_shown_once: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "สร้าง API Token สำเร็จ",
      data: {
        id: data.id,
        plain_token: plainToken,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/api-tokens error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถสร้าง API Token ได้",
      },
      { status: 500 }
    );
  }
}