import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
} from "./getAuthenticatedUser";

import {
  getUserAccessContext,
} from "./getUserAccessContext";

import {
  hasAccessPermission,
} from "./applyAccessScope";

export async function requireAccess(
  permissionCode
) {
  const auth =
    await getAuthenticatedUser();

  if (!auth.user) {
    return {
      ok: false,

      response:
        NextResponse.json(
          {
            success: false,
            error: auth.error,
          },
          {
            status:
              auth.status || 401,
          }
        ),
    };
  }

  const accessContext =
    await getUserAccessContext(
      auth.user.id
    );

  if (
    permissionCode &&
    !hasAccessPermission(
      accessContext,
      permissionCode
    )
  ) {
    return {
      ok: false,

      response:
        NextResponse.json(
          {
            success: false,
            error:
              "คุณไม่มีสิทธิ์ใช้งานส่วนนี้",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    ok: true,

    user: auth.user,

    decoded: auth.decoded,

    access: accessContext,
  };
}