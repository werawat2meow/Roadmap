import { withActivity } from "@/app/recruitment/lib/activity/server";
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

async function handlePUT(request, { params }) {
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

async function handleDELETE(request, { params }) {
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
export const PUT = withActivity(handlePUT, {"page_path": "/recruitment/setting/job_openings", "action": "UPDATE", "resource_type": "job_openings", "idField": "id"});
export const DELETE = withActivity(handleDELETE, {"page_path": "/recruitment/setting/job_openings", "action": "DELETE", "resource_type": "job_openings", "idField": "id"});
