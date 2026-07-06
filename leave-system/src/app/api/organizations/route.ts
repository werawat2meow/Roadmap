import { NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const token = await getTokenPayload();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("branches")
    .select("id, branch_name")
    .order("branch_name");

  if (error) {
    console.error("GET /api/organizations error:", error);
    return NextResponse.json({ error: "Failed to load organizations" }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((row: any) => ({ id: row.id, name: row.branch_name }))
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Organization create is not supported in this leave-system configuration." },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Organization update is not supported in this leave-system configuration." },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Organization delete is not supported in this leave-system configuration." },
    { status: 501 }
  );
}
