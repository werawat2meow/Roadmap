import { NextResponse } from "next/server";

import { getContractSigners } from "@/app/recruitment/lib/contracts";
import {
  authorizeContractAccess,
  contractDataErrorResponse,
  contractErrorResponse,
  isValidContractIdentifier,
} from "@/app/recruitment/lib/contracts/contractApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SignersRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: SignersRouteContext,
) {
  const { id } = await params;

  if (!isValidContractIdentifier(id)) {
    return contractErrorResponse(
      "INVALID_CONTRACT_ID",
      "รหัสสัญญาไม่ถูกต้อง",
      400,
    );
  }

  try {
    const authorization = await authorizeContractAccess(id);
    if (!authorization.ok) return authorization.response;

    const signers = await getContractSigners(id);

    return NextResponse.json(
      { data: signers },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET_CONTRACT_SIGNERS_ERROR", { contractId: id, error });
    return contractDataErrorResponse(
      error,
      "DATABASE_ERROR",
      "ไม่สามารถอ่านข้อมูลผู้ลงนามได้",
    );
  }
}

