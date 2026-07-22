// ไฟล์นี้เป็นไฟล์เดิมที่มีอยู่แล้ว — ไม่ต้องแก้ไข วางไว้เพื่ออ้างอิงเท่านั้น
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserIdFromRequest() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    const userId = decoded?.user_id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    return userId;
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();

    const userId = await getUserIdFromRequest();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const branchId = payload.branch_id;
    const departmentId = payload.department_id;
    const divisionId = payload.division_id;
    const unitId = payload.unit_id;
    const positionId = payload.position_id;
    const openingCount = payload.opening_count;

    if (
      !branchId ||
      !departmentId ||
      !divisionId ||
      !unitId ||
      !positionId ||
      !openingCount ||
      !payload.start_date ||
      !payload.end_date
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        },
        { status: 400 }
      );
    }

    // ============================
    // เช็คข้อมูลเดิม
    // ============================
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("recruit_job_open")
      .select("id")
      .eq("branch_id", branchId)
      .eq("department_id", departmentId)
      .eq("division_id", divisionId)
      .eq("unit_id", unitId)
      .eq("position_id", positionId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        {
          success: false,
          message: checkError.message,
        },
        { status: 500 }
      );
    }

    const saveData = {
      branch_id: branchId,
      department_id: departmentId,
      division_id: divisionId,
      unit_id: unitId,
      position_id: positionId,
      opening_count: openingCount,
      start_date: payload.start_date,
      end_date: payload.end_date,
      urgent: Boolean(payload.urgent),
      user_update: userId,
      status: true,
    };

    let result;
    let error;
    let message;

    if (existing) {
      // ============================
      // UPDATE
      // ============================
      ({ data: result, error } = await supabaseAdmin
        .from("recruit_job_open")
        .update(saveData)
        .eq("id", existing.id)
        .select()
        .single());

      message = "อัปเดตข้อมูลเรียบร้อย";
    } else {
      // ============================
      // INSERT
      // ============================
      ({ data: result, error } = await supabaseAdmin
        .from("recruit_job_open")
        .insert([
          {
            ...saveData,
            user_create: userId,
          },
        ])
        .select()
        .single());

      message = "บันทึกข้อมูลเรียบร้อย";
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}