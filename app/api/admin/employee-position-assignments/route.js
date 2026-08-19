import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  EMPLOYEE_POSITION_ASSIGNMENT_SELECT,
  getEmployeeForStructure,
  getOrgSlotById,
  mapOrgDbError,
  normalizeEmployeePositionAssignmentPayload,
  validateEffectiveDateRange,
  validateEmployeeMatchesSlot,
  validatePrimaryAssignmentConflicts,
} from "@/lib/org/orgStructure";

/* =========================================================
   GET /api/admin/employee-position-assignments

   Query:
   - position_slot_id
   - employee_id
   - assignment_type
   - status
   - is_primary=true|false
   - company_id
   - branch_group_id
   - branch_id
   - department_id
   - division_id
   - unit_id
   - all=true
   - page
   - pageSize
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.org_structure",
        "view",
        {
          lineageScope: true,
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } =
      new URL(req.url);

    const positionSlotId =
      searchParams
        .get("position_slot_id")
        ?.trim() || "";

    const employeeId =
      searchParams
        .get("employee_id")
        ?.trim() || "";

    const assignmentType =
      searchParams
        .get("assignment_type")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const isPrimaryParam =
      searchParams.get(
        "is_primary"
      );

    const companyId =
      searchParams
        .get("company_id")
        ?.trim() || "";

    const branchGroupId =
      searchParams
        .get("branch_group_id")
        ?.trim() || "";

    const branchId =
      searchParams
        .get("branch_id")
        ?.trim() || "";

    const departmentId =
      searchParams
        .get("department_id")
        ?.trim() || "";

    const divisionId =
      searchParams
        .get("division_id")
        ?.trim() || "";

    const unitId =
      searchParams
        .get("unit_id")
        ?.trim() || "";

    const all =
      searchParams.get("all") ===
      "true";

    const page = Math.max(
      Number(
        searchParams.get("page") ||
          1
      ),
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get(
            "pageSize"
          ) || 20
        ),
        1
      ),
      200
    );

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    /*
     * Assignment ไม่มี company_id -> unit_id อยู่บนตัวเอง
     * ดังนั้น Scope ผ่าน Position Slot ก่อน
     */
    let slotQuery =
      supabaseAdmin
        .from(
          "org_position_slots"
        )
        .select("id");

    slotQuery =
      guard.applyEmployeeScope(
        slotQuery
      );

    if (positionSlotId) {
      slotQuery = slotQuery.eq(
        "id",
        positionSlotId
      );
    }

    if (companyId) {
      slotQuery = slotQuery.eq(
        "company_id",
        companyId
      );
    }

    if (branchGroupId) {
      slotQuery = slotQuery.eq(
        "branch_group_id",
        branchGroupId
      );
    }

    if (branchId) {
      slotQuery = slotQuery.eq(
        "branch_id",
        branchId
      );
    }

    if (departmentId) {
      slotQuery = slotQuery.eq(
        "department_id",
        departmentId
      );
    }

    if (divisionId) {
      slotQuery = slotQuery.eq(
        "division_id",
        divisionId
      );
    }

    if (unitId) {
      slotQuery = slotQuery.eq(
        "unit_id",
        unitId
      );
    }

    const {
      data: slotRows,
      error: slotError,
    } = await slotQuery;

    if (slotError) {
      throw slotError;
    }

    const allowedSlotIds =
      (slotRows || []).map(
        (row) => row.id
      );

    if (!allowedSlotIds.length) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page:
            all ? 1 : page,
          pageSize:
            all ? 0 : pageSize,
          total: 0,
          totalPages: 1,
        },
      });
    }

    let query =
      supabaseAdmin
        .from(
          "employee_position_assignments"
        )
        .select(
          EMPLOYEE_POSITION_ASSIGNMENT_SELECT,
          {
            count: "exact",
          }
        )
        .in(
          "position_slot_id",
          allowedSlotIds
        );

    if (employeeId) {
      query = query.eq(
        "employee_id",
        employeeId
      );
    }

    if (assignmentType) {
      query = query.eq(
        "assignment_type",
        assignmentType
      );
    }

    if (
      status &&
      status !== "ALL"
    ) {
      query = query.eq(
        "status",
        status
      );
    }

    if (
      isPrimaryParam === "true" ||
      isPrimaryParam === "false"
    ) {
      query = query.eq(
        "is_primary",
        isPrimaryParam ===
          "true"
      );
    }

    query = query
      .order(
        "effective_from",
        {
          ascending: false,
        }
      )
      .order("created_at", {
        ascending: false,
      });

    if (!all) {
      query = query.range(
        from,
        to
      );
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }

    const total =
      Number(count || 0);

    const totalPages =
      all
        ? 1
        : Math.max(
            Math.ceil(
              total / pageSize
            ),
            1
          );

    return NextResponse.json({
      success: true,
      data: data || [],

      pagination: {
        page:
          all ? 1 : page,

        pageSize:
          all
            ? (data || []).length
            : pageSize,

        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET_EMPLOYEE_POSITION_ASSIGNMENTS_ERROR:",
      error
    );

    const mapped =
      mapOrgDbError(error);

    return NextResponse.json(
      {
        success: false,
        error: mapped.message,
      },
      {
        status: mapped.status,
      }
    );
  }
}

