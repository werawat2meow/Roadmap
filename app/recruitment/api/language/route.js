import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("recruit_language")
    .select("id, language_name, language_slug, language_img, status, created_at, updated_at")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const language_name = String(body.language_name ?? "").trim();
    const language_slug = String(body.language_slug ?? "").trim().toUpperCase();
    const language_img = String(body.language_img ?? "").trim();
    const status = true;
    const updated_at = new Date().toISOString();
    
    if (!language_name || !language_slug) {
      return NextResponse.json(
        { message: "กรุณากรอก language_name, language_slug" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("recruit_language")
      .insert({
        language_name,
        language_slug,
        language_img,
        status,
        updated_at,
      })
      .select("id, language_name, language_slug, language_img, status, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}