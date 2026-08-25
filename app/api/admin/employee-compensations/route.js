import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  getActorUserAccountId,
  requireCompensationAccess,
  resolveAccessibleEmployeeIds,
} from "@/lib/compensation/compensationAccess";
import {
  COMPENSATION_SELECT,
  cleanText,
  loadBandSnapshot,
  loadCurrentCompensation,
  toNumber,
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

    const currentOnly = searchParams.get("current_only") !== "false";
    const status = cleanText(searchParams.get("status"));

    const employeeFilters = {
      search: cleanText(searchParams.get("search")),
      employeeId: cleanText(searchParams.get("employee_id")),
      companyId: cleanText(searchParams.get("company_id")),
      branchGroupId: cleanText(searchParams.get("branch_group_id")),
      branchId: cleanText(searchParams.get("branch_id")),
      departmentId: cleanText(searchParams.get("department_id")),
      divisionId: cleanText(searchParams.get("division_id")),
      unitId: cleanText(searchParams.get("unit_id")),
      positionId: cleanText(searchParams.get("position_id")),
      positionLevelId: cleanText(searchParams.get("position_level_id")),
    };

    const employeeIds = await resolveAccessibleEmployeeIds(
      guard,
      employeeFilters
    );

    if (Array.isArray(employeeIds) && employeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      });
    }

    let query = supabaseAdmin
      .from("employee_compensations")
      .select(COMPENSATION_SELECT, { count: "exact" })
      .order("effective_from", { ascending: false })
      .range(from, to);

    if (Array.isArray(employeeIds)) {
      query = query.in("employee_id", employeeIds);
    }

    if (status) query = query.eq("status", status);

    if (currentOnly) {
      query = query.eq("status", "active").is("effective_to", null);
    }

    const salaryStructureId = cleanText(
      searchParams.get("salary_structure_id")
    );
    const positionLevelBandId = cleanText(
      searchParams.get("position_level_band_id")
    );
    const payrollCompanyId = cleanText(
      searchParams.get("payroll_company_id")
    );
    const payrollTypeId = cleanText(searchParams.get("payroll_type_id"));
    const payrollGroupId = cleanText(searchParams.get("payroll_group_id"));

    if (salaryStructureId) {
      query = query.eq("salary_structure_id", salaryStructureId);
    }
    if (positionLevelBandId) {
      query = query.eq("position_level_band_id", positionLevelBandId);
    }
    if (payrollCompanyId) {
      query = query.eq("payroll_company_id", payrollCompanyId);
    }
    if (payrollTypeId) {
      query = query.eq("payroll_type_id", payrollTypeId);
    }
    if (payrollGroupId) {
      query = query.eq("payroll_group_id", payrollGroupId);
    }

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
      meta: {
        currentOnly,
        scopeRule: "PERMISSION_PLUS_EMPLOYEE_SCOPE",
      },
    });
  } catch (error) {
    console.error("GET employee-compensations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถโหลดโครงสร้างเงินเดือนพนักงานได้",
      },
      { status: error?.status || 500 }
    );
  }
}

export async function POST(req) {
  try {
    const guard = await requireCompensationAccess("create");
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

    const baseSalary = toNumber(body?.base_salary, null);
    if (baseSalary === null || baseSalary < 0) {
      return NextResponse.json(
        { success: false, error: "base_salary ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const effectiveFrom = cleanText(body?.effective_from);
    if (!effectiveFrom) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ effective_from" },
        { status: 400 }
      );
    }

    const status = cleanText(body?.status) || "active";

    if (status === "active" && !body?.effective_to) {
      const current = await loadCurrentCompensation(employeeId);
      if (current) {
        return NextResponse.json(
          {
            success: false,
            error:
              "พนักงานมีเงินเดือนปัจจุบันอยู่แล้ว กรุณาใช้ Salary Adjustment เพื่อรักษาประวัติ",
            current_compensation_id: current.id,
          },
          { status: 409 }
        );
      }
    }

    const employee = access.employee;
    const positionLevelBandId =
      cleanText(body?.position_level_band_id) ||
      employee?.position_level_band_id ||
      null;

    const bandSnapshot = await loadBandSnapshot(positionLevelBandId);
    const actorId = getActorUserAccountId(guard);

    const payload = {
      employee_id: employeeId,
      salary_structure_id: cleanText(body?.salary_structure_id),
      position_id:
        cleanText(body?.position_id) || employee?.position_id || null,
      position_level_id:
        cleanText(body?.position_level_id) ||
        employee?.position_level_id ||
        null,
      position_level_band_id: positionLevelBandId,
      payroll_company_id:
        cleanText(body?.payroll_company_id) ||
        employee?.payroll_company_id ||
        null,
      payroll_type_id:
        cleanText(body?.payroll_type_id) ||
        employee?.payroll_type_id ||
        null,
      payroll_group_id:
        cleanText(body?.payroll_group_id) ||
        employee?.payroll_group_id ||
        null,
      currency_code: cleanText(body?.currency_code) || "THB",
      base_salary: baseSalary,
      ...bandSnapshot,
      effective_from: effectiveFrom,
      effective_to: cleanText(body?.effective_to),
      source_type: cleanText(body?.source_type) || "initial",
      status,
      reason: cleanText(body?.reason),
      remark: cleanText(body?.remark),
      created_by: actorId,
      updated_by: actorId,
    };

    const { data, error } = await supabaseAdmin
      .from("employee_compensations")
      .insert(payload)
      .select(COMPENSATION_SELECT)
      .single();

    if (error) throw error;

    const components = Array.isArray(body?.components)
      ? body.components
      : [];

    if (components.length > 0) {
      const componentRows = components
        .filter((item) => item?.salary_component_id)
        .map((item, index) => ({
          employee_compensation_id: data.id,
          salary_component_id: item.salary_component_id,
          calculation_type: cleanText(item.calculation_type) || "fixed",
          amount: toNumber(item.amount, 0),
          percentage: toNumber(item.percentage, null),
          status: cleanText(item.status) || "active",
          sort_order: Number(item.sort_order ?? index),
          remark: cleanText(item.remark),
        }));

      if (componentRows.length > 0) {
        const { error: componentError } = await supabaseAdmin
          .from("employee_compensation_components")
          .insert(componentRows);

        if (componentError) {
          await supabaseAdmin
            .from("employee_compensations")
            .delete()
            .eq("id", data.id);
          throw componentError;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "สร้างโครงสร้างเงินเดือนพนักงานเรียบร้อยแล้ว",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST employee-compensations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถสร้างโครงสร้างเงินเดือนพนักงานได้",
      },
      { status: error?.status || 500 }
    );
  }
}
