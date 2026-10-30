import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { getLeaveAuditPage } from "@/lib/leave-audit-pages";
import { writeLeaveAuditLog } from "@/lib/leave-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const auth = await requirePermission("leave.view");

    if (!auth.ok) return auth.response;

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type ไม่ถูกต้อง" },
        { status: 415 },
      );
    }

    // ไม่รับการส่ง log จากเว็บไซต์อื่นผ่าน browser
    if (request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json(
        { success: false, error: "ไม่อนุญาตคำขอจากเว็บไซต์อื่น" },
        { status: 403 },
      );
    }

    const raw = await request.text();

    if (raw.length > 4096) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลมีขนาดเกินกำหนด" },
        { status: 413 },
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("Invalid body");
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (
      typeof body.eventId !== "string" ||
      !UUID.test(body.eventId) ||
      typeof body.pagePath !== "string" ||
      body.pagePath.length > 200
    ) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลเปิดหน้าไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const page = getLeaveAuditPage(body.pagePath);

    if (!page) {
      return NextResponse.json(
        { success: false, error: "ไม่พบหน้าที่อนุญาตให้บันทึก" },
        { status: 400 },
      );
    }

    const result = await writeLeaveAuditLog({
      request,
      actor: auth.user,

      eventId: body.eventId,
      requestId,

      // Browser แจ้งว่าเปิดหน้า ไม่ใช่หลักฐานว่าทำรายการสำเร็จ
      eventSource: "BROWSER",
      eventType: "NAVIGATION",
      action: "PAGE_VIEW",
      outcome: "INFO",

      pageName: page.pageName,
      pagePath: page.pagePath,

      description: `เปิดเมนู ${page.pageName}`,

      metadata: {
        reported_by: "leave_page_tracker",
      },
    });

    return NextResponse.json({
      success: true,
      eventId: result.id,
      duplicate: result.duplicate,
    });
  } catch (error) {
    console.error("Leave page audit failed:", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "บันทึกประวัติเปิดหน้าไม่สำเร็จ",
        requestId,
      },
      { status: 500 },
    );
  }
}