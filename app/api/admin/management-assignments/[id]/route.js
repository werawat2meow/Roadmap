import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const SELECT_FIELDS = `
  id,
  employee_id,
  management_level,
  scope_type,

  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,

  supervisor_employee_id,
  is_primary,
  status,
  sort_order,
  created_at,
  updated_at,

  employees!management_assignments_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    employee_photo_url,

    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,

    position_id,
    job_id,

    positions (
      id,
      position_code,
      position_name,
      position_level
    ),

    jobs (
      id,
      job_code,
      job_name,
      job_level,
      management_level,
      scope_type,
      can_manage_employees,
      can_approve_budget
    )
  ),

  supervisor:employees!management_assignments_supervisor_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    employee_photo_url,

    positions (
      id,
      position_name,
      position_level
    ),

    jobs (
      id,
      job_name,
      management_level
    )
  ),

  companies (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),

  branch_groups (
    id,
    group_code,
    group_name,
    group_color
  ),

  branches (
    id,
    branch_code,
    branch_name
  ),

  departments (
    id,
    department_code,
    department_name,
    department_color
  ),

  divisions (
    id,
    division_code,
    division_name
  ),

  units (
    id,
    unit_code,
    unit_name
  ),

  management_assignment_scopes (
    id,
    scope_type,

    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,

    is_primary,
    status,
    sort_order,
    created_at,
    updated_at,

    companies (
      id,
      company_code,
      company_name_th,
      company_name_en
    ),

    branch_groups (
      id,
      group_code,
      group_name,
      group_color
    ),

    branches (
      id,
      branch_code,
      branch_name
    ),

    departments (
      id,
      department_code,
      department_name,
      department_color
    ),

    divisions (
      id,
      division_code,
      division_name
    ),

    units (
      id,
      unit_code,
      unit_name
    )
  )
`;

