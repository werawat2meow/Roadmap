import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { logActivity } from "@/lib/logActivity";

export async function PATCH(req, { params }) {
  try {
    const { id } =await params;
    const body = await req.json();

    const { data: oldData, error: findError } = await supabaseAdmin
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
        created_at
      `)
      .eq("id", id)
      .single();

    if (findError || !oldData) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ API Token ที่ต้องการแก้ไข",
        },
        { status: 404 }
      );
    }

    const payload = {};

    if (body.is_active !== undefined) {
      payload.is_active = !!body.is_active;
    }

    if (body.revoked_at !== undefined) {
      payload.revoked_at = body.revoked_at;
    }

    if (body.expires_at !== undefined) {
      payload.expires_at = body.expires_at;
    }

    const { data, error } = await supabaseAdmin
      .from("api_tokens")
      .update(payload)
      .eq("id", id)
      .select(`
        id,
        client_id,
        token_name,
        token_prefix,
        last_used_at,
        expires_at,
        is_active,
        revoked_at,
        created_at
      `)
      .single();

    if (error) throw error;

    const actionType =
      body.is_active === false ? "REVOKE" : "UPDATE";

    await logActivity({
      moduleName: "API_TOKENS",
      actionType,
      referenceTable: "api_tokens",
      referenceId: data.id,
      description:
        body.is_active === false
          ? `Revoke API Token: ${data.token_name}`
          : `อัปเดต API Token: ${data.token_name}`,
      oldData,
      newData: data,
    });

    return NextResponse.json({
      success: true,
      message:
        body.is_active === false
          ? "Revoke API Token สำเร็จ"
          : "อัปเดต API Token สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/admin/api-tokens/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปเดต API Token ได้",
      },
      { status: 500 }
    );
  }
}