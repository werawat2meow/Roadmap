import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

//  Header : authorization  
//  Value : ต้องส่งมาในรูปแบบ Bearer token หรือ Hanuman token เท่านั้น

export async function validateApiKey(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";

    const allowedSchemes = ["Bearer ", "Hanuman_world_Token "];

    const matchedScheme = allowedSchemes.find((scheme) => authHeader.startsWith(scheme));

    if (!matchedScheme) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Missing or invalid Authorization header",
          },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.replace(matchedScheme, "").trim();

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Token is empty",
          },
          { status: 401 }
        ),
      };
    }

    // 🔑 extract prefix
    const parts = token.split("_");
    const tokenPrefix =
      parts.length >= 3
        ? `${parts[0]}_${parts[1]}_${parts[2]}`
        : token.slice(0, 16);

    const tokenHash = sha256(token);

    const { data, error } = await supabaseAdmin
      .from("api_tokens")
      .select(`
        id,
        client_id,
        token_name,
        token_prefix,
        token_hash,
        is_active,
        expires_at,
        client:api_clients (
          id,
          client_code,
          client_name,
          is_active
        )
      `)
      .eq("token_prefix", tokenPrefix)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Invalid API Token",
          },
          { status: 401 }
        ),
      };
    }

    // 🔐 compare hash
    if (data.token_hash !== tokenHash) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Invalid API Token",
          },
          { status: 401 }
        ),
      };
    }

    // 🚫 client inactive
    if (!data.client?.is_active) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Client is inactive",
          },
          { status: 403 }
        ),
      };
    }

    // ⏳ expire check
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Token expired",
          },
          { status: 401 }
        ),
      };
    }

    // 🕒 update last_used_at
    await supabaseAdmin
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return {
      success: true,
      client: data.client,
      token: {
        id: data.id,
        name: data.token_name,
      },
    };
  } catch (err) {
    console.error("validateApiKey error:", err);

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Token validation failed",
        },
        { status: 500 }
      ),
    };
  }
}