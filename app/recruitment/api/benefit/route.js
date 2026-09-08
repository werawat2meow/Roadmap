import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // เดิม: รองรับ ?branches_id=xxx (ค่าเดียว)
    const branchesId = searchParams.get("branches_id");

    // ใหม่: รองรับ ?branch_id=1&branch_id=2 (หลายค่า จากฟอร์มที่เลือกได้หลาย Company)
    const branchIdsMulti = searchParams.getAll("branch_id");

    // รวมทั้งสองแบบเป็น array เดียว เพื่อ query ด้วย .in()
    const branchIds =
      branchIdsMulti.length > 0
        ? branchIdsMulti
        : branchesId
          ? [branchesId]
          : [];

    // ==========================================
    // ถ้ามี branch id(s) ให้ดึงสวัสดิการของสังกัดนั้น
    // ==========================================
    if (branchIds.length > 0) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("recruit_benefit_center")
        .select(
          "id, branches_id, benefit_name, sort_order"
        )
        .in("branches_id", branchIds)
        .order("sort_order", {
          ascending: true,
        });

      if (error) {
        console.error(
          "GET recruit_benefit_center error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถโหลดข้อมูลสวัสดิการได้",
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,
        benefits: data || [],
      });
    }

    // ==========================================
    // โหลด Branches
    // ==========================================
    const {
      data: branches,
      error: branchesError,
    } = await supabaseAdmin
      .from("branches")
      .select("id, branch_name")
      .order("branch_name", {
        ascending: true,
      });

    if (branchesError) {
      console.error(
        "GET branches error:",
        branchesError
      );

      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถโหลดข้อมูลสังกัดได้",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // โหลด Languages
    // ==========================================
    const {
      data: languages,
      error: languagesError,
    } = await supabaseAdmin
      .from("recruit_language")
      .select( "language_slug, language_name")
      .eq("status", true)
      .order("language_slug", {
        ascending: false,
      });

    if (languagesError) {
      console.error(
        "GET recruit_language error:",
        languagesError
      );

      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถโหลดข้อมูลภาษาได้",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      branches: branches || [],
      languages: languages || [],
    });
  } catch (error) {
    console.error(
      "GET /recruitment/api/benefits error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      branches_id,
      benefits,
    } = body;

    // =========================
    // Validation
    // =========================
    if (!branches_id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือกสังกัด" },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(benefits) ||
      benefits.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "กรุณาเพิ่มรายการสวัสดิการอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    // =========================
    // ตรวจสอบ branches
    // =========================
    const {
      data: branch,
      error: branchError,
    } = await supabaseAdmin
      .from("branches")
      .select("id")
      .eq("id", branches_id)
      .maybeSingle();

    if (branchError) {
      console.error(
        "Check branch error:",
        branchError
      );

      return NextResponse.json(
        { success: false, message: "ไม่สามารถตรวจสอบสังกัดได้" },
        { status: 500 }
      );
    }

    if (!branch) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลสังกัด" },
        { status: 404 }
      );
    }

    // =========================
    // เตรียมข้อมูล
    // =========================
    const insertData = benefits.map(
      (benefit) => ({
        branches_id,
        benefit_name:
          benefit.benefit_name || {},
        sort_order:
          Number(benefit.sort_order) || 1,
      })
    );

    // =========================
    // Insert recruit_benefit_center
    // =========================
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("recruit_benefit_center")
      .insert(insertData)
      .select();

    if (error) {
      console.error(
        "Insert recruit_benefit_center error:",
        error
      );

      return NextResponse.json(
        { success: false, message: "ไม่สามารถบันทึกข้อมูลสวัสดิการได้", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "บันทึกข้อมูลสวัสดิการเรียบร้อยแล้ว", data },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /recruitment/api/benefits error:",
      error
    );

    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    const {
      branches_id,
      benefits,
    } = body;

    if (!branches_id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเลือกสังกัด",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(benefits) ||
      benefits.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเพิ่มรายการสวัสดิการอย่างน้อย 1 รายการ",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // ลบข้อมูลเดิมของสังกัด
    // ==========================================
    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("recruit_benefit_center")
      .delete()
      .eq("branches_id", branches_id);

    if (deleteError) {
      console.error(
        "Delete old benefits error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถลบข้อมูลเดิมได้",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // เตรียมข้อมูลใหม่
    // ==========================================
    const insertData = benefits.map(
      (benefit) => ({
        branches_id,
        benefit_name:
          benefit.benefit_name || {},
        sort_order:
          Number(benefit.sort_order) || 1,
      })
    );

    // ==========================================
    // Insert ข้อมูลใหม่
    // ==========================================
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("recruit_benefit_center")
      .insert(insertData)
      .select();

    if (error) {
      console.error(
        "Update recruit_benefit_center error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถบันทึกข้อมูลสวัสดิการได้",
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขข้อมูลสวัสดิการเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "PUT /recruitment/api/benefits error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการแก้ไขข้อมูล",
      },
      {
        status: 500,
      }
    );
  }
}