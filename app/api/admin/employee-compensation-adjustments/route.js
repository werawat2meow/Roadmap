import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  getActorRoleId,
  getActorUserAccountId,
  requireCompensationAccess,
  resolveAccessibleEmployeeIds,
} from "@/lib/compensation/compensationAccess";
import {
  ADJUSTMENT_SELECT,
  calculateAdjustment,
  cleanText,
  insertApprovalLog,
  loadCurrentCompensation,
  toPageSize,
  toPositivePage,
} from "@/lib/compensation/compensationService";

export async function GET(req) {
  try {
    const guard = await requireCompensationAccess("view");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const page = toPositivePage(searchParams.get("page"), 1);
    const pageSize = toPageSize(searchParams.get("pageSize"), 20, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const employeeIds = await resolveAccessibleEmployeeIds(guard, {
      search: cleanText(searchParams.get("search")),
      employeeId: cleanText(searchParams.get("employee_id")),
      companyId: cleanText(searchParams.get("company_id")),
      branchGroupId: cleanText(searchParams.get("branch_group_id")),
      branchId: cleanText(searchParams.get("branch_id")),
      departmentId: cleanText(searchParams.get("department_id")),
      divisionId: cleanText(searchParams.get("division_id")),
      unitId: cleanText(searchParams.get("unit_id")),
    });

    if (Array.isArray(employeeIds) && employeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      });
    }

    let query = supabaseAdmin
      .from("employee_compensation_adjustments")
      .select(ADJUSTMENT_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (Array.isArray(employeeIds)) {
      query = query.in("employee_id", employeeIds);
    }

    const status = cleanText(searchParams.get("status"));
    const adjustmentType = cleanText(searchParams.get("adjustment_type"));

    if (status) query = query.eq("status", status);
    if (adjustmentType) query = query.eq("adjustment_type", adjustmentType);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: Number(count || 0),
        totalPages: Math.ceil(Number(count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET compensation adjustments error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลดรายการปรับเงินเดือนได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const guard = await requireCompensationAccess("adjust");
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const employeeId = cleanText(body?.employee_id);

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ employee_id" },
        { status: 400 }
      );
    }

    const access = await ensureEmployeeAccessible(guard, employeeId);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const current = await loadCurrentCompensation(employeeId);
    if (!current) {
      return NextResponse.json(
        {
          success: false,
          error:
            "พนักงานยังไม่มี Current Compensation กรุณาสร้างเงินเดือนเริ่มต้นก่อน",
        },
        { status: 409 }
      );
    }

    const effectiveDate = cleanText(body?.effective_date);
    if (!effectiveDate) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ effective_date" },
        { status: 400 }
      );
    }

    const adjustmentType = cleanText(body?.adjustment_type);
    if (!adjustmentType) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ adjustment_type" },
        { status: 400 }
      );
    }

    const calculated = calculateAdjustment({
      currentSalary: current.base_salary,
      adjustmentAmount: body?.adjustment_amount,
      adjustmentPercent: body?.adjustment_percent,
      proposedSalary: body?.proposed_salary,
    });

    const actorId = getActorUserAccountId(guard);
    const actorRoleId = getActorRoleId(guard);

    const payload = {
      employee_id: employeeId,
      current_compensation_id: current.id,
      salary_structure_id: current.salary_structure_id,
      position_level_band_id: current.position_level_band_id,
      adjustment_type: adjustmentType,
      currency_code: current.currency_code || "THB",
      ...calculated,
      performance_rating: cleanText(body?.performance_rating),
      performance_score:
        body?.performance_score === null ||
        body?.performance_score === undefined ||
        body?.performance_score === ""
          ? null
          : Number(body.performance_score),
      review_cycle: cleanText(body?.review_cycle),
      evaluation_reference_id: cleanText(body?.evaluation_reference_id),
      effective_date: effectiveDate,
      status: "draft",
      reason: cleanText(body?.reason),
      remark: cleanText(body?.remark),
      created_by: actorId,
      updated_by: actorId,
    };

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_adjustments")
      .insert(payload)
      .select(ADJUSTMENT_SELECT)
      .single();

    if (error) throw error;

    await insertApprovalLog({
      adjustmentId: data.id,
      action: "created",
      fromStatus: null,
      toStatus: "draft",
      actorUserAccountId: actorId,
      actorRoleId,
      comment: body?.remark,
    });

    return NextResponse.json(
      {
        success: true,
        message: "สร้างรายการปรับเงินเดือนเรียบร้อยแล้ว",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST compensation adjustment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถสร้างรายการปรับเงินเดือนได้",
      },
      { status: 500 }
    );
  }
}
