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

    const userId = decoded?.user_id;

    if (!userId) return null;

    const { data } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        username,
        is_active
      `)
      .eq("id", userId)
      .maybeSingle();

    if (!data || !data.is_active) return null;

    return data;
  } catch {
    return null;
  }
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

    let query = supabaseAdmin
      .from("benefit_notifications")
      .select(`
        id,
        employee_id,
        user_account_id,
        title,
        message,
        notification_type,
        ref_table,
        ref_id,
        is_read,
        created_at,
        read_at
      `);

    if (user.employee_id) {
      query = query.or(
        `user_account_id.eq.${user.id},employee_id.eq.${user.employee_id}`
      );
    } else {
      query = query.eq("user_account_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      unread: data?.filter((item) => !item.is_read)?.length || 0,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_NOTIFICATION_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลด Notification ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Notification Id" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("benefit_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (user.employee_id) {
      query = query.or(
        `user_account_id.eq.${user.id},employee_id.eq.${user.employee_id}`
      );
    } else {
      query = query.eq("user_account_id", user.id);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อ่าน Notification แล้ว",
    });
  } catch (error) {
    console.error("BENEFIT_NOTIFICATION_PUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "อัปเดต Notification ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Notification Id" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("benefit_notifications")
      .delete()
      .eq("id", id);

    if (user.employee_id) {
      query = query.or(
        `user_account_id.eq.${user.id},employee_id.eq.${user.employee_id}`
      );
    } else {
      query = query.eq("user_account_id", user.id);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบ Notification สำเร็จ",
    });
  } catch (error) {
    console.error("BENEFIT_NOTIFICATION_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบ Notification ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}