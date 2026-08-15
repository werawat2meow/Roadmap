import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   Constants
========================================================= */

export const ORG_SCOPE_FIELDS = [
  "company_id",
  "branch_group_id",
  "branch_id",
  "department_id",
  "division_id",
  "unit_id",
];

export const ORG_SLOT_SELECT = `
  id,
  slot_code,
  slot_name,

  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,

  position_id,
  parent_slot_id,

  slot_type,
  employment_capacity,
  sort_order,
  status,

  effective_from,
  effective_to,

  created_at,
  updated_at,

  companies:companies!org_position_slots_company_fkey (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),

  branch_groups:branch_groups!org_position_slots_branch_group_fkey (
    id,
    group_code,
    group_name,
    group_color
  ),

  branches:branches!org_position_slots_branch_fkey (
    id,
    branch_code,
    branch_name
  ),

  departments:departments!org_position_slots_department_fkey (
    id,
    department_code,
    department_name
  ),

  divisions:divisions!org_position_slots_division_fkey (
    id,
    division_code,
    division_name
  ),

  units:units!org_position_slots_unit_fkey (
    id,
    unit_code,
    unit_name
  ),

  positions:positions!org_position_slots_position_fkey (
    id,
    position_code,
    position_name,
    status
  ),

  employee_position_assignments:employee_position_assignments!employee_position_assignments_slot_fkey (
    id,
    employee_id,
    position_slot_id,
    assignment_type,
    effective_from,
    effective_to,
    is_primary,
    status,
    created_at,
    updated_at,

    employees:employees!employee_position_assignments_employee_fkey (
      id,
      employee_code,
      first_name_th,
      last_name_th,
      first_name_en,
      last_name_en,
      employee_photo_url,
      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      status
    )
  )
`;

export const EMPLOYEE_POSITION_ASSIGNMENT_SELECT = `
  id,
  employee_id,
  position_slot_id,
  assignment_type,
  effective_from,
  effective_to,
  is_primary,
  status,
  created_at,
  updated_at,

  employees:employees!employee_position_assignments_employee_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    employee_photo_url,
    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,
    position_id,
    status
  ),

  org_position_slots:org_position_slots!employee_position_assignments_slot_fkey (
    id,
    slot_code,
    slot_name,

    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,

    position_id,
    parent_slot_id,

    slot_type,
    employment_capacity,
    sort_order,
    status,

    effective_from,
    effective_to,

    positions:positions!org_position_slots_position_fkey (
      id,
      position_code,
      position_name
    )
  )
`;

/* =========================================================
   Basic Helpers
========================================================= */

export function cleanSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ");
}

export function nullableId(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export function nullableText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizePositiveInteger(value, fallback = 1) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(Math.trunc(numberValue), 1);
}

function normalizeInteger(value, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.trunc(numberValue);
}

/* =========================================================
   Payload Normalizers
========================================================= */

export function normalizeOrgSlotPayload(body = {}) {
  return {
    slot_code: String(body?.slot_code || "")
      .trim()
      .toUpperCase(),

    slot_name: nullableText(body?.slot_name),

    company_id: nullableId(body?.company_id),
    branch_group_id: nullableId(body?.branch_group_id),
    branch_id: nullableId(body?.branch_id),
    department_id: nullableId(body?.department_id),
    division_id: nullableId(body?.division_id),
    unit_id: nullableId(body?.unit_id),

    position_id: nullableId(body?.position_id),
    parent_slot_id: nullableId(body?.parent_slot_id),

    slot_type:
      String(body?.slot_type || "normal").trim() ||
      "normal",

    employment_capacity: normalizePositiveInteger(
      body?.employment_capacity,
      1
    ),

    sort_order: normalizeInteger(
      body?.sort_order,
      0
    ),

    status:
      body?.status === "inactive"
        ? "inactive"
        : "active",

    effective_from:
      nullableText(body?.effective_from) ||
      todayISO(),

    effective_to:
      nullableText(body?.effective_to),
  };
}

