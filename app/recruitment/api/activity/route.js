import { activityUser, writeActivity } from "../../lib/activity/server";
import { allowedPage, browserActions } from "../../lib/activity/policy";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "JSON required" }, { status: 415 });
  }
  let user;
  try { user = await activityUser(); } catch {
    console.error("RECRUITMENT_ACTIVITY_AUTH_FAILED");
    return Response.json({ error: "Authentication unavailable" }, { status: 503 });
  }
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    // Bound the read even when Content-Length is missing or dishonest.
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    let size = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return Response.json({ error: "Too large" }, { status: 413 }); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return Response.json({ error: "Invalid event" }, { status: 400 }); }
  if (!body || Object.keys(body).some((key) => !["action", "page_path", "event_id"].includes(key)) ||
      !browserActions.includes(body.action) || !allowedPage(body.page_path) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.event_id || "")) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }
  const saved = await writeActivity(request, user, {
    action: body.action, page_path: body.page_path, event_id: body.event_id,
    status: body.action === "PAGE_VIEW" ? "OBSERVED" : "REQUESTED",
  });
  return Response.json({ accepted: saved }, { status: saved ? 200 : 503 });
}
