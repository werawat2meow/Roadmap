import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log("[server] /api/debug-session →", session);
  return NextResponse.json(session ?? null);
}
