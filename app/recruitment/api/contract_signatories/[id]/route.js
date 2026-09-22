import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const table = "recruit_contract_signatories";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const empName = typeof body.emp_name === "string" ? body.emp_name.trim() : "";

    if (!id || !empName) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อ-นามสกุล" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ emp_name: empName })
      .eq("id", id)
      .select("id, emp_name, status")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id || typeof body.status !== "boolean") {
      return NextResponse.json({ message: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ status: body.status })
      .eq("id", id)
      .select("id, emp_name, status")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
}
