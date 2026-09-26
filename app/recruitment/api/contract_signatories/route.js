import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const table = "recruit_contract_signatories";

export async function GET() {
  const [signatoriesResult, positionsResult] = await Promise.all([
    supabaseAdmin
      .from(table)
      .select("id, emp_name_th, emp_name_en, position_id, status")
      .order("id", { ascending: true }),
    supabaseAdmin
      .from("positions")
      .select("id, position_name")
      .order("position_name", { ascending: true }),
  ]);

  if (signatoriesResult.error || positionsResult.error) {
    return NextResponse.json(
      {
        message:
          signatoriesResult.error?.message || positionsResult.error?.message,
      },
      { status: 500 }
    );
  }

  const positions = positionsResult.data || [];
  const positionNameById = new Map(
    positions.map((position) => [String(position.id), position.position_name])
  );
  const data = (signatoriesResult.data || []).map((signatory) => ({
    ...signatory,
    position_name:
      positionNameById.get(String(signatory.position_id)) || null,
  }));

  return NextResponse.json({ data, positions });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const empNameTh =
      typeof body.emp_name_th === "string"
        ? body.emp_name_th.trim()
        : "";

    const empNameEn =
      typeof body.emp_name_en === "string"
        ? body.emp_name_en.trim()
        : "";
    const positionId = body.position_id;

    if (
      !empNameTh ||
      !empNameEn ||
      positionId === null ||
      positionId === undefined ||
      positionId === ""
    ) {
      return NextResponse.json(
        {
          message:
            "กรุณากรอกชื่อ-นามสกุลทั้งภาษาไทยและภาษาอังกฤษ และเลือกตำแหน่ง",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([
        {
          emp_name_th: empNameTh,
          emp_name_en: empNameEn,
          position_id: positionId,
          status: true,
        },
      ])
      .select("id, emp_name_th, emp_name_en, position_id, status")
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST contract_signatories error:", error);

    return NextResponse.json(
      { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
}