export function normalizeEmployeePositionAssignmentPayload(
  body = {}
) {
  const assignmentType =
    String(body?.assignment_type || "primary")
      .trim()
      .toLowerCase() || "primary";

  const isPrimary =
    body?.is_primary === undefined ||
    body?.is_primary === null
      ? assignmentType === "primary"
      : Boolean(body.is_primary);

  return {
    employee_id: nullableId(body?.employee_id),
    position_slot_id: nullableId(
      body?.position_slot_id
    ),

    assignment_type: assignmentType,

    effective_from:
      nullableText(body?.effective_from) ||
      todayISO(),

    effective_to:
      nullableText(body?.effective_to),

    is_primary: isPrimary,

    status:
      body?.status === "inactive"
        ? "inactive"
        : "active",
  };
}

/* =========================================================
   Date Validation
========================================================= */

export function validateEffectiveDateRange(
  effectiveFrom,
  effectiveTo
) {
  if (
    effectiveTo &&
    effectiveFrom &&
    effectiveTo < effectiveFrom
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น";
  }

  return "";
}

export function dateRangesOverlap(
  startA,
  endA,
  startB,
  endB
) {
  const maxDate = "9999-12-31";

  const aStart = startA || "0001-01-01";
  const aEnd = endA || maxDate;

  const bStart = startB || "0001-01-01";
  const bEnd = endB || maxDate;

  return aStart <= bEnd && bStart <= aEnd;
}

/* =========================================================
   Loaders
========================================================= */

