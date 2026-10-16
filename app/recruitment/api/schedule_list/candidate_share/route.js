import { withActivity } from "@/app/recruitment/lib/activity/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function handlePOST(request) {
  try {
    const { application_id } =
      await request.json();

    if (!application_id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ Application ID",
        },
        {
          status: 400,
        }
      );
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    const { error } = await supabaseAdmin
      .from("recruit_candidate_share_tokens")
      .insert({
        application_id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (error) { throw error; }

    const origin = request.headers.get("origin");

    const url = `${origin}/jobs/interview-candidates/${application_id}?token=${token}`;

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message, },
      { status: 500, }
    );
  }
}
export const POST = withActivity(handlePOST, {"page_path": "/recruitment/schedule_list", "action": "SHARE", "resource_type": "schedule_list", "idField": "application_id"});
