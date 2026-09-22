import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const table = "recruit_contract_signatories";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id, emp_name, status")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const empName = typeof body.emp_name === "string" ? body.emp_name.trim() : "";

    if (!empName) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อ-นามสกุล" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([{ emp_name: empName, status: true }])
      .select("id, emp_name, status")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
}
