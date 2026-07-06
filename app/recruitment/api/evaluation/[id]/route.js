import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { evaluation, status } = body;

  const payload = {updated_at:new Date().toISOString(),};

  if (typeof evaluation === "string") {
    if (!evaluation.trim()) {
      return NextResponse.json(
        { message: "evaluation is required" },
        { status: 400 }
      );
    }
    payload.evaluation = evaluation.trim();
  }

  if (typeof status === "boolean") {
    payload.status = status;
  }

  const { data, error } = await supabaseAdmin
    .from("recruit_evaluation")
    .update(payload)
    .eq("id", id)
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

export async function DELETE(request, { params }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("recruit_evaluation")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}