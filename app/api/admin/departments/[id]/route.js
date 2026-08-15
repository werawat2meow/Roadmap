import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import {
  requireScopedAccess,
  resolveAccessibleIds,
} from "@/lib/auth/requireScopedAccess";

function normalizeIds(values = []) {
  return [
    ...new Set(
      (Array.isArray(values)
        ? values
        : []
      )
        .filter(Boolean)
        .map(String)
    ),
  ];
}

async function assertBranchIdsAllowed(
  guard,
  branchIds
) {
  if (guard.hasAllScope) {
    return null;
  }

  const allowedBranchIds =
    await resolveAccessibleIds(
      guard.access,
      "branch",
      {
        permission:
          guard.permission,
      }
    );

  const allowedSet = new Set(
    allowedBranchIds.map(String)
  );

  const invalidIds =
    normalizeIds(branchIds).filter(
      (id) =>
        !allowedSet.has(id)
    );

  if (!invalidIds.length) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "มีสังกัดที่อยู่นอก Scope ของผู้ใช้งาน",
    },
    {
      status: 403,
    }
  );
}

export async function PATCH(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.departments",
        "edit",
        {
          scopeType:
            "department",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    const scopeError =
      guard.assertAccessId(
        id,
        "คุณไม่มีสิทธิ์แก้ไขแผนกนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const body =
      await req.json();

    const department_code =
      body?.department_code
        ?.trim();

    const department_name =
      body?.department_name
        ?.trim();

    const department_color =
      body?.department_color
        ?.trim() || "#E2E8F0";

    const department_icon =
      body?.department_icon
        ?.trim() || null;

    const branch_ids =
      normalizeIds(
        body?.branch_ids
      );

    const status =
      body?.status || "active";

    if (
      !department_code ||
      !department_name
    ) {
      return NextResponse.json(
        {
          error:
            "กรุณากรอกรหัสแผนกและชื่อแผนก",
        },
        {
          status: 400,
        }
      );
    }

    if (!branch_ids.length) {
      return NextResponse.json(
        {
          error:
            "กรุณาเลือกสังกัดอย่างน้อย 1 รายการ",
        },
        {
          status: 400,
        }
      );
    }

    const branchScopeError =
      await assertBranchIdsAllowed(
        guard,
        branch_ids
      );

    if (branchScopeError) {
      return branchScopeError;
    }

    const {
      data: existingDepartment,
      error: existingError,
    } =
      await supabaseAdmin
        .from("departments")
        .select("id")
        .eq(
          "department_code",
          department_code
        )
        .neq("id", id)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingDepartment) {
      return NextResponse.json(
        {
          error:
            "รหัสแผนกนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: oldDepartment,
      error: oldDepartmentError,
    } =
      await supabaseAdmin
        .from("departments")
        .select(`
          id,
          department_code,
          department_name,
          department_color,
          department_icon,
          status,
          branch_departments (
            branch_id,
            branches (
              id,
              branch_code,
              branch_name
            )
          )
        `)
        .eq("id", id)
        .single();

    if (oldDepartmentError) {
      throw oldDepartmentError;
    }

    const allowedBranchIds = guard.hasAllScope
      ? []
      : await resolveAccessibleIds(
          guard.access,
          "branch"
        );

    const allowedBranchSet = new Set(
      allowedBranchIds.map(String)
    );

    const oldBranchRows =
      oldDepartment.branch_departments || [];

    const preservedOutsideScopeRows =
      guard.hasAllScope
        ? []
        : oldBranchRows.filter(
            (row) =>
              !allowedBranchSet.has(
                String(row.branch_id)
              )
          );

    const { error: updateError } =
      await supabaseAdmin
        .from("departments")
        .update({
          department_code,
          department_name,
          department_color,
          department_icon,
          status,
          updated_at:
            new Date()
              .toISOString(),
        })
        .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    let deleteRelationQuery =
      supabaseAdmin
        .from("branch_departments")
        .delete()
        .eq("department_id", id);

    /*
     * User ที่มี Scope บางสังกัด
     * ลบ/เขียนใหม่ได้เฉพาะ mapping ใน Scope ของตัวเอง
     * mapping ของบริษัท/สังกัดอื่นต้องคงเดิม
     */
    if (!guard.hasAllScope) {
      if (!allowedBranchIds.length) {
        return NextResponse.json(
          {
            success: false,
            error:
              "คุณไม่มี Scope สังกัดสำหรับแก้ไขแผนกนี้",
          },
          { status: 403 }
        );
      }

      deleteRelationQuery =
        deleteRelationQuery.in(
          "branch_id",
          allowedBranchIds
        );
    }

    const { error: deleteRelationError } =
      await deleteRelationQuery;

    if (deleteRelationError) {
      throw deleteRelationError;
    }

    const relationPayload = branch_ids.map(
      (branch_id) => ({
        branch_id,
        department_id: id,
        status: "active",
      })
    );

    if (relationPayload.length) {
      const { error: insertRelationError } =
        await supabaseAdmin
          .from("branch_departments")
          .insert(relationPayload);

      if (insertRelationError) {
        throw insertRelationError;
      }
    }

    const { data, error } =
      await supabaseAdmin
        .from("departments")
        .select(`
          id,
          department_code,
          department_name,
          department_color,
          department_icon,
          status,
          sort_order,
          created_at,
          branch_departments (
            branch_id,
            branches (
              id,
              branch_code,
              branch_name
            )
          )
        `)
        .eq("id", id)
        .single();

    if (error) {
      throw error;
    }

    const rawBranchRows =
      data.branch_departments || [];

    const branchRows = guard.hasAllScope
      ? rawBranchRows
      : rawBranchRows.filter(
          (row) =>
            allowedBranchSet.has(
              String(row.branch_id)
            )
        );

    await writeActivityLog({
      module_name: "departments",
      action_type: "update",
      reference_table:
        "departments",
      reference_id: data.id,
      description:
        `แก้ไขแผนก ${data.department_code} - ${data.department_name}`,
      old_data: {
        department_code:
          oldDepartment
            .department_code,
        department_name:
          oldDepartment
            .department_name,
        department_color:
          oldDepartment
            .department_color,
        department_icon:
          oldDepartment
            .department_icon,
        status:
          oldDepartment.status,
        branch_ids:
          (oldDepartment
            .branch_departments || [])
            .map(
              (row) =>
                row.branch_id
            ),
        branch_codes:
          (oldDepartment
            .branch_departments || [])
            .map(
              (row) =>
                row.branches
                  ?.branch_code
            )
            .filter(Boolean),
        branch_names:
          (oldDepartment
            .branch_departments || [])
            .map(
              (row) =>
                row.branches
                  ?.branch_name
            )
            .filter(Boolean),
      },
      new_data: {
        preserved_outside_scope_branch_count:
          preservedOutsideScopeRows.length,
        department_code:
          data.department_code,
        department_name:
          data.department_name,
        department_color:
          data.department_color,
        department_icon:
          data.department_icon,
        status: data.status,
        branch_ids:
          branchRows.map(
            (row) =>
              row.branch_id
          ),
        branch_codes:
          branchRows
            .map(
              (row) =>
                row.branches
                  ?.branch_code
            )
            .filter(Boolean),
        branch_names:
          branchRows
            .map(
              (row) =>
                row.branches
                  ?.branch_name
            )
            .filter(Boolean),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "อัพเดทข้อมูลแผนกสำเร็จ",
      data: {
        id: data.id,
        department_code:
          data.department_code,
        department_name:
          data.department_name,
        department_color:
          data.department_color ||
          "#E2E8F0",
        department_icon:
          data.department_icon || "",
        branch_ids:
          branchRows.map(
            (row) =>
              row.branch_id
          ),
        branch_names:
          branchRows
            .map(
              (row) =>
                row.branches
                  ?.branch_name
            )
            .filter(Boolean),
        branch_codes:
          branchRows
            .map(
              (row) =>
                row.branches
                  ?.branch_code
            )
            .filter(Boolean),
        status: data.status,
        sort_order:
          data.sort_order,
        created_at:
          data.created_at,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE_DEPARTMENT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "ไม่สามารถอัพเดทข้อมูลแผนกได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.departments",
        "delete",
        {
          scopeType:
            "department",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    const scopeError =
      guard.assertAccessId(
        id,
        "คุณไม่มีสิทธิ์ลบแผนกนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const {
      data: oldDepartment,
      error: oldDepartmentError,
    } =
      await supabaseAdmin
        .from("departments")
        .select(`
          id,
          department_code,
          department_name,
          status,
          branch_departments (
            branch_id,
            branches (
              id,
              branch_code,
              branch_name
            )
          )
        `)
        .eq("id", id)
        .single();

    if (oldDepartmentError) {
      throw oldDepartmentError;
    }

    if (!guard.hasAllScope) {
      const allowedBranchIds =
        await resolveAccessibleIds(
          guard.access,
          "branch"
        );

      const allowedBranchSet = new Set(
        allowedBranchIds.map(String)
      );

      const outsideScopeMappings =
        (oldDepartment.branch_departments || [])
          .filter(
            (row) =>
              !allowedBranchSet.has(
                String(row.branch_id)
              )
          );

      if (outsideScopeMappings.length) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่สามารถลบแผนกนี้ได้ เพราะยังถูกใช้งานในสังกัดที่อยู่นอก Scope ของคุณ",
          },
          { status: 403 }
        );
      }
    }

    const { error } =
      await supabaseAdmin
        .from("departments")
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name: "departments",
      action_type: "delete",
      reference_table:
        "departments",
      reference_id:
        oldDepartment.id,
      description:
        `ลบแผนก ${oldDepartment.department_code} - ${oldDepartment.department_name}`,
      old_data: {
        department_code:
          oldDepartment
            .department_code,
        department_name:
          oldDepartment
            .department_name,
        status:
          oldDepartment.status,
        branch_ids:
          (oldDepartment
            .branch_departments || [])
            .map(
              (row) =>
                row.branch_id
            ),
        branch_codes:
          (oldDepartment
            .branch_departments || [])
            .map(
              (row) =>
                row.branches
                  ?.branch_code
            )
            .filter(Boolean),
        branch_names:
          (oldDepartment
            .branch_departments || [])
            .map(
              (row) =>
                row.branches
                  ?.branch_name
            )
            .filter(Boolean),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบข้อมูลแผนกสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_DEPARTMENT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "ไม่สามารถลบข้อมูลแผนกได้",
      },
      {
        status: 500,
      }
    );
  }
}
