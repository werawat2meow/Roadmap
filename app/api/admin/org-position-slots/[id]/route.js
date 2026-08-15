import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  ORG_SLOT_SELECT,
  countCurrentPrimaryAssignments,
  getOrgSlotById,
  mapOrgDbError,
  normalizeOrgSlotPayload,
  validateChildCompatibility,
  validateOrgSlotLineage,
} from "@/lib/org/orgStructure";

/* =========================================================
   GET /api/admin/org-position-slots/[id]
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
      await getOrgSlotById(id);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Position Slot",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !guard.canAccessEmployee(
        data
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์ดู Position Slot นี้",
        },
        {
          status: 403,
        }
      );
    }

    const filteredAssignments =
      (
        data.employee_position_assignments ||
        []
      ).filter(
        (assignment) =>
          assignment?.employees
            ? guard.canAccessEmployee(
                assignment.employees
              )
            : true
      );

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        employee_position_assignments:
          filteredAssignments,
      },
    });
  } catch (error) {
    console.error(
      "GET_ORG_POSITION_SLOT_ERROR:",
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
   PATCH /api/admin/org-position-slots/[id]
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
      await getOrgSlotById(id);

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Position Slot",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !guard.canAccessEmployee(
        oldData
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์แก้ไข Position Slot นี้",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await req.json();

    const payload =
      normalizeOrgSlotPayload({
        ...oldData,
        ...body,
      });

    const validationError =
      await validateOrgSlotLineage(
        payload,
        {
          currentSlotId: id,
        }
      );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ต้องมีสิทธิ์ทั้งข้อมูลเดิมและสายใหม่
     * เพื่อกันย้าย Slot ออกจาก Scope ด้วย API ตรง
     */
    if (
      !guard.canAccessEmployee(
        payload
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์ย้าย Position Slot ไปยังสายโครงสร้างนี้",
        },
        {
          status: 403,
        }
      );
    }

    const childError =
      await validateChildCompatibility(
        id,
        payload
      );

    if (childError) {
      return NextResponse.json(
        {
          success: false,
          error: childError,
        },
        {
          status: 409,
        }
      );
    }

    const currentOccupied =
      await countCurrentPrimaryAssignments(
        id
      );

    if (
      payload.employment_capacity <
      currentOccupied
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `ไม่สามารถลด Capacity เหลือ ${payload.employment_capacity} ได้ เนื่องจากมีพนักงานครอง Slot อยู่ ${currentOccupied} คน`,
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
          "org_position_slots"
        )
        .update(updatePayload)
        .eq("id", id)
        .select(
          ORG_SLOT_SELECT
        )
        .single();

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name:
        "org_position_slots",

      action_type: "update",

      reference_table:
        "org_position_slots",

      reference_id: data.id,

      description:
        `แก้ไข Position Slot ${data.slot_code}`,

      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message:
        "แก้ไข Position Slot เรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "UPDATE_ORG_POSITION_SLOT_ERROR:",
      error
    );

    const mapped =
      mapOrgDbError(
        error,
        {
          duplicateMessage:
            "รหัส Position Slot นี้มีอยู่แล้ว",
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
   DELETE /api/admin/org-position-slots/[id]

   ไม่ลบถ้ามี Child หรือมี Assignment
   เพื่อไม่ให้ประวัติพนักงานหายจาก ON DELETE CASCADE
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
      await getOrgSlotById(id);

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Position Slot",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !guard.canAccessEmployee(
        oldData
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์ลบ Position Slot นี้",
        },
        {
          status: 403,
        }
      );
    }

    const [
      childResult,
      assignmentResult,
    ] = await Promise.all([
      supabaseAdmin
        .from(
          "org_position_slots"
        )
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "parent_slot_id",
          id
        ),

      supabaseAdmin
        .from(
          "employee_position_assignments"
        )
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "position_slot_id",
          id
        ),
    ]);

    if (childResult.error) {
      throw childResult.error;
    }

    if (assignmentResult.error) {
      throw assignmentResult.error;
    }

    if (
      Number(
        childResult.count || 0
      ) > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบ Position Slot ได้ เนื่องจากยังมี Child Slot อยู่",
        },
        {
          status: 409,
        }
      );
    }

    if (
      Number(
        assignmentResult.count ||
          0
      ) > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบ Position Slot ได้ เนื่องจากมีประวัติ Employee Position Assignment อยู่ กรุณาเปลี่ยนสถานะเป็น inactive แทน",
        },
        {
          status: 409,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from(
          "org_position_slots"
        )
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name:
        "org_position_slots",

      action_type: "delete",

      reference_table:
        "org_position_slots",

      reference_id: oldData.id,

      description:
        `ลบ Position Slot ${oldData.slot_code}`,

      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบ Position Slot เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_ORG_POSITION_SLOT_ERROR:",
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
