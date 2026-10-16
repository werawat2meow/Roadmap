import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

export async function GET() {
  try {
    const guard = await requireScopedAccess("access.activity_logs", "view");
    if (!guard.ok) return guard.response;

    // Supabase PostgREST has no DISTINCT endpoint. Use SQL RPC for a complete,
    // scalable list rather than downloading all audit rows to the browser.
    const { data, error } = await supabaseAdmin.rpc("activity_log_filter_options");
    if (error) throw error;
    const modules = Array.isArray(data?.modules) ? data.modules : [];
    const actions = Array.isArray(data?.actions) ? data.actions : [];
    const statuses = Array.isArray(data?.statuses) ? data.statuses : [];
    const systems = Array.isArray(data?.systems) ? data.systems : [];
    return NextResponse.json({
      success: true,
      data: {
        modules: modules.map(value => ({ label: value, value })),
        actions: actions.map(value => ({ label: value, value })),
        statuses: statuses.map(value => ({ label: value, value })),
        systems: systems.map(value => ({ label: value, value })),
      },
    });
  } catch (error) {
    console.error("GET_ACTIVITY_LOG_OPTIONS_ERROR", error);
    return NextResponse.json({ success: false, error: "ไม่สามารถโหลดตัวกรอง Log ได้ กรุณารัน SQL Migration" }, { status: 500 });
  }
}
