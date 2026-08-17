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
   Load Assignment
========================================================= */

async function getAssignmentById(id) {
  const { data, error } =
    await supabaseAdmin
      .from(
        "employee_position_assignments"
      )
      .select(
        EMPLOYEE_POSITION_ASSIGNMENT_SELECT
      )
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   GET /api/admin/employee-position-assignments/[id]
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

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

    const data =
      await getAssignmentById(
        id
      );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Employee Position Assignment",
        },
        {
          status: 404,
        }
      );
    }

    const slot =
      data.org_position_slots;

    if (
      !slot ||
      !guard.canAccessEmployee(
        slot
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์ดู Employee Position Assignment นี้",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET_EMPLOYEE_POSITION_ASSIGNMENT_ERROR:",
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
   PATCH /api/admin/employee-position-assignments/[id]
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.org_structure",
        "edit",
        {
          lineageScope: true,
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const oldData =
      await getAssignmentById(
        id
      );

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Employee Position Assignment",
        },
        {
          status: 404,
        }
      );
    }

    const oldSlot =
      oldData.org_position_slots;

    if (
      !oldSlot ||
      !guard.canAccessEmployee(
        oldSlot
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์แก้ไข Employee Position Assignment นี้",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await req.json();

    const payload =
      normalizeEmployeePositionAssignmentPayload({
        ...oldData,
        ...body,
      });

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
     * แก้ไขได้เมื่อเข้าถึงทั้ง Employee และ Slot ใหม่
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
            "คุณไม่มีสิทธิ์ย้าย Assignment ไปยังพนักงานหรือ Position Slot นี้",
        },
        {
          status: 403,
        }
      );
    }

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
        assignmentId: id,

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

    const updatePayload = {
      ...payload,
      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabaseAdmin
        .from(
          "employee_position_assignments"
        )
        .update(updatePayload)
        .eq("id", id)
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

      action_type: "update",

      reference_table:
        "employee_position_assignments",

      reference_id: data.id,

      description:
        `แก้ไข Employee Position Assignment ของ ${employee.employee_code}`,

      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไข Employee Position Assignment เรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "UPDATE_EMPLOYEE_POSITION_ASSIGNMENT_ERROR:",
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

/* =========================================================
   DELETE /api/admin/employee-position-assignments/[id]
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.org_structure",
        "delete",
        {
          lineageScope: true,
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const oldData =
      await getAssignmentById(
        id
      );

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Employee Position Assignment",
        },
        {
          status: 404,
        }
      );
    }

    const slot =
      oldData.org_position_slots;

    if (
      !slot ||
      !guard.canAccessEmployee(
        slot
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์ลบ Employee Position Assignment นี้",
        },
        {
          status: 403,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from(
          "employee_position_assignments"
        )
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name:
        "employee_position_assignments",

      action_type: "delete",

      reference_table:
        "employee_position_assignments",

      reference_id:
        oldData.id,

      description:
        `ลบ Employee Position Assignment ${oldData.id}`,

      old_data: oldData,
    });

    return NextResponse.json({
      success: true,

      message:
        "ลบ Employee Position Assignment เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_EMPLOYEE_POSITION_ASSIGNMENT_ERROR:",
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
