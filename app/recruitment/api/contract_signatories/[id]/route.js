import { withActivity } from "@/app/recruitment/lib/activity/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const table = "recruit_contract_signatories";

async function handlePUT(request, { params }) {
  try {
    const { id } = await params;
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
      !id ||
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
      .update({
        emp_name_th: empNameTh,
        emp_name_en: empNameEn,
        position_id: positionId,
      })
      .eq("id", id)
      .select("id, emp_name_th, emp_name_en, position_id, status")
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("PUT contract_signatories error:", error);

    return NextResponse.json(
      { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
}

async function handlePATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id || typeof body.status !== "boolean") {
      return NextResponse.json(
        { message: "สถานะไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        status: body.status,
      })
      .eq("id", id)
      .select("id, emp_name_th, emp_name_en, position_id, status")
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("PATCH contract_signatories error:", error);

    return NextResponse.json(
      { message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
}

export const PUT = withActivity(handlePUT, {"page_path": "/recruitment/setting/contract_signatories", "action": "UPDATE", "resource_type": "contract_signatories", "idField": "id"});
export const PATCH = withActivity(handlePATCH, {"page_path": "/recruitment/setting/contract_signatories", "action": "UPDATE_STATUS", "resource_type": "contract_signatories", "idField": "id"});
