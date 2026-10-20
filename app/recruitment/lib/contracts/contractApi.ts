import { NextResponse } from "next/server";

import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import { getContractAccessScope } from "./contractData";
import { ContractDataError } from "./errors";

const CONTRACT_PERMISSION_MODULE = "recruitment.report.approve.emp";
const CONTRACT_PERMISSION_ACTION = "view";

export type ContractApiErrorCode =
  | "INVALID_CONTRACT_ID"
  | "INVALID_SIGNER_ID"
  | "INVALID_EMPLOYER_SIGNATURE_TYPE"
  | "INVALID_REQUEST_BODY"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_SIGNER"
  | "CONTRACT_NOT_FOUND"
  | "CONTRACT_NOT_ELIGIBLE"
  | "CONTRACT_DATA_INCOMPLETE"
  | "DATABASE_ERROR"
  | "PDF_GENERATION_FAILED";

export function contractErrorResponse(
  error: ContractApiErrorCode,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

/**
 * IDs in the current source are strings, but no generated database type proves
 * that every deployment uses UUID columns. This validates a safe opaque ID
 * without guessing a stricter database type.
 */
export function isValidContractIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

export async function authorizeContractAccess(contractId: string, action: "view" | "edit" = CONTRACT_PERMISSION_ACTION) {
  const guard = await requireScopedAccess(
    CONTRACT_PERMISSION_MODULE,
    action,
    {
      scopeType: "employee",
      lineageScope: true,
    },
  );

  if (
    !guard.ok ||
    !("canAccessEmployee" in guard) ||
    typeof guard.canAccessEmployee !== "function"
  ) {
    const status = guard.response?.status ?? 403;
    return {
      ok: false as const,
      response:
        status === 401
          ? contractErrorResponse(
              "UNAUTHENTICATED",
              "กรุณาเข้าสู่ระบบก่อนใช้งาน",
              401,
            )
          : status >= 500
            ? contractErrorResponse(
                "DATABASE_ERROR",
                "ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้",
                500,
              )
          : contractErrorResponse(
              "FORBIDDEN",
              "คุณไม่มีสิทธิ์ส่งออกสัญญาจ้าง",
              403,
            ),
    };
  }

  const scope = await getContractAccessScope(contractId);

  if (!guard.canAccessEmployee(scope)) {
    return {
      ok: false as const,
      response: contractErrorResponse(
        "FORBIDDEN",
        "คุณไม่มีสิทธิ์เข้าถึงสัญญาจ้างนี้",
        403,
      ),
    };
  }

  return { ok: true as const, guard, scope };
}

export function contractDataErrorResponse(
  error: unknown,
  fallbackCode: ContractApiErrorCode,
  fallbackMessage: string,
): NextResponse {
  if (!(error instanceof ContractDataError)) {
    return contractErrorResponse(fallbackCode, fallbackMessage, 500);
  }

  switch (error.code) {
    case "INVALID_ID":
      return contractErrorResponse(
        "INVALID_CONTRACT_ID",
        "รหัสสัญญาไม่ถูกต้อง",
        400,
      );
    case "NOT_FOUND":
      return contractErrorResponse(
        "CONTRACT_NOT_FOUND",
        "ไม่พบข้อมูลสัญญาจ้าง",
        404,
      );
    case "NOT_APPROVED":
      return contractErrorResponse(
        "CONTRACT_NOT_ELIGIBLE",
        "สามารถส่งออกสัญญาได้เฉพาะใบสมัครสถานะ 15 หรือ 17",
        403,
      );
    case "SIGNER_NOT_ALLOWED":
      return contractErrorResponse(
        "INVALID_SIGNER",
        "ผู้ลงนามที่เลือกไม่มีสิทธิ์ลงนามในสัญญานี้",
        403,
      );
    case "INCOMPLETE_DATA":
      return contractErrorResponse(
        "CONTRACT_DATA_INCOMPLETE",
        error.message,
        422,
      );
    case "DATABASE_ERROR":
      return contractErrorResponse(
        "DATABASE_ERROR",
        error.message,
        500,
      );
    default:
      return contractErrorResponse(fallbackCode, fallbackMessage, 500);
  }
}
