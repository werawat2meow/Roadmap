import { NextResponse } from "next/server";
import { getCurrentRoadmapAccess } from "@/lib/roadmap/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await getCurrentRoadmapAccess();

    if (!access.ok) {
      return access.response;
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId: access.employeeId,
        isSuperAdmin: access.isSuperAdmin,
        menus: access.menus,
      },
    });
  } catch (error: unknown) {
    console.error("Load current Roadmap access failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถตรวจสอบสิทธิ์ Roadmap ได้",
      },
      { status: 500 },
    );
  }
}