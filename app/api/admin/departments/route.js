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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const scopeContext =
      searchParams.get("scope_context")?.trim() || "";

    const permissionModule =
      scopeContext === "ems.employees"
        ? "ems.employees"
        : "ems.departments";

    const guard = await requireScopedAccess(
      permissionModule,
      "view",
      { scopeType: "department" }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const search =
      searchParams
        .get("search")
        ?.trim()
        .toLowerCase() || "";

    const statusFilter =
      searchParams
        .get("status")
        ?.trim() || "";

    const all =
      searchParams.get("all") ===
      "true";

    let query =
      supabaseAdmin
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
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    query = guard.applyScope(
      query,
      "id"
    );

    if (statusFilter) {
      query = query.eq(
        "status",
        statusFilter
      );
    }

    if (all) {
      query = query.limit(5000);
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    /*
     * Filter relation ที่แสดงกลับไปด้วย
     * ไม่ให้ Department ถูกต้อง แต่ branch_names หลุดไปเห็นสังกัดนอก chain
     */
    let allowedBranchSet = null;

    if (!guard.hasAllScope) {
      const allowedBranchIds =
        await resolveAccessibleIds(
          guard.access,
          "branch",
          {
            permission:
              guard.permission,
          }
        );

      allowedBranchSet = new Set(
        allowedBranchIds.map(String)
      );
    }

    const mappedData =
      (data || []).map(
        (department) => {
          const rawBranchRows =
            department
              .branch_departments ||
            [];

          const branchRows =
            guard.hasAllScope
              ? rawBranchRows
              : rawBranchRows.filter(
                  (row) =>
                    allowedBranchSet?.has(
                      String(
                        row.branch_id
                      )
                    )
                );

          return {
            id: department.id,
            department_code:
              department.department_code ||
              "",
            department_name:
              department.department_name ||
              "",
            department_color:
              department.department_color ||
              "#E2E8F0",
            department_icon:
              department.department_icon ||
              "",
            branch_ids:
              branchRows
                .map(
                  (row) =>
                    row.branch_id
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
            branch_codes:
              branchRows
                .map(
                  (row) =>
                    row.branches
                      ?.branch_code
                )
                .filter(Boolean),
            status:
              department.status,
            sort_order:
              Number(
                department.sort_order ||
                  0
              ),
            created_at:
              department.created_at,
          };
        }
      );

    const filteredData =
      search
        ? mappedData.filter(
            (item) =>
              item.department_code
                ?.toLowerCase()
                .includes(search) ||
              item.department_name
                ?.toLowerCase()
                .includes(search) ||
              item.branch_names
                ?.some(
                  (name) =>
                    name
                      ?.toLowerCase()
                      .includes(search)
                ) ||
              item.branch_codes
                ?.some(
                  (code) =>
                    code
                      ?.toLowerCase()
                      .includes(search)
                ) ||
              item.status
                ?.toLowerCase()
                .includes(search)
          )
        : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error(
      "GET_DEPARTMENTS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ไม่สามารถดึงข้อมูลแผนกได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.departments",
        "create",
        {
          scopeType:
            "department",
        }
      );

    if (!guard.ok) {
      return guard.response;
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
      data: department,
      error: departmentError,
    } =
      await supabaseAdmin
        .from("departments")
        .insert([
          {
            department_code,
            department_name,
            department_color,
            department_icon,
            status,
          },
        ])
        .select(`
          id,
          department_code,
          department_name,
          department_color,
          department_icon,
          status,
          sort_order,
          created_at
        `)
        .single();

    if (departmentError) {
      throw departmentError;
    }

    const branchDepartmentPayload =
      branch_ids.map(
        (branch_id) => ({
          branch_id,
          department_id:
            department.id,
          status: "active",
        })
      );

    const {
      error: relationError,
    } =
      await supabaseAdmin
        .from(
          "branch_departments"
        )
        .insert(
          branchDepartmentPayload
        );

    if (relationError) {
      /* กัน orphan department ถ้า relation insert ไม่ผ่าน */
      await supabaseAdmin
        .from("departments")
        .delete()
        .eq("id", department.id);

      throw relationError;
    }

    const {
      data: fullDepartment,
      error: fetchError,
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
        .eq("id", department.id)
        .single();

    if (fetchError) {
      throw fetchError;
    }

    const branchRows =
      fullDepartment
        .branch_departments || [];

    await writeActivityLog({
      module_name: "departments",
      action_type: "create",
      reference_table:
        "departments",
      reference_id:
        fullDepartment.id,
      description:
        `เพิ่มแผนก ${fullDepartment.department_code} - ${fullDepartment.department_name}`,
      new_data: {
        department_code:
          fullDepartment
            .department_code,
        department_name:
          fullDepartment
            .department_name,
        department_color:
          fullDepartment
            .department_color,
        department_icon:
          fullDepartment
            .department_icon,
        status:
          fullDepartment.status,
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
        "เพิ่มข้อมูลแผนกสำเร็จ",
      data: {
        id:
          fullDepartment.id,
        department_code:
          fullDepartment
            .department_code,
        department_name:
          fullDepartment
            .department_name,
        department_color:
          fullDepartment
            .department_color,
        department_icon:
          fullDepartment
            .department_icon || "",
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
        status:
          fullDepartment.status,
        sort_order:
          fullDepartment
            .sort_order,
        created_at:
          fullDepartment
            .created_at,
      },
    });
  } catch (error) {
    console.error(
      "CREATE_DEPARTMENT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "ไม่สามารถบันทึกข้อมูลแผนกได้",
      },
      {
        status: 500,
      }
    );
  }
}
