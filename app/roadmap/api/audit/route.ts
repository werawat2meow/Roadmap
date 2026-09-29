import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { writeRoadmapAuditLog } from "@/lib/roadmap/auditLog";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const { page, action, targetType, targetId, description, metadata } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Missing action" },
        { status: 400 },
      );
    }

    await writeRoadmapAuditLog({
      userId: auth.user.id,
      page: page ?? null,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      description: description ?? null,
      metadata: metadata ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Audit API failed:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Audit failed" },
      { status: 500 },
    );
  }
}