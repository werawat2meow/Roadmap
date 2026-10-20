import "server-only";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { orientationAccess } from "./access";
import { buildMutation, mutationActions, OrientationError, requestHash, uuid } from "./mutations.mjs";
import { writeActivity } from "../activity/server";

export async function boundedBody(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) throw new OrientationError("ไม่มีข้อมูลคำขอ");
  const chunks = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new OrientationError("ข้อมูลใหญ่เกินกำหนด", 413); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new OrientationError("Forbidden", 403);
}

export async function mutationGuard(payload) {
  if (!mutationActions.includes(payload?.action)) throw new OrientationError("การดำเนินการไม่ถูกต้อง");
  uuid(payload.request_id);
  const action = /\.(close|reopen)$/.test(payload.action) ? "close" : "edit";
  const guard = await orientationAccess(action);
  return guard;
}

export async function previousResult(guard, payload) {
  const { data, error } = await supabaseAdmin.from("recruit_orientation_status_logs").select("created_by,action,reason").eq("id", payload.request_id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  let details;
  try { details = JSON.parse(data.reason); } catch { throw new OrientationError("รหัสคำขอซ้ำ", 409); }
  if (data.created_by !== guard.user.id || data.action !== payload.action || details.request_hash !== requestHash(payload)) throw new OrientationError("รหัสคำขอเดิมถูกใช้กับข้อมูลต่างกัน กรุณาเปิดฟอร์มใหม่", 409);
  return details.result;
}

export async function prepareMutation(guard, payload, options) {
  return buildMutation(supabaseAdmin, guard, payload, options);
}

export async function commitMutation(request, guard, payload, prepared) {
  const { error, data } = await supabaseAdmin.rpc("recruit_orientation_commit", {
    p_actor: guard.user.id, p_request_id: payload.request_id, p_action: payload.action,
    p_fingerprint: prepared.fingerprint, p_expected: prepared.plan.expected, p_operations: prepared.plan.operations,
  });
  if (error) throw error;
  await writeActivity(request, guard.user, { action: payload.action.endsWith(".create") || (payload.action === "session.save" && !payload.session_id) ? "CREATE" : "UPDATE_STATUS", page_path: "/recruitment/orientation", resource_type: "orientation", resource_id: data?.id, event_id: payload.request_id, status: "SUCCESS", http_status: 200 });
  return data;
}

export function mutationError(error) {
  if (error instanceof OrientationError) return Response.json({ error: error.message }, { status: error.status });
  const code = error?.code;
  if (code === "PGRST202" || code === "42883") return Response.json({ error: "ต้องติดตั้งฟังก์ชันจาก app/recruitment/lib/orientation/application-identity-transaction.sql ก่อนบันทึก" }, { status: 503 });
  if (code === "40001" || code === "40P01" || code === "23505") return Response.json({ error: "ข้อมูลเปลี่ยนหรือมีรายการซ้ำ กรุณาโหลดใหม่แล้วลองอีกครั้ง" }, { status: 409 });
  console.error("ORIENTATION_MUTATION_FAILED", { code: code || "UNKNOWN" });
  return Response.json({ error: "ไม่สามารถยืนยันผลบันทึกได้ กรุณาลองซ้ำด้วยคำขอเดิม หรือตรวจรายการก่อนสร้างใหม่" }, { status: 503 });
}
