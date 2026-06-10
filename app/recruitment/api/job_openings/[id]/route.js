import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("recruit_job_open")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
  });
}

export async function PUT(request, { params }) {
  const { id } = await params;

  const body = await request.json();

  const { error } = await supabaseAdmin
    .from("recruit_job_open")
    .update(body)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
  });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("recruit_job_open")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
  });
}