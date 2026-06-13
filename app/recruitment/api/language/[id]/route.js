import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(_request, { params }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("recruit_language")
    .select("id, language_name, language_slug, language_img, status, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const language_name = String(body.language_name ?? "").trim();
    const language_slug = String(body.language_slug ?? "").trim();
    const language_img = String(body.language_img ?? "").trim();
    const status = body.status === false ? false : true;

    if (!language_name || !language_slug) {
      return NextResponse.json(
        { message: "กรุณากรอก language_name, language_slug" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("recruit_language")
      .update({
        language_name,
        language_slug,
        language_img,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, language_name, language_slug, language_img, status, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

export async function PATCH(request, { params }) {
    
  try {
    const { id } = await params;
    const body = await request.json();

    const { status } = body;

    if (typeof status !== "boolean") {
      return NextResponse.json(
        { message: "status ต้องเป็น boolean" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("recruit_language")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("recruit_language")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Deleted" });
}