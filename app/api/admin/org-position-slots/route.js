import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  ORG_SLOT_SELECT,
  buildOrgSlotTree,
  cleanSearch,
  loadOrgSlotAncestors,
  mapOrgDbError,
  normalizeOrgSlotPayload,
  validateOrgSlotLineage,
} from "@/lib/org/orgStructure";

/* =========================================================
   GET /api/admin/org-position-slots

   Query:
   - search
   - company_id
   - branch_group_id
   - branch_id
   - department_id
   - division_id
   - unit_id
   - position_id
   - parent_slot_id
   - status
   - all=true
   - tree=true
   - include_ancestors=true
   - root=true
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

    const search =
      cleanSearch(
        searchParams.get("search")
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

    const positionId =
      searchParams
        .get("position_id")
        ?.trim() || "";

    const parentSlotId =
      searchParams
        .get("parent_slot_id")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const tree =
      searchParams.get("tree") ===
      "true";

    const includeAncestors =
      tree ||
      searchParams.get(
        "include_ancestors"
      ) === "true";

    const rootOnly =
      searchParams.get("root") ===
      "true";

    const all =
      tree ||
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

    let query =
      supabaseAdmin
        .from(
          "org_position_slots"
        )
        .select(
          ORG_SLOT_SELECT,
          {
            count: "exact",
          }
        );

    /*
     * สำคัญ:
     * ใช้ Lineage Scope ตัวเดียวกับ Employee
     * Company -> Group -> Branch -> Department -> Division -> Unit
     * คนละระดับ = AND
     * คนละ Assignment = OR
     */
    query =
      guard.applyEmployeeScope(
        query
      );

    if (search) {
      query = query.or(
        [
          `slot_code.ilike.%${search}%`,
          `slot_name.ilike.%${search}%`,
          `slot_type.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (companyId) {
      query = query.eq(
        "company_id",
        companyId
      );
    }

    if (branchGroupId) {
      query = query.eq(
        "branch_group_id",
        branchGroupId
      );
    }

    if (branchId) {
      query = query.eq(
        "branch_id",
        branchId
      );
    }

    if (departmentId) {
      query = query.eq(
        "department_id",
        departmentId
      );
    }

    if (divisionId) {
      query = query.eq(
        "division_id",
        divisionId
      );
    }

    if (unitId) {
      query = query.eq(
        "unit_id",
        unitId
      );
    }

    if (positionId) {
      query = query.eq(
        "position_id",
        positionId
      );
    }

    if (parentSlotId) {
      query = query.eq(
        "parent_slot_id",
        parentSlotId
      );
    }

    if (rootOnly) {
      query = query.is(
        "parent_slot_id",
        null
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

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("slot_code", {
        ascending: true,
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

    const visibleRows =
      data || [];

    const visibleIds =
      new Set(
        visibleRows.map(
          (row) => String(row.id)
        )
      );

    let rows =
      visibleRows;

    if (includeAncestors) {
      rows =
        await loadOrgSlotAncestors(
          visibleRows
        );
    }

    /*
     * Ancestor ที่เอามาเพื่อให้ Tree ต่อกันได้
     * ไม่คืน Employee Detail ถ้า Ancestor นั้น
     * อยู่นอก Scope โดยตรงของ User
     */
    rows = rows.map((row) => {
      const canViewRow =
        guard.canAccessEmployee(
          row
        );

      const assignments =
        canViewRow
          ? (
              row.employee_position_assignments ||
              []
            ).filter(
              (assignment) =>
                assignment?.employees
                  ? guard.canAccessEmployee(
                      assignment.employees
                    )
                  : true
            )
          : [];

      return {
        ...row,

        is_context_ancestor:
          !visibleIds.has(
            String(row.id)
          ),

        employee_position_assignments:
          assignments,
      };
    });

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

    if (tree) {
      return NextResponse.json({
        success: true,

        data:
          buildOrgSlotTree(
            rows
          ),

        flat_data: rows,

        pagination: {
          page: 1,
          pageSize: rows.length,
          total,
          totalPages: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: rows,

      pagination: {
        page:
          all ? 1 : page,

        pageSize:
          all
            ? rows.length
            : pageSize,

        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET_ORG_POSITION_SLOTS_ERROR:",
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
   POST /api/admin/org-position-slots
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
      normalizeOrgSlotPayload(
        body
      );

    const validationError =
      await validateOrgSlotLineage(
        payload
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
     * ป้องกันการยิง API ข้าม Scope โดยตรง
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
            "คุณไม่มีสิทธิ์เพิ่ม Position Slot ในสายโครงสร้างนี้",
        },
        {
          status: 403,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from(
          "org_position_slots"
        )
        .insert(payload)
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

      action_type: "create",

      reference_table:
        "org_position_slots",

      reference_id: data.id,

      description:
        `เพิ่ม Position Slot ${data.slot_code}`,

      new_data: data,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่ม Position Slot เรียบร้อยแล้ว",
        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_ORG_POSITION_SLOT_ERROR:",
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
