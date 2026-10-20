import { NextResponse } from "next/server";
import { withActivity, writeActivity } from "@/app/recruitment/lib/activity/server";
import { approvalAccess, approveApplication, approvalFailure, isApprovalId, MAX_APPROVAL_BATCH } from "../approval";

async function handlePOST(request) {
  const guard = await approvalAccess();
  if (!guard.ok) return guard.response;
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const items = body?.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_APPROVAL_BATCH ||
    items.some(item => !item || !isApprovalId(item.application_id) || !isApprovalId(item.role_id)) ||
    new Set(items.map(item => item.application_id.toLowerCase())).size !== items.length) {
    return NextResponse.json({ message: `เลือก 1–${MAX_APPROVAL_BATCH} ใบสมัครที่ไม่ซ้ำ และระบุ Role ให้ครบ` }, { status: 400 });
  }
  const results = [];
  // Bounded, sequential work avoids bursts against Auth and the code-number RPC.
  for (const item of items) {
    let result;
    try {
      result = await approveApplication({ application_id: item.application_id, role_id: item.role_id });
    } catch (error) {
      result = { application_id: item.application_id, ...approvalFailure(error) };
    }
    results.push(result);
    await writeActivity(request, guard.user, {
      page_path: "/recruitment/approve_employees", action: "APPROVE", resource_type: "candidate",
      resource_id: item.application_id, status: result.success ? "SUCCESS" : "FAILED",
      http_status: result.success ? 200 : result.http_status,
    });
  }
  return NextResponse.json({
    success: results.every(result => result.success), results,
    succeeded: results.filter(result => result.success).length,
    failed: results.filter(result => !result.success).length,
  });
}

export const POST = withActivity(handlePOST, {
  page_path: "/recruitment/approve_employees", action: "APPROVE", resource_type: "candidate",
});
