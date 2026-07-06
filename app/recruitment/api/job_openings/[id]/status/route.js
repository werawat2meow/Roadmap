import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const { error } = await supabaseAdmin
    .from("recruit_job_open")
    .update({
      status: body.status,
    })
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