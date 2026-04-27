import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { logActivity } from "@/lib/logActivity";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data: oldData, error: findError } = await supabaseAdmin
      .from("api_clients")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !oldData) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ API Client ที่ต้องการแก้ไข",
        },
        { status: 404 }
      );
    }

    const payload = {};

    if (body.client_code !== undefined) {
      const client_code = body.client_code?.trim()?.toUpperCase() || "";

      if (!client_code) {
        return NextResponse.json(
          {
            success: false,
            message: "Client Code ห้ามว่าง",
          },
          { status: 400 }
        );
      }

      const { data: duplicate } = await supabaseAdmin
        .from("api_clients")
        .select("id")
        .eq("client_code", client_code)
        .neq("id", id)
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

      payload.client_code = client_code;
    }

    if (body.client_name !== undefined) {
      const client_name = body.client_name?.trim() || "";

      if (!client_name) {
        return NextResponse.json(
          {
            success: false,
            message: "Client Name ห้ามว่าง",
          },
          { status: 400 }
        );
      }

      payload.client_name = client_name;
    }

    if (body.description !== undefined) {
      payload.description = body.description?.trim() || null;
    }

    if (body.contact_name !== undefined) {
      payload.contact_name = body.contact_name?.trim() || null;
    }

    if (body.contact_email !== undefined) {
      payload.contact_email = body.contact_email?.trim() || null;
    }

    if (body.is_active !== undefined) {
      payload.is_active = !!body.is_active;
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("api_clients")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    await logActivity({
      moduleName: "API_CLIENTS",
      actionType: "UPDATE",
      referenceTable: "api_clients",
      referenceId: data.id,
      description: `อัปเดต API Client: ${data.client_name} (${data.client_code})`,
      oldData,
      newData: data,
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดต API Client สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/admin/api-clients/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปเดต API Client ได้",
      },
      { status: 500 }
    );
  }
}


export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("api_clients")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบสำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถลบได้",
      },
      { status: 500 }
    );
  }
}