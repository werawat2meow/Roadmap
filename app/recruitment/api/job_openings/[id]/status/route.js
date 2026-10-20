import { withActivity } from "@/app/recruitment/lib/activity/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function handlePATCH(request, { params }) {
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
export const PATCH = withActivity(handlePATCH, {"page_path": "/recruitment/setting/job_openings", "action": "UPDATE_STATUS", "resource_type": "job_openings", "idField": "id"});
