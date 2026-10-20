import { supabaseAdmin } from "@/lib/supabaseServer";
import { orientationAccess } from "../../../lib/orientation/access";
import { readAll, readByIds, orientationData } from "../../../lib/orientation/readData.mjs";
import { normalizedStatus } from "../../../lib/orientation/mutations.mjs";
import { privateJson } from "../../../lib/orientation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await orientationAccess("view"); if (!guard.ok) return guard.response;
  try {
    const employees = await readAll(() => guard.applyEmployeeScope(supabaseAdmin.from("employees").select("id,employee_code,first_name_th,last_name_th,first_name_en,last_name_en,branch_id,department_id,division_id,unit_id,is_deleted")));
    const staff = employees.filter((e) => !e.is_deleted);
    const staffMap = new Map(staff.map((e) => [e.id, e]));
    const [allSessions, allParticipants, locations, eligible] = await Promise.all([
      readAll(() => supabaseAdmin.from("recruit_orientation_sessions").select("*")),
      readAll(() => supabaseAdmin.from("recruit_orientation_participants").select("*")),
      readAll(() => supabaseAdmin.from("recruit_orientation_locations").select("id,location_name,color_hex,is_active")),
      orientationData(supabaseAdmin, guard),
    ]);
    const applicationMap = new Map(eligible.rows.map(row => [row.application_id, row]));
    const participants = allParticipants.filter(p => applicationMap.get(p.application_id)?.participant_id === p.id)
      .map(p => ({ ...p, full_name: applicationMap.get(p.application_id).full_name }));
    const visible = new Set(participants.map((p) => p.id));
    const sessions = allSessions.flatMap((s) => {
      const people = allParticipants.filter((p) => p.session_id === s.id);
      const canManage = people.length ? people.every((p) => visible.has(p.id)) : guard.hasAllScope || s.created_by === guard.user.id;
      if (!canManage && !people.some((p) => visible.has(p.id))) return [];
      return [{ ...s, status: normalizedStatus(s.status), can_manage: canManage }];
    });
    const [facilitators, handovers, logs] = await Promise.all([
      readByIds(supabaseAdmin, "recruit_orientation_facilitators", "id,session_id,employee_id", "session_id", sessions.map((s) => s.id)),
      readByIds(supabaseAdmin, "recruit_orientation_handovers", "id,participant_id,receiver_employee_id,receiver_name_snapshot,handover_at,handover_location,notes", "participant_id", participants.map((p) => p.id)),
      readByIds(supabaseAdmin, "recruit_orientation_status_logs", "id,session_id,participant_id,action,from_status,to_status,reason,created_at", "session_id", sessions.map((s) => s.id)),
    ]);
    const manageable = new Set(sessions.filter((s) => s.can_manage).map((s) => s.id));
    const history = logs.filter((log) => visible.has(log.participant_id) || manageable.has(log.session_id)).map(({ reason, ...log }) => {
      let note = ""; try { note = JSON.parse(reason)?.note || ""; } catch { note = reason || ""; }
      return { ...log, note }; // Do not expose the stored before/after snapshots.
    });
    return privateJson({
      employees: staff.map((e) => ({ id: e.id, label: `${e.employee_code || ""} ${[e.first_name_th, e.last_name_th].filter(Boolean).join(" ") || [e.first_name_en, e.last_name_en].filter(Boolean).join(" ")}`.trim() })),
      sessions: sessions.map((s) => ({ ...s, facilitator_ids: facilitators.filter((f) => f.session_id === s.id && staffMap.has(f.employee_id)).map((f) => f.employee_id) })),
      participants: participants.map((p) => ({ ...p, attendance_status: normalizedStatus(p.attendance_status), site_visit_status: normalizedStatus(p.site_visit_status), workflow_status: normalizedStatus(p.workflow_status) })),
      locations, handovers, history,
    });
  } catch (error) {
    console.error("ORIENTATION_MANAGE_READ_FAILED", { code: error.code || "READ_ERROR" });
    return Response.json({ error: "โหลดข้อมูลจัดการ Orientation ไม่สำเร็จ" }, { status: 500 });
  }
}
