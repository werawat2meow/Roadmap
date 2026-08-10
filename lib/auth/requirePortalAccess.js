import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { getUserAccessContext } from "@/lib/auth/getUserAccessContext";
import { hasAccessPermission } from "@/lib/auth/applyAccessScope";

function errorResponse(error, status = 500) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

export async function requireAuthenticatedAccess() {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return {
        ok: false,
        response: errorResponse(auth?.error || "Unauthorized", auth?.status || 401),
      };
    }

    const access = await getUserAccessContext(auth.user.id);

    return {
      ok: true,
      user: auth.user,
      decoded: auth.decoded,
      access,
    };
  } catch (error) {
    console.error("REQUIRE_AUTHENTICATED_ACCESS_ERROR:", error);

    return {
      ok: false,
      response: errorResponse("ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้", 500),
    };
  }
}

export async function requirePermission(permissionCode) {
  const result = await requireAuthenticatedAccess();

  if (!result.ok) return result;

  if (
    permissionCode &&
    !hasAccessPermission(result.access, permissionCode)
  ) {
    return {
      ok: false,
      response: errorResponse("คุณไม่มีสิทธิ์ใช้งานส่วนนี้", 403),
    };
  }

  return result;
}