export async function getOrgSlotById(id) {
  const { data, error } = await supabaseAdmin
    .from("org_position_slots")
    .select(ORG_SLOT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function getEmployeeForStructure(
  employeeId
) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(`
      id,
      employee_code,
      first_name_th,
      last_name_th,
      first_name_en,
      last_name_en,
      employee_photo_url,
      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      status
    `)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Organization Lineage Validation

   Company
     -> Branch Group
       -> Branch
         -> Department
           -> Division
             -> Unit
========================================================= */

export async function validateOrgSlotLineage(
  payload,
  {
    currentSlotId = null,
  } = {}
) {
  if (!payload?.slot_code) {
    return "กรุณาระบุรหัส Slot";
  }

  if (!payload?.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload?.position_id) {
    return "กรุณาเลือกตำแหน่ง";
  }

  const dateError =
    validateEffectiveDateRange(
      payload.effective_from,
      payload.effective_to
    );

  if (dateError) {
    return dateError;
  }

  /* =========================
     Company
  ========================= */

  {
    const { data, error } =
      await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("id", payload.company_id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return "ไม่พบบริษัทที่เลือก";
    }
  }

  /* =========================
     Branch Group
  ========================= */

  if (payload.branch_group_id) {
    const { data, error } =
      await supabaseAdmin
        .from("branch_groups")
        .select("id")
        .eq(
          "id",
          payload.branch_group_id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return "ไม่พบกลุ่มสังกัดที่เลือก";
    }
  }

  /* =========================
     Branch
  ========================= */

  if (payload.branch_id) {
    const { data: branch, error } =
      await supabaseAdmin
        .from("branches")
        .select(`
          id,
          company_id,
          group_id
        `)
        .eq("id", payload.branch_id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!branch) {
      return "ไม่พบสังกัด/สาขาที่เลือก";
    }

    if (
      String(branch.company_id || "") !==
      String(payload.company_id || "")
    ) {
      return "สังกัด/สาขาไม่ได้อยู่ภายใต้บริษัทที่เลือก";
    }

    const branchGroupId =
      branch.group_id || null;

    if (
      String(branchGroupId || "") !==
      String(
        payload.branch_group_id || ""
      )
    ) {
      return "กลุ่มสังกัดไม่ตรงกับสังกัด/สาขาที่เลือก";
    }
  }

  /* =========================
     Department
  ========================= */

  if (payload.department_id) {
    if (!payload.branch_id) {
      return "กรุณาเลือกสังกัด/สาขาก่อนเลือกแผนก";
    }

    const {
      data: branchDepartment,
      error,
    } = await supabaseAdmin
      .from("branch_departments")
      .select("id")
      .eq(
        "branch_id",
        payload.branch_id
      )
      .eq(
        "department_id",
        payload.department_id
      )
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!branchDepartment) {
      return "แผนกไม่ได้อยู่ภายใต้สังกัด/สาขาที่เลือก";
    }
  }

  /* =========================
     Division
  ========================= */

  if (payload.division_id) {
    if (!payload.department_id) {
      return "กรุณาเลือกแผนกก่อนเลือกฝ่าย";
    }

    const { data: division, error } =
      await supabaseAdmin
        .from("divisions")
        .select(`
          id,
          department_id
        `)
        .eq(
          "id",
          payload.division_id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!division) {
      return "ไม่พบฝ่ายที่เลือก";
    }

    if (
      String(
        division.department_id || ""
      ) !==
      String(
        payload.department_id || ""
      )
    ) {
      return "ฝ่ายไม่ได้อยู่ภายใต้แผนกที่เลือก";
    }
  }

  /* =========================
     Unit
  ========================= */

  if (payload.unit_id) {
    if (!payload.division_id) {
      return "กรุณาเลือกฝ่ายก่อนเลือกหน่วย";
    }

    const { data: unit, error } =
      await supabaseAdmin
        .from("units")
        .select(`
          id,
          division_id
        `)
        .eq("id", payload.unit_id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!unit) {
      return "ไม่พบหน่วยที่เลือก";
    }

    if (
      String(unit.division_id || "") !==
      String(
        payload.division_id || ""
      )
    ) {
      return "หน่วยไม่ได้อยู่ภายใต้ฝ่ายที่เลือก";
    }
  }

  /* =========================
     Position
  ========================= */

  {
    const { data: position, error } =
      await supabaseAdmin
        .from("positions")
        .select("id")
        .eq(
          "id",
          payload.position_id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!position) {
      return "ไม่พบตำแหน่งที่เลือก";
    }
  }

  /* =========================
     Parent Slot
  ========================= */

  if (payload.parent_slot_id) {
    if (
      currentSlotId &&
      String(payload.parent_slot_id) ===
        String(currentSlotId)
    ) {
      return "ไม่สามารถกำหนด Slot เป็น Parent ของตัวเองได้";
    }

    const parent =
      await getOrgSlotById(
        payload.parent_slot_id
      );

    if (!parent) {
      return "ไม่พบ Parent Slot ที่เลือก";
    }

    if (
      !canParentContainChild(
        parent,
        payload
      )
    ) {
      return "Parent Slot ไม่ได้อยู่ในสายโครงสร้างเดียวกัน";
    }

    if (currentSlotId) {
      const cycleError =
        await validateNoSlotCycle(
          currentSlotId,
          payload.parent_slot_id
        );

      if (cycleError) {
        return cycleError;
      }
    }
  }

  return "";
}

/* =========================================================
   Parent / Child Validation
========================================================= */

export function canParentContainChild(
  parent,
  child
) {
  if (!parent || !child) {
    return false;
  }

  for (const field of ORG_SCOPE_FIELDS) {
    const parentValue =
      parent?.[field] || null;

    if (!parentValue) {
      continue;
    }

    if (
      String(parentValue) !==
      String(child?.[field] || "")
    ) {
      return false;
    }
  }

  return true;
}

export async function validateNoSlotCycle(
  slotId,
  parentSlotId
) {
  if (!slotId || !parentSlotId) {
    return "";
  }

  let currentId =
    String(parentSlotId);

  const visited =
    new Set();

  for (let depth = 0;depth < 100;depth += 1) {
    if (
      currentId === String(slotId)
    ) {
      return "ไม่สามารถกำหนด Parent Slot ได้ เนื่องจากจะทำให้โครงสร้างวนลูป";
    }

    if (visited.has(currentId)) {
      return "ตรวจพบโครงสร้าง Parent Slot วนลูป";
    }

    visited.add(currentId);

    const { data, error } =
      await supabaseAdmin
        .from("org_position_slots")
        .select(`
          id,
          parent_slot_id
        `)
        .eq("id", currentId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.parent_slot_id) {
      return "";
    }

    currentId =
      String(data.parent_slot_id);
  }

  return "โครงสร้าง Parent Slot ลึกเกินกว่าที่ระบบรองรับ";
}

export async function validateChildCompatibility(
  slotId,
  nextParentPayload
) {
  const { data, error } =
    await supabaseAdmin
      .from("org_position_slots")
      .select(`
        id,
        slot_code,
        company_id,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id
      `)
      .eq(
        "parent_slot_id",
        slotId
      );

  if (error) {
    throw error;
  }

  for (const child of data || []) {
    if (
      !canParentContainChild(
        nextParentPayload,
        child
      )
    ) {
      return `ไม่สามารถเปลี่ยนสายโครงสร้างได้ เนื่องจากมี Child Slot ${child.slot_code || child.id} อยู่คนละสาย`;
    }
  }

  return "";
}

/* =========================================================
   Ancestors / Tree
========================================================= */

export async function loadOrgSlotAncestors(
  visibleRows = []
) {
  const rowMap =
    new Map(
      (visibleRows || []).map(
        (row) => [
          String(row.id),
          row,
        ]
      )
    );

  for (
    let depth = 0;
    depth < 100;
    depth += 1
  ) {
    const pendingParentIds =
      [
        ...new Set(
          [...rowMap.values()]
            .map(
              (row) =>
                row.parent_slot_id
            )
            .filter(Boolean)
            .map(String)
            .filter(
              (id) =>
                !rowMap.has(id)
            )
        ),
      ];

    if (!pendingParentIds.length) {
      break;
    }

    const { data, error } =
      await supabaseAdmin
        .from("org_position_slots")
        .select(ORG_SLOT_SELECT)
        .in(
          "id",
          pendingParentIds
        );

    if (error) {
      throw error;
    }

    if (!data?.length) {
      break;
    }

    let added = 0;

    for (const parent of data) {
      const children =
        [...rowMap.values()].filter(
          (row) =>
            String(
              row.parent_slot_id || ""
            ) ===
            String(parent.id)
        );

      const isValidAncestor =
        children.some(
          (child) =>
            canParentContainChild(
              parent,
              child
            )
        );

      if (!isValidAncestor) {
        continue;
      }

      rowMap.set(
        String(parent.id),
        parent
      );

      added += 1;
    }

    if (!added) {
      break;
    }
  }

  return [...rowMap.values()];
}

function sortTreeNodes(nodes = []) {
  nodes.sort((a, b) => {
    const sortA =
      Number(a?.sort_order || 0);

    const sortB =
      Number(b?.sort_order || 0);

    if (sortA !== sortB) {
      return sortA - sortB;
    }

    return String(
      a?.slot_code || ""
    ).localeCompare(
      String(
        b?.slot_code || ""
      )
    );
  });

  for (const node of nodes) {
    sortTreeNodes(
      node.children || []
    );
  }

  return nodes;
}

export function buildOrgSlotTree(
  rows = []
) {
  const nodes =
    new Map();

  for (const row of rows) {
    nodes.set(
      String(row.id),
      {
        ...row,
        children: [],
      }
    );
  }

  const roots = [];

  for (const node of nodes.values()) {
    const parentId =
      node.parent_slot_id
        ? String(
            node.parent_slot_id
          )
        : "";

    const parent =
      parentId
        ? nodes.get(parentId)
        : null;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortTreeNodes(roots);
}

/* =========================================================
   Employee <-> Slot Validation
========================================================= */

export function validateEmployeeMatchesSlot(
  employee,
  slot
) {
  if (!employee) {
    return "ไม่พบพนักงานที่เลือก";
  }

  if (!slot) {
    return "ไม่พบ Position Slot ที่เลือก";
  }

  const fields = [
    [
      "company_id",
      "บริษัท",
    ],
    [
      "branch_group_id",
      "กลุ่มสังกัด",
    ],
    [
      "branch_id",
      "สังกัด/สาขา",
    ],
    [
      "department_id",
      "แผนก",
    ],
    [
      "division_id",
      "ฝ่าย",
    ],
    [
      "unit_id",
      "หน่วย",
    ],
    [
      "position_id",
      "ตำแหน่ง",
    ],
  ];

  for (const [field, label] of fields) {
    const slotValue =
      slot?.[field] || null;

    if (!slotValue) {
      continue;
    }

    const employeeValue =
      employee?.[field] || null;

    if (
      String(slotValue) !==
      String(employeeValue || "")
    ) {
      return `ข้อมูล${label}ของพนักงานไม่ตรงกับ Position Slot`;
    }
  }

  return "";
}

/* =========================================================
   Primary Assignment Conflict / Capacity
========================================================= */

export async function validatePrimaryAssignmentConflicts({
  assignmentId = null,
  employeeId,
  slot,
  effectiveFrom,
  effectiveTo,
  isPrimary,
  status,
}) {
  if (
    !isPrimary ||
    status !== "active"
  ) {
    return "";
  }

  const { data, error } =
    await supabaseAdmin
      .from(
        "employee_position_assignments"
      )
      .select(`
        id,
        employee_id,
        position_slot_id,
        effective_from,
        effective_to,
        is_primary,
        status
      `)
      .eq("status", "active")
      .eq("is_primary", true)
      .or(
        [
          `employee_id.eq.${employeeId}`,
          `position_slot_id.eq.${slot.id}`,
        ].join(",")
      );

  if (error) {
    throw error;
  }

  const overlapping =
    (data || []).filter(
      (row) => {
        if (
          assignmentId &&
          String(row.id) ===
            String(assignmentId)
        ) {
          return false;
        }

        return dateRangesOverlap(
          row.effective_from,
          row.effective_to,
          effectiveFrom,
          effectiveTo
        );
      }
    );

  const employeeConflict =
    overlapping.find(
      (row) =>
        String(row.employee_id) ===
        String(employeeId)
    );

  if (employeeConflict) {
    return "พนักงานมี Primary Position Assignment ที่ช่วงวันที่ทับซ้อนกันอยู่แล้ว";
  }

  const occupiedCount =
    overlapping.filter(
      (row) =>
        String(
          row.position_slot_id
        ) ===
        String(slot.id)
    ).length;

  const capacity =
    Math.max(
      Number(
        slot.employment_capacity ||
          1
      ),
      1
    );

  if (occupiedCount >= capacity) {
    return `Position Slot นี้เต็มตาม Capacity แล้ว (${capacity})`;
  }

  return "";
}

export async function countCurrentPrimaryAssignments(
  positionSlotId
) {
  const today =
    todayISO();

  const { data, error } =
    await supabaseAdmin
      .from(
        "employee_position_assignments"
      )
      .select(`
        id,
        effective_from,
        effective_to,
        status,
        is_primary
      `)
      .eq(
        "position_slot_id",
        positionSlotId
      )
      .eq("status", "active")
      .eq("is_primary", true);

  if (error) {
    throw error;
  }

  return (data || []).filter(
    (row) =>
      dateRangesOverlap(
        row.effective_from,
        row.effective_to,
        today,
        today
      )
  ).length;
}

/* =========================================================
   DB Error Mapper
========================================================= */

export function mapOrgDbError(
  error,
  {
    duplicateMessage =
      "ข้อมูลซ้ำในระบบ",
  } = {}
) {
  if (error?.code === "23505") {
    return {
      status: 409,
      message: duplicateMessage,
    };
  }

  if (error?.code === "23503") {
    return {
      status: 409,
      message:
        "ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลถูกอ้างอิงโดยข้อมูลอื่น",
    };
  }

  return {
    status: 500,
    message:
      error?.message ||
      "เกิดข้อผิดพลาดภายในระบบ",
  };
}
