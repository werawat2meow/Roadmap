import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("recruit_evaluation")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function POST(request) {
  const body = await request.json();
  const { evaluation } = body;
  console.log(body);
  
  if (!evaluation || !evaluation.trim()) {
    return NextResponse.json(
      { message: "evaluation is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("recruit_evaluation")
    .insert([
      {
        evaluation: evaluation.trim(),
        status: true,
        updated_at:new Date().toISOString(),
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}