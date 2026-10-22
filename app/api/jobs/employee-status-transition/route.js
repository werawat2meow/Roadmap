import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data, error } = await supabaseAdmin.rpc("ems_finalize_resignations_th");
    if (error) throw error;
    return NextResponse.json({ success: true, transitioned: data ?? 0 });
  } catch (error) {
    console.error("EMPLOYEE_STATUS_CRON_ERROR", error);
    return NextResponse.json({ success: false, error: "Job failed" }, { status: 500 });
  }
}
