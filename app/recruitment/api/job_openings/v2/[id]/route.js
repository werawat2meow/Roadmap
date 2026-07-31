// ไฟล์ใหม่ — เพิ่มเพื่อรองรับการแก้ไข (edit) ในหน้าเดียวกับหน้าบันทึก
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { cookies } from "next/headers";

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

// GET /recruitment/api/job_openings/:id
// ใช้ดึงข้อมูล record เดิมมาแสดงในฟอร์มตอนกดแก้ไข
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("recruit_job_open")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
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

// PUT /recruitment/api/job_openings/:id
// ใช้แก้ไข record เดิม (จำนวนที่เปิดรับ, ช่วงวันที่, ด่วน/ไม่ด่วน, สถานะ)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const payload = await request.json();

    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      !payload.opening_count ||
      !payload.start_date ||
      !payload.end_date
    ) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const updateData = {
      opening_count: payload.opening_count,
      start_date: payload.start_date,
      end_date: payload.end_date,
      urgent: Boolean(payload.urgent),
      status: payload.status !== undefined ? Boolean(payload.status) : true,
      updated_at: new Date().toISOString(),
      user_update: userId,
    };

    const { data, error } = await supabaseAdmin
      .from("recruit_job_open")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลเรียบร้อย",
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