const mapAssignment = (item) => {
  const employee = item.employees || {};
  const position = employee.positions || {};
  const job = employee.jobs || {};
  const supervisor = item.supervisor || {};
  const supervisorPosition = supervisor.positions || {};
  const supervisorJob = supervisor.jobs || {};
  const scopes = item.management_assignment_scopes || [];
  const resolvedManagementLevel = job.management_level || position.position_level || item.management_level || "";
  const resolvedScopeType = item.scope_type || job.scope_type || "";
  const mappedScopes = scopes.map( (scope) => ({
      id: scope.id,
      scope_type: scope.scope_type,
      company_id: scope.company_id || "",
      company_name: scope.companies ?.company_name_th || scope.companies ?.company_name_en || "",
      branch_group_id: scope.branch_group_id || "",
      branch_group_name: scope.branch_groups ?.group_name || "",
      branch_group_color: scope.branch_groups ?.group_color || "#E2E8F0",
      branch_id:scope.branch_id || "",
      branch_name: scope.branches?.branch_name || "",
      department_id: scope.department_id || "",
      department_name: scope.departments ?.department_name || "",
      department_color: scope.departments ?.department_color || "#E2E8F0",
      division_id: scope.division_id || "",
      division_name:scope.divisions?.division_name || "",
      unit_id:scope.unit_id || "",
      unit_name: scope.units?.unit_name || "",
      is_primary:scope.is_primary,
      status:scope.status,
      sort_order: Number(scope.sort_order || 0),
    })
  );

  return {
    id: item.id,
    employee_id: item.employee_id || "",
    employee_code: employee.employee_code || "",
    employee_name:`${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim() || `${employee.first_name_en || ""} ${employee.last_name_en || ""}`.trim() || "-",
    employee_photo_url: employee.employee_photo_url || "",
    position_id:employee.position_id || "",
    position_code:position.position_code || "",
    position_name:position.position_name || "-",
    position_level:position.position_level || "",
    job_id:employee.job_id || "",
    job_code:job.job_code || "",
    job_name:job.job_name || "-",
    job_level:job.job_level || "",
    job_management_level:job.management_level || "",
    job_scope_type:job.scope_type || "",
    can_manage_employees:job.can_manage_employees ?? false,
    can_approve_budget:job.can_approve_budget ?? false,
    management_level: resolvedManagementLevel,
    scope_type: resolvedScopeType,
    scopes: mappedScopes,
    company_id:item.company_id || "",
    company_name:item.companies?.company_name_th ||item.companies?.company_name_en ||"",
    branch_group_id:item.branch_group_id ||employee.branch_group_id ||"",
    branch_group_name: item.branch_groups?.group_name || "",
    branch_group_color: item.branch_groups?.group_color || "#E2E8F0",
    branch_id:item.branch_id || employee.branch_id || "",
    branch_name:item.branches?.branch_name || "",
    department_id:item.department_id ||employee.department_id ||"",
    department_name:item.departments?.department_name || "",
    department_color:item.departments?.department_color || "#E2E8F0",
    division_id:item.division_id ||employee.division_id ||"",
    division_name:item.divisions?.division_name || "",
    unit_id:item.unit_id ||employee.unit_id ||"",
    unit_name:item.units?.unit_name || "",
    supervisor_employee_id:item.supervisor_employee_id || "",
    supervisor_code:supervisor.employee_code || "",
    supervisor_name:`${supervisor.first_name_th || ""} ${supervisor.last_name_th || "" }`.trim() || `${supervisor.first_name_en || ""} ${supervisor.last_name_en || ""}`.trim() ||"",
    supervisor_photo_url:supervisor.employee_photo_url || "",
    supervisor_position_name:supervisorPosition.position_name || "",
    supervisor_management_level:supervisorJob.management_level ||supervisorPosition.position_level ||"",
    is_primary:item.is_primary ?? true,
    status:item.status || "active",
    sort_order:Number(item.sort_order || 0),
    created_at:item.created_at,
    updated_at:item.updated_at,
  };
};

const MANAGEMENT_LEVELS = [
  "P9",
  "P10",
  "P11",
  "P12",
];

const SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

const ALLOWED_SCOPE_TYPES = {
  P12: ["all"],
  P11: ["company"],
  P10: [
    "branch_group",
    "department",
  ],
  P9: [
    "department",
    "division",
    "unit",
  ],
};

/* =========================
   Normalize Scope
========================= */
function normalizeScope(scope = {}, index = 0) {
  const scopeType = String(
    scope?.scope_type || ""
  )
    .trim()
    .toLowerCase();

  return {
    scope_type: scopeType,

    company_id:
      scopeType === "company"
        ? scope?.company_id || null
        : null,

    branch_group_id:
      scopeType === "branch_group"
        ? scope?.branch_group_id || null
        : null,

    branch_id:
      scopeType === "branch"
        ? scope?.branch_id || null
        : null,

    department_id:
      scopeType === "department"
        ? scope?.department_id || null
        : null,

    division_id:
      scopeType === "division"
        ? scope?.division_id || null
        : null,

    unit_id:
      scopeType === "unit"
        ? scope?.unit_id || null
        : null,

    is_primary:
      Boolean(scope?.is_primary),

    status:
      scope?.status === "inactive"
        ? "inactive"
        : "active",

    sort_order:
      Number(scope?.sort_order ?? index) || 0,
  };
}

/* =========================
   Validate Scope Target
========================= */
function validateScopeTarget(scope) {
  if (
    !SCOPE_TYPES.includes(
      scope.scope_type
    )
  ) {
    return "ประเภทขอบเขตการดูแลไม่ถูกต้อง";
  }

  if (scope.scope_type === "all") {
    return "";
  }

  const requiredFieldMap = {
    company: "company_id",
    branch_group: "branch_group_id",
    branch: "branch_id",
    department: "department_id",
    division: "division_id",
    unit: "unit_id",
  };

  const requiredField =
    requiredFieldMap[scope.scope_type];

  if (
    requiredField &&
    !scope[requiredField]
  ) {
    const errorMessageMap = {
      company: "กรุณาเลือกบริษัท",
      branch_group:
        "กรุณาเลือกกลุ่มสาขา",
      branch: "กรุณาเลือกสาขา",
      department: "กรุณาเลือกแผนก",
      division: "กรุณาเลือกฝ่าย",
      unit: "กรุณาเลือกหน่วยงาน",
    };

    return (
      errorMessageMap[
        scope.scope_type
      ] ||
      "กรุณาเลือกขอบเขตการดูแล"
    );
  }

  return "";
}

/* =========================
   Scope Unique Key
========================= */
function getScopeUniqueKey(scope) {
  switch (scope.scope_type) {
    case "all":
      return "all";

    case "company":
      return `company:${scope.company_id}`;

    case "branch_group":
      return `branch_group:${scope.branch_group_id}`;

    case "branch":
      return `branch:${scope.branch_id}`;

    case "department":
      return `department:${scope.department_id}`;

    case "division":
      return `division:${scope.division_id}`;

    case "unit":
      return `unit:${scope.unit_id}`;

    default:
      return "";
  }
}

/* =========================
   Primary Scope
========================= */
function normalizePrimaryScopes(scopes) {
  let primaryFound = false;

  const normalized = scopes.map(
    (scope, index) => {
      const canBePrimary =
        scope.is_primary &&
        !primaryFound;

      if (canBePrimary) {
        primaryFound = true;
      }

      return {
        ...scope,
        is_primary: canBePrimary,
        sort_order:
          Number(
            scope.sort_order ?? index
          ) || 0,
      };
    }
  );

  if (
    normalized.length > 0 &&
    !primaryFound
  ) {
    normalized[0] = {
      ...normalized[0],
      is_primary: true,
    };
  }

  return normalized;
}

/* =========================
   Legacy Primary Scope

   เก็บ Scope หลักกลับลง Column เดิม
========================= */
function buildLegacyScopePayload(scopes) {
  const primaryScope =
    scopes.find(
      (scope) => scope.is_primary
    ) ||
    scopes[0] ||
    null;

  return {
    scope_type:
      primaryScope?.scope_type ||
      null,

    company_id:
      primaryScope?.scope_type ===
      "company"
        ? primaryScope.company_id
        : null,

    branch_group_id:
      primaryScope?.scope_type ===
      "branch_group"
        ? primaryScope.branch_group_id
        : null,

    branch_id:
      primaryScope?.scope_type ===
      "branch"
        ? primaryScope.branch_id
        : null,

    department_id:
      primaryScope?.scope_type ===
      "department"
        ? primaryScope.department_id
        : null,

    division_id:
      primaryScope?.scope_type ===
      "division"
        ? primaryScope.division_id
        : null,

    unit_id:
      primaryScope?.scope_type ===
      "unit"
        ? primaryScope.unit_id
        : null,
  };
}

/* =========================
   Convert DB Scope for Rollback
========================= */
function buildScopeRowsFromOldData(
  assignmentId,
  oldScopes = []
) {
  return oldScopes.map(
    (scope, index) => ({
      management_assignment_id:
        assignmentId,

      scope_type:
        scope.scope_type,

      company_id:
        scope.company_id || null,

      branch_group_id:
        scope.branch_group_id || null,

      branch_id:
        scope.branch_id || null,

      department_id:
        scope.department_id || null,

      division_id:
        scope.division_id || null,

      unit_id:
        scope.unit_id || null,

      is_primary:
        scope.is_primary ?? false,

      status:
        scope.status || "active",

      sort_order:
        Number(
          scope.sort_order ?? index
        ) || 0,
    })
  );
}

export async function PATCH(req,{ params }) {
  let assignmentUpdated = false;
  let oldAssignmentPayload = null;
  let oldScopeRows = [];

  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรหัสสายบังคับบัญชา",
        },
        { status: 400 }
      );
    }

    /* =========================
       โหลดข้อมูลเดิม
    ========================= */
    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลสายบังคับบัญชา",
        },
        { status: 404 }
      );
    }

    const oldMapped =
      mapAssignment(oldData);

    oldScopeRows =
      buildScopeRowsFromOldData(
        id,
        oldData.management_assignment_scopes ||
          []
      );

    /*
     * เก็บ Payload เดิมไว้สำหรับ Rollback
     */
    oldAssignmentPayload = {
      employee_id:
        oldData.employee_id,

      management_level:
        oldData.management_level,

      scope_type:
        oldData.scope_type,

      company_id:
        oldData.company_id,

      branch_group_id:
        oldData.branch_group_id,

      branch_id:
        oldData.branch_id,

      department_id:
        oldData.department_id,

      division_id:
        oldData.division_id,

      unit_id:
        oldData.unit_id,

      supervisor_employee_id:
        oldData.supervisor_employee_id,

      is_primary:
        oldData.is_primary,

      status:
        oldData.status,

      sort_order:
        oldData.sort_order,

      updated_at:
        oldData.updated_at,
    };

    /* =========================
       Assignment Data
    ========================= */
    const employeeId =
      body?.employee_id ||
      oldData.employee_id ||
      null;

    const managementLevel =
      String(
        body?.management_level ||
          oldData.management_level ||
          ""
      )
        .trim()
        .toUpperCase();

    const supervisorEmployeeId =
      body?.supervisor_employee_id ||
      null;

    const status =
      body?.status === "inactive"
        ? "inactive"
        : "active";

    const isPrimary =
      body?.is_primary ?? true;

    const sortOrder =
      Number(body?.sort_order || 0);

    /* =========================
       รองรับ Payload ใหม่และเก่า
    ========================= */
    let rawScopes =
      Array.isArray(body?.scopes)
        ? body.scopes
        : [];

    /*
     * ถ้าหน้าเดิมยังส่ง Scope แบบ Flat
     */
    if (
      rawScopes.length === 0 &&
      body?.scope_type
    ) {
      rawScopes = [
        {
          scope_type:
            body.scope_type,

          company_id:
            body.company_id,

          branch_group_id:
            body.branch_group_id,

          branch_id:
            body.branch_id,

          department_id:
            body.department_id,

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

    /*
     * ถ้าไม่ได้ส่ง Scope ใหม่มาเลย
     * ให้ใช้ Scope เดิมจากฐานข้อมูล
     */
    if (
      rawScopes.length === 0 &&
      oldScopeRows.length > 0
    ) {
      rawScopes =
        oldScopeRows.map(
          (scope) => ({
            ...scope,
          })
        );
    }

    let scopes = rawScopes.map(
      (scope, index) =>
        normalizeScope(
          scope,
          index
        )
    );

    /* =========================
       Validation พื้นฐาน
    ========================= */
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

    /* =========================
       Validate Scope
    ========================= */
    const allowedScopeTypes =
      ALLOWED_SCOPE_TYPES[
        managementLevel
      ] || [];

    const uniqueKeys = new Set();

    for (const scope of scopes) {
      const validationError =
        validateScopeTarget(scope);

      if (validationError) {
        return NextResponse.json(
          {
            success: false,
            error: validationError,
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

      const uniqueKey =
        getScopeUniqueKey(scope);

      if (
        !uniqueKey ||
        uniqueKeys.has(uniqueKey)
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

      uniqueKeys.add(uniqueKey);
    }

    scopes =
      normalizePrimaryScopes(scopes);

    /* =========================
       P12 Validation
    ========================= */
    if (managementLevel === "P12") {
      const isValidP12 =
        scopes.length === 1 &&
        scopes[0].scope_type ===
          "all";

      if (!isValidP12) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ระดับ P12 ต้องมี Scope ทั้งองค์กรเพียงรายการเดียว",
          },
          { status: 400 }
        );
      }

      if (supervisorEmployeeId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ระดับ P12 ไม่ต้องมีผู้บังคับบัญชา",
          },
          { status: 400 }
        );
      }
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

    /* =========================
       ตรวจสอบ Employee
    ========================= */
    const {
      data: selectedEmployee,
      error: employeeError,
    } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        position_id,
        job_id,

        positions (
          position_level
        ),

        jobs (
          management_level
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

    const employeeManagementLevel =
      selectedEmployee.jobs
        ?.management_level ||
      selectedEmployee.positions
        ?.position_level ||
      "";

    if (
      employeeManagementLevel &&
      employeeManagementLevel !==
        managementLevel
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `ระดับพนักงานเป็น ${employeeManagementLevel} แต่ Assignment ระบุ ${managementLevel}`,
        },
        { status: 400 }
      );
    }

    /* =========================
       ป้องกัน Employee ซ้ำ

       ต้องยกเว้น Assignment ปัจจุบัน
    ========================= */
    const {
      data: duplicateAssignment,
      error: duplicateError,
    } = await supabaseAdmin
      .from("management_assignments")
      .select("id")
      .eq("employee_id", employeeId)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicateAssignment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "พนักงานคนนี้มีสายบังคับบัญชาอยู่แล้ว",
        },
        { status: 409 }
      );
    }

    /* =========================
       สร้าง Assignment Payload

       Scope หลักยังเก็บลง Column เดิม
    ========================= */
    const legacyScopePayload =
      buildLegacyScopePayload(
        scopes
      );

    const assignmentPayload = {
      employee_id: employeeId,

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

      updated_at:
        new Date().toISOString(),

      ...legacyScopePayload,
    };

    /* =========================
       Update Assignment
    ========================= */
    const {
      error: updateError,
    } = await supabaseAdmin
      .from("management_assignments")
      .update(assignmentPayload)
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    assignmentUpdated = true;

    /* =========================
       ลบ Scope เดิม
    ========================= */
    const {
      error: deleteScopesError,
    } = await supabaseAdmin
      .from(
        "management_assignment_scopes"
      )
      .delete()
      .eq(
        "management_assignment_id",
        id
      );

    if (deleteScopesError) {
      throw deleteScopesError;
    }

    /* =========================
       Insert Scope ใหม่
    ========================= */
    const scopeRows = scopes.map(
      (scope, index) => ({
        management_assignment_id:
          id,

        scope_type:
          scope.scope_type,

        company_id:
          scope.company_id,

        branch_group_id:
          scope.branch_group_id,

        branch_id:
          scope.branch_id,

        department_id:
          scope.department_id,

        division_id:
          scope.division_id,

        unit_id:
          scope.unit_id,

        is_primary:
          Boolean(
            scope.is_primary
          ),

        status:
          scope.status,

        sort_order:
          Number(
            scope.sort_order ?? index
          ) || 0,
      })
    );

    const {
      error: insertScopesError,
    } = await supabaseAdmin
      .from(
        "management_assignment_scopes"
      )
      .insert(scopeRows);

    if (insertScopesError) {
      throw insertScopesError;
    }

    /* =========================
       อ่านข้อมูลหลังแก้ไข
    ========================= */
    const {
      data: newData,
      error: newDataError,
    } = await supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .single();

    if (newDataError) {
      throw newDataError;
    }

    const newMapped =
      mapAssignment(newData);

    await writeActivityLog({
      module_name:
        "management_assignments",

      action_type:
        "update",

      reference_table:
        "management_assignments",

      reference_id:
        id,

      description:
        `แก้ไขสายบังคับบัญชา ${newMapped.employee_name} (${newMapped.management_level}) พร้อม Scope ${newMapped.scopes.length} รายการ`,

      old_data: oldMapped,
      new_data: newMapped,
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขสายบังคับบัญชาและขอบเขตการดูแลสำเร็จ",

      data: newMapped,
    });
  } catch (error) {
    console.error(
      "UPDATE_MANAGEMENT_ASSIGNMENT_ERROR:",
      error
    );

    /* =========================
       Compensating Rollback
    ========================= */
    if (assignmentUpdated && oldAssignmentPayload) {
      try {
        /*
         * คืนค่า Assignment เดิม
         */
        await supabaseAdmin.from("management_assignments")
          .update(oldAssignmentPayload)
          .eq("id",(
            await params
          ).id);

        /*
         * ลบ Scope ที่อาจสร้างค้างไว้
         */
        await supabaseAdmin
          .from(
            "management_assignment_scopes"
          )
          .delete()
          .eq(
            "management_assignment_id",
            (
              await params
            ).id
          );

        /*
         * คืน Scope เดิม
         */
        if (
          oldScopeRows.length > 0
        ) {
          await supabaseAdmin
            .from(
              "management_assignment_scopes"
            )
            .insert(oldScopeRows);
        }
      } catch (rollbackError) {
        console.error(
          "ROLLBACK_MANAGEMENT_ASSIGNMENT_ERROR:",
          rollbackError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถแก้ไขสายบังคับบัญชาได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const oldMapped = mapAssignment(oldData);

    const { error } = await supabaseAdmin
      .from("management_assignments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "management_assignments",
      action_type: "delete",
      reference_table: "management_assignments",
      reference_id: oldData.id,
      description: `ลบสายบังคับบัญชา ${oldMapped.employee_name} (${oldMapped.management_level})`,
      old_data: oldMapped,
    });

    return NextResponse.json({
      success: true,
      message: "ลบสายบังคับบัญชาสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_MANAGEMENT_ASSIGNMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบสายบังคับบัญชาได้",
      },
      { status: 500 }
    );
  }
}