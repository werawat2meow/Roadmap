import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { executeEmployeeMigrationRow } from "@/lib/imports/employeeMigration";
import { checkAccess, getJob, getRows, validateRows, actorId } from "@/lib/imports/employeeMigrationDraft";
const fail = (s, c = 400) => NextResponse.json({ success: false, error: s }, { status: c });
export const runtime = "nodejs";
export async function POST(req, { params }) {
  try {
    const view = await checkAccess("view"); if (!view.ok) return view.response;
    const create = await checkAccess("create"), edit = await checkAccess("edit"); const { jobId } = await params;
    const job = await getJob(view, jobId); if (!job) return fail("ไม่พบ Job", 404); if (job.status !== "ready") return fail("กรุณาแก้ไขทุกแถวให้ผ่าน Validation ก่อนยืนยัน", 409);
    const saved = await getRows(jobId); if (saved.length !== job.total_rows) return fail("จำนวนรายการไม่ตรงกับ Job", 409);
    const checked = await validateRows(saved, view); if (checked.summary.invalid) return fail("Master หรือ Scope มีการเปลี่ยนแปลง กรุณากลับไปตรวจ Mapping", 409);
    for (const r of checked.rows) { const guard = r.action === "insert" ? create : edit; if (!guard.ok || !guard.canAccessEmployee(r.employee_payload)) return fail(`ไม่มีสิทธิ์ ${r.action} สำหรับแถว ${r.row_no}`, 403); }
    // Atomic job claim prevents parallel confirmation; rows are idempotent on retries.
    const { data: claimed, error: claimError } = await supabaseAdmin.from("data_import_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", jobId).eq("status", "ready").select("id").maybeSingle(); if (claimError) throw claimError; if (!claimed) return fail("Job กำลังถูกดำเนินการ หรือถูกยืนยันแล้ว", 409);
    let inserted = 0, updated = 0, failed = 0;
    for (let i = 0; i < saved.length; i++) {
      const r = saved[i], candidate = checked.rows[i];
      if (r.status === "imported") continue;
      try {
        const result = await executeEmployeeMigrationRow({ row: candidate, actorId: actorId(view) });
        const { error } = await supabaseAdmin.from("data_import_rows").update({ action: candidate.action, status: "imported", employee_id: result.employee_id, error_messages: [] }).eq("id", r.id); if (error) throw error;
        if (candidate.action === "insert") inserted++; else updated++;
      } catch (e) { failed++; const { error } = await supabaseAdmin.from("data_import_rows").update({ status: "failed", error_messages: [e.message || "Import failed"] }).eq("id", r.id); if (error) console.error("MIGRATION_ROW_UPDATE_FAILED", error); }
    }
    const { error: doneError } = await supabaseAdmin.from("data_import_jobs").update({ status: failed ? "completed_with_errors" : "completed", inserted_rows: inserted, updated_rows: updated, failed_rows: failed, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId); if (doneError) throw doneError;
    return NextResponse.json({ success: true, message: failed ? "นำเข้าสำเร็จบางส่วน กรุณาตรวจรายการผิดพลาด" : "นำเข้าพนักงานสำเร็จ", summary: { inserted, updated, failed }, job_id: jobId });
  } catch (e) { console.error("EMPLOYEE_MIGRATION_DRAFT_CONFIRM", e); return fail(e.message || "ยืนยันไม่สำเร็จ", 500) }
}
