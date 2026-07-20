import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import {
  SELECT_FIELDS,
  mapAssignment,
  MANAGEMENT_LEVELS,
  ALLOWED_SCOPE_TYPES,
  normalizeScope,
  validateScopeTarget,
  getScopeUniqueKey,
  normalizePrimaryScopes,
  buildLegacyScopePayload,
} from "@/lib/managementAssignments";


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const management_level = searchParams.get("management_level")?.trim() || "";
    const scope_type = searchParams.get("scope_type")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const tree = searchParams.get("tree") === "true";

    let query = supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (management_level) query = query.eq("management_level", management_level);
    if (scope_type) query = query.eq("scope_type", scope_type);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) throw error;

    let mappedData = (data || []).map(mapAssignment);
    mappedData = mappedData.filter((item) => MANAGEMENT_LEVELS.includes(item.management_level));

    if (search) {
      mappedData = mappedData.filter((item) =>
        [
          item.employee_code,
          item.employee_name,

          item.position_name,

          item.job_code,
          item.job_name,

          item.management_level,
          item.scope_type,

          item.company_name,
          item.branch_group_name,
          item.branch_name,
          item.department_name,
          item.division_name,
          item.unit_name,

          item.supervisor_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(search)
          )
      );
    }

    if (tree) {
      const orgChartData = mappedData.map(
        (item) => ({
          id: item.employee_id,

          parentId:
            item.supervisor_employee_id || null,

          assignment_id:
            item.id,

          employee_id:
            item.employee_id,

          employee_code:
            item.employee_code,

          name:
            item.employee_name,

          employee_photo_url:
            item.employee_photo_url,

          position_name:
            item.position_name,

          job_name:
            item.job_name,

          management_level:
            item.management_level,

          scope_type:
            item.scope_type,

          company_id:
            item.company_id,

          company_name:
            item.company_name,

          branch_group_id:
            item.branch_group_id,

          branch_group_name:
            item.branch_group_name,

          branch_group_color:
            item.branch_group_color,

          branch_id:
            item.branch_id,

          branch_name:
            item.branch_name,

          department_id:
            item.department_id,

          department_name:
            item.department_name,

          department_color:
            item.department_color,

          supervisor_employee_id:
            item.supervisor_employee_id,

          supervisor_name:
            item.supervisor_name,

          status:
            item.status,

          sort_order:
            item.sort_order,
        })
      );

      return NextResponse.json({
        success: true,
        data: mappedData,
        tree: orgChartData,
      });
    }

    return NextResponse.json({
      success: true,
      data: mappedData,
    });
  } catch (error) {
    console.error("GET_MANAGEMENT_ASSIGNMENTS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถดึงข้อมูลสายบังคับบัญชาได้" },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST: Create Management Assignment + Multiple Scopes
===================================================== */
export async function POST(req) {
  let createdAssignmentId = null;
  try {
    const body = await req.json();
    const employeeId = body?.employee_id || null;
    const managementLevel = String(body?.management_level || "").trim().toUpperCase();
    const supervisorEmployeeId = body?.supervisor_employee_id || null;
    const status = body?.status === "inactive" ? "inactive" : "active";
    const sortOrder = Number(body?.sort_order || 0);
    const isPrimary = body?.is_primary ?? true;
    let rawScopes = Array.isArray(body?.scopes)? body.scopes: [];
    if (rawScopes.length === 0 && body?.scope_type) {
      rawScopes = [
        {
          scope_type: body.scope_type,
          company_id: body.company_id,
          branch_group_id: body.branch_group_id,
          branch_id:body.branch_id,
          department_id:body.department_id,
          division_id:
            body.division_id,

          unit_id:
            body.unit_id,

          is_primary: true,
          status,
          sort_order: 0,
        },
      ];
    }

    let scopes = rawScopes.map(
      (scope, index) =>
        normalizeScope(
          scope,
          index
        )
    );

    /* =================================================
       Basic Validation
    ================================================= */

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกพนักงาน",
        },
        { status: 400 }
      );
    }

    if (
      !MANAGEMENT_LEVELS.includes(
        managementLevel
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Management Level ต้องเป็น P9 ถึง P12",
        },
        { status: 400 }
      );
    }

    if (scopes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากำหนดขอบเขตการดูแลอย่างน้อย 1 รายการ",
        },
        { status: 400 }
      );
    }

    /* =================================================
       Validate Scope Type ตาม Level
    ================================================= */

    const allowedScopeTypes =
      ALLOWED_SCOPE_TYPES[
        managementLevel
      ] || [];

    for (const scope of scopes) {
      const targetError =
        validateScopeTarget(scope);

      if (targetError) {
        return NextResponse.json(
          {
            success: false,
            error: targetError,
          },
          { status: 400 }
        );
      }

      if (
        !allowedScopeTypes.includes(
          scope.scope_type
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `ระดับ ${managementLevel} ไม่สามารถใช้ Scope ${scope.scope_type} ได้`,
          },
          { status: 400 }
        );
      }
    }

    /* =================================================
       Scope ห้ามซ้ำ
    ================================================= */

    const uniqueScopeKeys =
      new Set();

    for (const scope of scopes) {
      const uniqueKey =
        getScopeUniqueKey(scope);

      if (
        !uniqueKey ||
        uniqueScopeKeys.has(
          uniqueKey
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "พบขอบเขตการดูแลซ้ำกัน",
          },
          { status: 400 }
        );
      }

      uniqueScopeKeys.add(
        uniqueKey
      );
    }

    /* =================================================
       Primary Scope ต้องมีหนึ่งรายการ

       ถ้าไม่มี ระบบตั้งรายการแรก
       ถ้ามีหลายรายการ ระบบเก็บรายการแรกเป็น Primary
    ================================================= */

    scopes = normalizePrimaryScopes(scopes);

    /* =================================================
       P12 ต้องเป็น all เท่านั้น
    ================================================= */

    if (managementLevel === "P12") {
      const validP12 =
        scopes.length === 1 &&
        scopes[0].scope_type ===
          "all";

      if (!validP12) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ระดับ P12 ต้องมี Scope ทั้งองค์กรเพียงรายการเดียว",
          },
          { status: 400 }
        );
      }
    }

    /* =================================================
       Supervisor Validation
    ================================================= */

    if (
      managementLevel === "P12" &&
      supervisorEmployeeId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ระดับ P12 ไม่ต้องมีผู้บังคับบัญชา",
        },
        { status: 400 }
      );
    }

    if (
      managementLevel !== "P12" &&
      !supervisorEmployeeId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกผู้บังคับบัญชา",
        },
        { status: 400 }
      );
    }

    if (
      String(employeeId) ===
      String(supervisorEmployeeId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "พนักงานไม่สามารถเป็นผู้บังคับบัญชาของตัวเองได้",
        },
        { status: 400 }
      );
    }

    /* =================================================
       ตรวจ Employee
    ================================================= */

    const {
      data: selectedEmployee,
      error: employeeError,
    } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        job_id,
        position_id,

        jobs (
          management_level
        ),
        positions (
          position_level
        )
      `)
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError) {
      throw employeeError;
    }

    if (!selectedEmployee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลพนักงาน",
        },
        { status: 404 }
      );
    }

    const employeeManagementLevel = selectedEmployee.jobs ?.management_level || selectedEmployee.positions?.position_level || "";

    if (employeeManagementLevel && employeeManagementLevel !== managementLevel) {
      return NextResponse.json(
        {
          success: false,
          error:
            `ระดับพนักงานเป็น ${employeeManagementLevel} แต่ Assignment ระบุ ${managementLevel}`,
        },
        { status: 400 }
      );
    }

    /* =================================================
       ป้องกัน Employee มี Assignment ซ้ำ
    ================================================= */

    const { data: existingAssignment, error:existingAssignmentError,} = await supabaseAdmin
      .from(
        "management_assignments"
      )
      .select("id")
      .eq(
        "employee_id",
        employeeId
      )
      .maybeSingle();

    if (existingAssignmentError) {
      throw existingAssignmentError;
    }

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "พนักงานคนนี้มีสายบังคับบัญชาอยู่แล้ว",
        },
        { status: 409 }
      );
    }

    /* =================================================
       Compatibility Columns

       เก็บ Primary Scope ลง Column เดิม
    ================================================= */

    const legacyScopePayload =
      buildLegacyScopePayload(
        scopes
      );

    const assignmentPayload = {
      employee_id:
        employeeId,

      management_level:
        managementLevel,

      supervisor_employee_id:
        managementLevel === "P12"
          ? null
          : supervisorEmployeeId,

      is_primary:
        Boolean(isPrimary),

      status,
      sort_order:
        sortOrder,

      ...legacyScopePayload,
    };

    /* =================================================
       Insert Assignment
    ================================================= */

    const {
      data: createdAssignment,
      error: assignmentError,
    } = await supabaseAdmin
      .from(
        "management_assignments"
      )
      .insert([
        assignmentPayload,
      ])
      .select("id")
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    createdAssignmentId =
      createdAssignment.id;

    /* =================================================
       Insert Scopes
    ================================================= */

    const scopeRows = scopes.map(
      (scope, index) => ({
        management_assignment_id:createdAssignmentId,
        scope_type:scope.scope_type,
        company_id:scope.company_id,
        branch_group_id:scope.branch_group_id,
        branch_id:scope.branch_id,
        department_id:scope.department_id,
        division_id:scope.division_id,
        unit_id:scope.unit_id,
        is_primary:Boolean(scope.is_primary),
        status:scope.status,
        sort_order:Number(scope.sort_order ?? index) || 0,
      })
    );

    const {error: scopesError,} = await supabaseAdmin
      .from(
        "management_assignment_scopes"
      )
      .insert(scopeRows);

    if (scopesError) {
      throw scopesError;
    }

    /* =================================================
       Read Full Created Assignment
    ================================================= */

    const {data: resultData,error: resultError,} = await supabaseAdmin
      .from(
        "management_assignments"
      )
      .select(SELECT_FIELDS)
      .eq(
        "id",
        createdAssignmentId
      )
      .single();

    if (resultError) {
      throw resultError;
    }
    const mapped =mapAssignment(resultData);

    await writeActivityLog({
      module_name:"management_assignments",
      action_type:"create",
      reference_table:"management_assignments",
      reference_id:
        createdAssignmentId,
      description:`เพิ่มสายบังคับบัญชา ${mapped.employee_name} พร้อม Scope ${mapped.scopes.length} รายการ`,
      new_data: mapped,
    });

    return NextResponse.json({
      success: true,
      message:"เพิ่มสายบังคับบัญชาและขอบเขตการดูแลสำเร็จ",
      data: mapped,
    });
  } catch (error) {
    console.error("CREATE_MANAGEMENT_ASSIGNMENT_ERROR:",error);

    /*
     * Supabase JS หลาย Query ไม่ได้เป็น Transaction เดียวกัน
     * หากสร้าง Assignment สำเร็จแต่ Scope ไม่สำเร็จ
     * ให้ลบ Assignment ที่สร้างไปแล้วเพื่อ Rollback
     *
     * Scope จะถูกลบตาม on delete cascade
     */
    if (createdAssignmentId) {
      const {
        error: rollbackError,
      } = await supabaseAdmin
        .from(
          "management_assignments"
        )
        .delete()
        .eq(
          "id",
          createdAssignmentId
        );
      if (rollbackError) {
        console.error("ROLLBACK_MANAGEMENT_ASSIGNMENT_ERROR:",rollbackError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:error.message ||"ไม่สามารถบันทึกสายบังคับบัญชาได้",
      },
      { status: 500 }
    );
  }
}