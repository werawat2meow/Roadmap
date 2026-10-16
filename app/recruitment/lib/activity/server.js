import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { AsyncLocalStorage } from "node:async_hooks";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { allowedPage, actions, safeId } from "./policy";

const activityContext = new AsyncLocalStorage();

// Only server handlers may report IDs/actions established by their DB operations.
export function setActivityDetails(details) {
  const context = activityContext.getStore();
  if (context) Object.assign(context, details);
}

export async function activityUser() {
  const auth = await getAuthenticatedUser();
  return auth?.error ? null : auth?.user;
}

export function requestIP(request) {
  // Set ONLY behind a proxy that removes/overwrites this header on every request.
  // Never trust client-supplied Forwarded/X-Forwarded-For by default.
  const header = process.env.RECRUITMENT_TRUSTED_IP_HEADER;
  const value = header ? request.headers.get(header)?.trim() : null;
  return value && isIP(value) ? value : null;
}

export function eventRowId(userId, eventId) {
  const hex = createHash("sha256").update(`${userId}:${eventId}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function writeActivity(request, user, event) {
  try {
    if (!user?.id || !allowedPage(event.page_path) || !actions.includes(event.action)) {
      throw new Error("INVALID_ACTIVITY");
    }
    const row = {
      id: eventRowId(user.id, event.event_id || randomUUID()),
      user_id: user.id,
      page_path: event.page_path,
      action: event.action,
      ip_address: requestIP(request),
      status: event.status,
      resource_type: event.resource_type || null,
      resource_id: safeId(event.resource_id),
      // Construct metadata server-side; never spread a client payload here.
      metadata: event.http_status ? { http_status: event.http_status } : {},
    };
    // created_at is deliberately omitted: use the database default.
    const { error } = await supabaseAdmin.from("recruitment_activity_logs").insert(row);
    if (error && error.code !== "23505") {
      console.error("RECRUITMENT_ACTIVITY_WRITE_FAILED", { code: error.code || "DATABASE_ERROR" });
      return false;
    }
    return true;
  } catch {
    console.error("RECRUITMENT_ACTIVITY_WRITE_FAILED", { code: "LOGGER_ERROR" });
    return false;
  }
}

async function requestResource(request, field) {
  if (!field || request.method === "GET") return null;
  try {
    const copy = request.clone();
    if (request.headers.get("content-type")?.includes("application/json")) {
      return safeId((await copy.json())?.[field]);
    }
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      return safeId((await copy.formData()).get(field));
    }
  } catch { /* The original handler owns request validation. */ }
  return null;
}

export function withActivity(handler, config) {
  return async function activityHandler(request, context) {
    let user;
    try {
      user = await activityUser();
    } catch {
      console.error("RECRUITMENT_ACTIVITY_AUTH_FAILED");
      return Response.json({ error: "Authentication unavailable" }, { status: 503 });
    }
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const params = await context?.params;
    let resourceId = safeId(params?.id || params?.shareLinkId) || await requestResource(request, config.idField);
    let response;
    const details = {};
    try {
      response = await activityContext.run(details, () => handler(request, context));
    } catch (error) {
      await writeActivity(request, user, { ...config, ...details, resource_id: safeId(details.resource_id) || resourceId, status: "FAILED", http_status: 500 });
      throw error;
    }
    let body;
    // Binary exports stay streamed. Only inspect JSON, without consuming the response.
    if (response.headers.get("content-type")?.includes("application/json")) {
      try { body = await response.clone().json(); } catch { /* Preserve the response. */ }
    }
    resourceId = safeId(details.resource_id) || safeId(body?.data?.id || body?.id) || resourceId;
    const failed = !response.ok || body?.success === false || Boolean(body?.error);
    const action = details.action || (typeof config.resolveAction === "function" ? config.resolveAction(response, body) : config.action);
    await writeActivity(request, user, {
      ...config, action, resource_id: resourceId,
      status: failed ? "FAILED" : "SUCCESS", http_status: response.status,
    });
    return response;
  };
}
