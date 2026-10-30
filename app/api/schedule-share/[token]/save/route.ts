import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { RequestError, saveScheduleBatch } from "@/lib/leave-schedule-batch-save";
import {
  employeeInShareScope,
  getScheduleShareLink,
  scheduleShareHeaders,
} from "@/lib/leave-schedule-share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ success: false, error: "คำขอไม่ถูกต้อง" }, { status: 403, headers: scheduleShareHeaders });
  }
  if (Number(request.headers.get("content-length") || 0) > 10 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "ข้อมูลมีขนาดใหญ่เกินไป" }, { status: 413, headers: scheduleShareHeaders });
  }
  const { token } = await params;
  const link = await getScheduleShareLink(token);
  if (!link) {
    return NextResponse.json({ success: false, error: "ลิงก์หมดอายุหรือถูกยกเลิก" }, { status: 410, headers: scheduleShareHeaders });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.entries)) {
    return NextResponse.json({ success: false, error: "ข้อมูลตารางไม่ถูกต้อง" }, { status: 400, headers: scheduleShareHeaders });
  }

  const response = await saveScheduleBatch(new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveAndPublish",
      year: link.year,
      month: link.month,
      entries: body.entries,
    }),
  }), {
    actorId: null,
    shareLinkId: link.id,
    async checkEmployeeScope(employeeIds) {
      for (let offset = 0; offset < employeeIds.length; offset += 100) {
        const chunk = employeeIds.slice(offset, offset + 100);
        let query = supabaseAdmin.from("employees").select("id, branch_id, department_id, division_id, unit_id")
          .in("id", chunk).eq("is_deleted", false).eq("status", "active")
          .eq("branch_id", link.branch_id).eq("department_id", link.department_id);
        if (link.division_id) query = query.eq("division_id", link.division_id);
        if (link.unit_id) query = query.eq("unit_id", link.unit_id);
        const { data, error } = await query;
        if (error) throw error;
        if (data?.length !== chunk.length) throw new RequestError("พนักงานอยู่นอกขอบเขตลิงก์", 403);
      }
    },
    assertEmployee(employee) {
      if (!employeeInShareScope(employee, link)) {
        throw new RequestError("ขอบเขตพนักงานเปลี่ยน กรุณาโหลดตารางใหม่", 409);
      }
    },
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