/* =========================================================
   POST /api/admin/employee-position-assignments
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.org_structure",
        "create",
        {
          lineageScope: true,
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req.json();

    const payload =
      normalizeEmployeePositionAssignmentPayload(
        body
      );

    if (!payload.employee_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกพนักงาน",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !payload.position_slot_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือก Position Slot",
        },
        {
          status: 400,
        }
      );
    }

    const dateError =
      validateEffectiveDateRange(
        payload.effective_from,
        payload.effective_to
      );

    if (dateError) {
      return NextResponse.json(
        {
          success: false,
          error: dateError,
        },
        {
          status: 400,
        }
      );
    }

    const [
      employee,
      slot,
    ] = await Promise.all([
      getEmployeeForStructure(
        payload.employee_id
      ),

      getOrgSlotById(
        payload.position_slot_id
      ),
    ]);

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบพนักงานที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (!slot) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Position Slot ที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ต้องมีสิทธิ์ทั้ง Employee และ Slot
     */
    if (
      !guard.canAccessEmployee(
        employee
      ) ||
      !guard.canAccessEmployee(
        slot
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์กำหนดพนักงานเข้ากับ Position Slot นี้",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Primary Assignment ต้องตรงสายองค์กร
     * และ Position ต้องตรงกับ Slot
     */
    if (payload.is_primary) {
      const matchError =
        validateEmployeeMatchesSlot(
          employee,
          slot
        );

      if (matchError) {
        return NextResponse.json(
          {
            success: false,
            error: matchError,
          },
          {
            status: 409,
          }
        );
      }
    }

    const conflictError =
      await validatePrimaryAssignmentConflicts({
        employeeId:
          payload.employee_id,

        slot,

        effectiveFrom:
          payload.effective_from,

        effectiveTo:
          payload.effective_to,

        isPrimary:
          payload.is_primary,

        status:
          payload.status,
      });

    if (conflictError) {
      return NextResponse.json(
        {
          success: false,
          error:
            conflictError,
        },
        {
          status: 409,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from(
          "employee_position_assignments"
        )
        .insert(payload)
        .select(
          EMPLOYEE_POSITION_ASSIGNMENT_SELECT
        )
        .single();

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name:
        "employee_position_assignments",

      action_type: "create",

      reference_table:
        "employee_position_assignments",

      reference_id: data.id,

      description:
        `กำหนดพนักงาน ${employee.employee_code} เข้ากับ Position Slot ${slot.slot_code}`,

      new_data: data,
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "กำหนดพนักงานเข้ากับ Position Slot เรียบร้อยแล้ว",

        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_EMPLOYEE_POSITION_ASSIGNMENT_ERROR:",
      error
    );

    const mapped =
      mapOrgDbError(
        error,
        {
          duplicateMessage:
            "Employee Position Assignment นี้มีอยู่แล้ว",
        }
      );

    return NextResponse.json(
      {
        success: false,
        error: mapped.message,
      },
      {
        status: mapped.status,
      }
    );
  }
}
