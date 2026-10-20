import { NextRequest } from "next/server";
import { POST as applicationPOST } from "@/app/jobs/api/application/route";
import { GET as titleNames } from "@/app/jobs/api/title_name/route";
import { GET as genders } from "@/app/jobs/api/gender/route";
import { GET as maritalStatuses } from "@/app/jobs/api/marital-status/route";
import { GET as nationalities } from "@/app/jobs/api/nationality/route";
import { GET as religions } from "@/app/jobs/api/religion/route";
import { GET as addresses } from "@/app/jobs/api/geothai/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { activityUser, withActivity } from "../../../lib/activity/server";

export const runtime = "nodejs";

// Invoke the existing server handlers exactly once, in the same request/session.
// No HTTP origin is accepted from the caller and no credentials leave this server.
const endpoints = new Map([
  ["application", { method: "POST", path: "/jobs/api/application", handler: applicationPOST, activity: { action: "create", resource_type: "candidate", page_path: "/recruitment/candidate/create" } }],
  ["title_name", { method: "GET", path: "/jobs/api/title_name", handler: titleNames }],
  ["gender", { method: "GET", path: "/jobs/api/gender", handler: genders }],
  ["marital-status", { method: "GET", path: "/jobs/api/marital-status", handler: maritalStatuses }],
  ["nationality", { method: "GET", path: "/jobs/api/nationality", handler: nationalities }],
  ["religion", { method: "GET", path: "/jobs/api/religion", handler: religions }],
  ["geothai", { method: "GET", path: "/jobs/api/geothai", handler: addresses }],
  ["logout", { method: "POST", path: "/api/auth/logout", handler: logout, activity: { action: "LOGOUT", resource_type: "session", page_path: "/recruitment" } }],
]);

async function dispatch(request, context) {
  const { endpoint } = await context.params;
  const target = endpoints.get(endpoint);
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });
  if (target.method !== request.method) return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: target.method } });
  const invoke = (incoming) => {
    const url = new URL(incoming.url);
    url.pathname = target.path;
    const forwarded = new NextRequest(url, {
      method: incoming.method, headers: incoming.headers, signal: incoming.signal,
      ...(incoming.body ? { body: incoming.body, duplex: "half" } : {}),
    });
    // Return the original Response, preserving status, cookies, headers and bytes.
    return target.handler(forwarded);
  };
  if (target.activity) return withActivity(invoke, target.activity)(request, context);
  try {
    if (!await activityUser()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    console.error("RECRUITMENT_BRIDGE_AUTH_FAILED");
    return Response.json({ error: "Authentication unavailable" }, { status: 503 });
  }
  return invoke(request);
}

export const GET = dispatch;
export const POST = dispatch;
