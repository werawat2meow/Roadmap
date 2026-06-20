import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  let query = supabaseAdmin
    .from("recruit_job_description")
    .select(`
      branch_id,
      branches!inner (
        id,
        branch_name,
        status
      )
    `)
    .eq("branches.status", "active");

  if (q) {
    query = query.ilike("branches.branch_name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // ลบข้อมูล branch ซ้ำ
  const uniqueBranches = new Map();

  (data || []).forEach((row) => {
    const branch = row.branches;

    if (branch && !uniqueBranches.has(branch.id)) {
      uniqueBranches.set(branch.id, {
        id: branch.id,
        label: branch.branch_name,
      });
    }
  });

  return NextResponse.json(
    Array.from(uniqueBranches.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  );
}