import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

function cleanText(value) {
  return String(value ?? "").trim();
}

function errorResponse(message, status = 500, extra = {}) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    { status }
  );
}

async function getSalaryStructure(id) {
  const { data, error } = await supabaseAdmin
    .from("salary_structures")
    .select("id,name,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function findDuplicateName(name, excludeId) {
  let query = supabaseAdmin
    .from("salary_structures")
    .select("id,name")
    .ilike("name", name)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

/* =========================================================
   GET /api/admin/salary-structures/:id
========================================================= */
export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.salary_structures",
      "view"
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    if (!id) {
      return errorResponse("กรุณาระบุรหัสโครงสร้างเงินเดือน", 400);
    }

    const data = await getSalaryStructure(id);

    if (!data) {
      return errorResponse("ไม่พบโครงสร้างเงินเดือน", 404);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/admin/salary-structures/[id] error:", error);

    return errorResponse(
      "ไม่สามารถโหลดรายละเอียดโครงสร้างเงินเดือนได้",
      500
    );
  }
}

/* =========================================================
   PATCH /api/admin/salary-structures/:id
========================================================= */
export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.salary_structures",
      "edit"
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    if (!id) {
      return errorResponse("กรุณาระบุรหัสโครงสร้างเงินเดือน", 400);
    }

    const oldData = await getSalaryStructure(id);

    if (!oldData) {
      return errorResponse("ไม่พบโครงสร้างเงินเดือน", 404);
    }

    const body = await req.json();
    const name = cleanText(body?.name);

    if (!name) {
      return errorResponse("กรุณาระบุชื่อโครงสร้างเงินเดือน", 400);
    }

    if (name.length > 255) {
      return errorResponse(
        "ชื่อโครงสร้างเงินเดือนต้องไม่เกิน 255 ตัวอักษร",
        400
      );
    }

    const duplicate = await findDuplicateName(name, id);

    if (duplicate) {
      return errorResponse(
        "ชื่อโครงสร้างเงินเดือนนี้มีอยู่แล้ว",
        409,
        {
          duplicate: {
            id: duplicate.id,
            name: duplicate.name,
          },
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("salary_structures")
      .update({ name })
      .eq("id", id)
      .select("id,name,created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return errorResponse(
          "ชื่อโครงสร้างเงินเดือนนี้มีอยู่แล้ว",
          409
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขโครงสร้างเงินเดือนเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/admin/salary-structures/[id] error:", error);

    return errorResponse(
      "ไม่สามารถแก้ไขโครงสร้างเงินเดือนได้",
      500
    );
  }
}

/* =========================================================
   DELETE /api/admin/salary-structures/:id

   Enterprise rule:
   ถ้ามีพนักงาน Compensation อ้างอิงอยู่ ห้ามลบ Master
========================================================= */
export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.salary_structures",
      "delete"
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    if (!id) {
      return errorResponse("กรุณาระบุรหัสโครงสร้างเงินเดือน", 400);
    }

    const oldData = await getSalaryStructure(id);

    if (!oldData) {
      return errorResponse("ไม่พบโครงสร้างเงินเดือน", 404);
    }

    // ตอนนี้ 4 ตาราง Employee Compensation ถูกสร้างแล้ว
    // จึงป้องกันการลบ Salary Structure ที่ถูกใช้งานจริง
    const {
      count: compensationCount,
      error: compensationError,
    } = await supabaseAdmin
      .from("employee_compensations")
      .select("id", { count: "exact", head: true })
      .eq("salary_structure_id", id);

    if (compensationError) {
      throw compensationError;
    }

    if (Number(compensationCount || 0) > 0) {
      return errorResponse(
        "ไม่สามารถลบโครงสร้างเงินเดือนนี้ได้ เนื่องจากมีข้อมูลเงินเดือนพนักงานอ้างอิงอยู่",
        409,
        {
          references: {
            employee_compensations: Number(compensationCount || 0),
          },
        }
      );
    }

    const {
      count: adjustmentCount,
      error: adjustmentError,
    } = await supabaseAdmin
      .from("employee_compensation_adjustments")
      .select("id", { count: "exact", head: true })
      .eq("salary_structure_id", id);

    if (adjustmentError) {
      throw adjustmentError;
    }

    if (Number(adjustmentCount || 0) > 0) {
      return errorResponse(
        "ไม่สามารถลบโครงสร้างเงินเดือนนี้ได้ เนื่องจากมีรายการปรับเงินเดือนอ้างอิงอยู่",
        409,
        {
          references: {
            employee_compensation_adjustments: Number(
              adjustmentCount || 0
            ),
          },
        }
      );
    }

    const { error } = await supabaseAdmin
      .from("salary_structures")
      .delete()
      .eq("id", id);

    if (error) {
      // FK violation เผื่อมีตารางอื่นอ้างอิงในอนาคต
      if (error.code === "23503") {
        return errorResponse(
          "ไม่สามารถลบโครงสร้างเงินเดือนนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
          409
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "ลบโครงสร้างเงินเดือนเรียบร้อยแล้ว",
      data: {
        id: oldData.id,
        name: oldData.name,
      },
    });
  } catch (error) {
    console.error("DELETE /api/admin/salary-structures/[id] error:", error);

    return errorResponse(
      "ไม่สามารถลบโครงสร้างเงินเดือนได้",
      500
    );
  }
}
