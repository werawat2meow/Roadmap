import { withActivity } from "@/app/recruitment/lib/activity/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function handlePUT(request, { params }) {
    
  const { id } = await params;
  const body = await request.json();  
  const position_id = body.position_id;
  const job_to_language = body.job_to_language ?? {};
  const updated_at = new Date().toISOString();

  if (!id || !position_id) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const updated = await supabaseAdmin
    .from("recruit_job_mix_language")
    .update({
      position_id,
      job_to_language,
      updated_at,
    })
    .eq("id", id)
    .select("id, position_id, job_to_language")
    .single();

  if (updated.error) {
    return NextResponse.json({ message: updated.error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "updated", data: updated.data });
}

async function handleDELETE(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const deleted = await supabaseAdmin
    .from("recruit_job_mix_language")
    .delete()
    .eq("id", id);

  if (deleted.error) {
    return NextResponse.json({ message: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "deleted" });
}
export const PUT = withActivity(handlePUT, {"page_path": "/recruitment/setting/job_language", "action": "UPDATE", "resource_type": "job_language", "idField": "position_id"});
export const DELETE = withActivity(handleDELETE, {"page_path": "/recruitment/setting/job_language", "action": "DELETE", "resource_type": "job_language", "idField": "position_id"});
