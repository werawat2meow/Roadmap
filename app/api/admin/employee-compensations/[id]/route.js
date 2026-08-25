import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  getActorUserAccountId,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import {
  COMPENSATION_SELECT,
  cleanText,
  loadBandSnapshot,
  toNumber,
} from "@/lib/compensation/compensationService";

async function loadRecord(id) {
  const { data, error } = await supabaseAdmin
    .from("employee_compensations")
    .select(COMPENSATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function GET(req, { params }) {
  try {
    const guard = await requireCompensationAccess("view");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const record = await loadRecord(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลเงินเดือนพนักงาน" },
        { status: 404 }
      );
    }

    const access = await ensureEmployeeAccessible(guard, record.employee_id);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const { data: components, error: componentError } = await supabaseAdmin
      .from("employee_compensation_components")
      .select("*, salary_component:salary_components(*)")
      .eq("employee_compensation_id", id)
      .order("sort_order", { ascending: true });

    if (componentError) throw componentError;

    const { data: history, error: historyError } = await supabaseAdmin
      .from("employee_compensations")
      .select("id, base_salary, currency_code, effective_from, effective_to, status, source_type, reason")
      .eq("employee_id", record.employee_id)
      .order("effective_from", { ascending: false });

    if (historyError) throw historyError;

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        components: components || [],
        history: history || [],
      },
    });
  } catch (error) {
    console.error("GET employee-compensation detail error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลดรายละเอียดเงินเดือนพนักงานได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireCompensationAccess("edit");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json();
    const oldRecord = await loadRecord(id);

    if (!oldRecord) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลเงินเดือนพนักงาน" },
        { status: 404 }
      );
    }

    const access = await ensureEmployeeAccessible(
      guard,
      oldRecord.employee_id
    );
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const protectedFields = [
      "employee_id",
      "base_salary",
      "effective_from",
      "salary_structure_id",
      "position_id",
      "position_level_id",
      "position_level_band_id",
    ];

    if (oldRecord.status === "active") {
      const hasProtectedChange = protectedFields.some(
        (field) =>
          Object.prototype.hasOwnProperty.call(body, field) &&
          String(body[field] ?? "") !== String(oldRecord[field] ?? "")
      );

      if (hasProtectedChange) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่อนุญาตให้แก้เงินเดือน Active โดยตรง กรุณาใช้ Salary Adjustment เพื่อรักษาประวัติ",
          },
          { status: 409 }
        );
      }
    }

    const payload = {
      updated_by: getActorUserAccountId(guard),
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "salary_structure_id",
      "position_id",
      "position_level_id",
      "position_level_band_id",
      "payroll_company_id",
      "payroll_type_id",
      "payroll_group_id",
      "currency_code",
      "base_salary",
      "effective_from",
      "effective_to",
      "status",
      "reason",
      "remark",
    ];

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
      payload[field] = body[field] === "" ? null : body[field];
    }

    if (Object.prototype.hasOwnProperty.call(payload, "base_salary")) {
      const salary = toNumber(payload.base_salary, null);
      if (salary === null || salary < 0) {
        return NextResponse.json(
          { success: false, error: "base_salary ไม่ถูกต้อง" },
          { status: 400 }
        );
      }
      payload.base_salary = salary;
    }

    if (
      Object.prototype.hasOwnProperty.call(payload, "position_level_band_id")
    ) {
      Object.assign(
        payload,
        await loadBandSnapshot(cleanText(payload.position_level_band_id))
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employee_compensations")
      .update(payload)
      .eq("id", id)
      .select(COMPENSATION_SELECT)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลเงินเดือนพนักงานเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("PATCH employee-compensation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถแก้ไขข้อมูลเงินเดือนพนักงานได้",
      },
      { status: error?.status || 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = await requireCompensationAccess("delete");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const record = await loadRecord(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลเงินเดือนพนักงาน" },
        { status: 404 }
      );
    }

    const access = await ensureEmployeeAccessible(guard, record.employee_id);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    if (!["draft", "cancelled"].includes(record.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ลบได้เฉพาะรายการ draft/cancelled เท่านั้น ประวัติเงินเดือน Active/Inactive ห้ามลบ",
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from("employee_compensations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบรายการเงินเดือนพนักงานเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE employee-compensation error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถลบข้อมูลเงินเดือนพนักงานได้" },
      { status: 500 }
    );
  }
}
