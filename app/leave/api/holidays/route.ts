import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function formatDateForInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("leave_holidays")
      .select("id,title,date,note,createdAt,updatedAt")
      .order("date", { ascending: true });

    if (error) throw error;

    const holidays = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      date: formatDateForInput(item.date),
      note: item.note ?? "",
    }));

    return NextResponse.json({
      success: true,
      data: holidays,
    });
  } catch (error: any) {
    console.error("Load leave holidays failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load leave holidays failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, date, note } = body;

    if (!title?.trim() || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุวันที่และชื่อวันหยุด",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leave_holidays")
      .insert({
        title: title.trim(),
        date,
        note: note?.trim() || null,
      })
      .select("id,title,date,note,createdAt,updatedAt")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        date: formatDateForInput(data.date),
        note: data.note ?? "",
      },
    });
  } catch (error: any) {
    console.error("Create leave holiday failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Create leave holiday failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing holiday id",
        },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("leave_holidays")
      .delete()
      .eq("id", Number(id));

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Delete leave holiday failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Delete leave holiday failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, date, note } = body;

    if (!id || !title?.trim() || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุข้อมูลวันหยุดให้ครบถ้วน",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leave_holidays")
      .update({
        title: title.trim(),
        date,
        note: note?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", Number(id))
      .select("id,title,date,note,createdAt,updatedAt")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        date: formatDateForInput(data.date),
        note: data.note ?? "",
      },
    });
  } catch (error: any) {
    console.error("Update leave holiday failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Update leave holiday failed",
      },
      { status: 500 },
    );
  }
}