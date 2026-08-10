import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { buildUserAccessContext } from "@/lib/auth/buildUserAccessContext";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: auth?.error || "Unauthorized" },
        { status: auth?.status || 401 }
      );
    }

    const user = await buildUserAccessContext(auth.user);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("AUTH_ME_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้" },
      { status: 500 }
    );
  }
}
