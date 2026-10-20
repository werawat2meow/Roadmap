import { supabaseAdmin } from "@/lib/supabaseServer";
import { orientationAccess } from "../../lib/orientation/access";
import { orientationData } from "../../lib/orientation/readData.mjs";
import { evidenceForRows } from "../../lib/orientation/evidence.mjs";
import { boundedBody, sameOrigin, mutationGuard, previousResult, prepareMutation, commitMutation, mutationError } from "../../lib/orientation/mutationServer";
import { OrientationError } from "../../lib/orientation/mutations.mjs";
import { privateJson } from "../../lib/orientation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    sameOrigin(request);
    if (!request.headers.get("content-type")?.includes("application/json")) throw new OrientationError("ต้องส่ง JSON", 415);
    let payload;
    try { payload = JSON.parse((await boundedBody(request, 64000)).toString("utf8")); }
    catch (error) { if (error instanceof OrientationError) throw error; throw new OrientationError("JSON ไม่ถูกต้อง"); }
    if (payload?.action === "photo.add") throw new OrientationError("ใช้ช่องทางอัปโหลดรูป");
    const guard = await mutationGuard(payload);
    if (!guard.ok) return guard.response;
    const existing = await previousResult(guard, payload);
    if (existing) return Response.json({ success: true, data: existing, replayed: true });
    const prepared = await prepareMutation(guard, payload);
    const data = await commitMutation(request, guard, payload, prepared);
    return Response.json({ success: true, data });
  } catch (error) { return mutationError(error); }
}

export async function GET(request) {
  const purpose = new URL(request.url).searchParams.get("purpose");
  if (purpose && purpose !== "export") return Response.json({ error: "Invalid purpose" }, { status: 400 });
  const guard = await orientationAccess(purpose === "export" ? "export" : "view");
  if (!guard.ok) return guard.response;
  try {
    const result = await orientationData(supabaseAdmin, guard);
    if (purpose === "export") result.rows = await evidenceForRows(supabaseAdmin, result.rows, guard);
    return privateJson(result);
  } catch (error) {
    const duplicate = error.message === "ORIENTATION_DUPLICATE_PARTICIPANT";
    console.error("ORIENTATION_READ_FAILED", { code: duplicate ? error.message : error.code || "READ_ERROR" });
    return Response.json({ error: duplicate ? "พบรายการ Orientation ซ้ำของพนักงาน กรุณาตรวจสอบข้อมูลก่อนทำรายงาน" : "ไม่สามารถโหลดข้อมูล Orientation ได้" }, { status: duplicate ? 409 : 500 });
  }
}
