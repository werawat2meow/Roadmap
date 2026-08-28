import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const MAX_SLOTS = 20000;
const MAX_ASSIGNMENTS = 30000;
const CHUNK_SIZE = 200;

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function firstValue(
  object,
  keys,
  fallback = null
) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function asNumber(
  value,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function unique(values = []) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map(String)
    ),
  ];
}

function chunks(
  values,
  size = CHUNK_SIZE
) {
  const result = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    result.push(
      values.slice(
        index,
        index + size
      )
    );
  }

  return result;
}

function isActiveRecord(record) {
  const status = cleanText(
    record?.status
  ).toLowerCase();

  return (
    !status ||
    status === "active"
  );
}

function isCurrentAssignment(
  assignment,
  today
) {
  if (!isActiveRecord(assignment)) {
    return false;
  }

  if (
    assignment?.is_primary !==
      undefined &&
    assignment?.is_primary !==
      null &&
    assignment.is_primary !== true
  ) {
    return false;
  }

  const from =
    cleanNullableText(
      firstValue(
        assignment,
        [
          "effective_from",
          "start_date",
          "assigned_from",
        ]
      )
    );

  const to =
    cleanNullableText(
      firstValue(
        assignment,
        [
          "effective_to",
          "end_date",
          "assigned_to",
        ]
      )
    );

  if (
    from &&
    from > today
  ) {
    return false;
  }

  if (
    to &&
    to < today
  ) {
    return false;
  }

  return true;
}

function getAssignmentSlotId(
  assignment
) {
  return cleanNullableText(
    firstValue(
      assignment,
      [
        "org_position_slot_id",
        "position_slot_id",
        "slot_id",
      ]
    )
  );
}

function getAssignmentEmployeeId(
  assignment
) {
  return cleanNullableText(
    firstValue(
      assignment,
      [
        "employee_id",
        "assigned_employee_id",
      ]
    )
  );
}

function getSlotParentId(
  slot
) {
  return cleanNullableText(
    firstValue(
      slot,
      [
        "parent_slot_id",
        "reports_to_slot_id",
        "supervisor_slot_id",
        "parent_id",
      ]
    )
  );
}

function getSlotCode(
  slot
) {
  return cleanText(
    firstValue(
      slot,
      [
        "slot_code",
        "position_slot_code",
        "code",
      ],
      ""
    )
  );
}

function getSlotName(
  slot,
  position
) {
  return (
    cleanText(
      firstValue(
        slot,
        [
          "slot_name",
          "position_slot_name",
          "name",
        ],
        ""
      )
    ) ||
    cleanText(
      position?.position_name
    ) ||
    getSlotCode(slot) ||
    "Position Slot"
  );
}

function getCapacity(
  slot
) {
  return Math.max(
    1,
    asNumber(
      firstValue(
        slot,
        [
          "employment_capacity",
          "headcount_capacity",
          "capacity",
          "headcount_target",
        ],
        1
      ),
      1
    )
  );
}

function canSeeSlot(
  guard,
  slot
) {
  if (guard.hasAllScope) {
    return true;
  }

  if (
    typeof guard.canAccessEmployee !==
    "function"
  ) {
    return false;
  }

  return Boolean(
    guard.canAccessEmployee(
      slot
    )
  );
}

function fullName(employee) {
  if (!employee) {
    return "-";
  }

  const th = [
    employee.first_name_th,
    employee.middle_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (th) {
    return th;
  }

  const en = [
    employee.first_name_en,
    employee.middle_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    en ||
    employee.employee_code ||
    "-"
  );
}

function mapById(rows = []) {
  return new Map(
    rows
      .filter(
        (item) =>
          item?.id
      )
      .map(
        (item) => [
          String(item.id),
          item,
        ]
      )
  );
}

async function loadByIds(
  table,
  ids,
  select = "*"
) {
  const uniqueIds =
    unique(ids);

  if (!uniqueIds.length) {
    return [];
  }

  const result = [];

  for (
    const group of
      chunks(uniqueIds)
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(table)
        .select(select)
        .in("id", group);

    if (error) {
      throw error;
    }

    result.push(
      ...(data || [])
    );
  }

  return result;
}

function compareNodes(
  a,
  b
) {
  const sortA =
    asNumber(
      a.sort_order,
      0
    );

  const sortB =
    asNumber(
      b.sort_order,
      0
    );

  if (sortA !== sortB) {
    return sortA - sortB;
  }

  return String(
    a.slot_code || ""
  ).localeCompare(
    String(
      b.slot_code || ""
    ),
    "th"
  );
}

function includeMatchesAndAncestors(
  nodes,
  search
) {
  const keyword =
    cleanText(search)
      .toLowerCase();

  if (!keyword) {
    return nodes;
  }

  const byId =
    new Map(
      nodes.map(
        (node) => [
          String(node.id),
          node,
        ]
      )
    );

  const includeIds =
    new Set();

  for (
    const node of
      nodes
  ) {
    const haystack = [
      node.slot_code,
      node.slot_name,
      node.position_code,
      node.position_name,
      node.position_level_code,
      node.company_code,
      node.company_name,
      node.branch_group_code,
      node.branch_group_name,
      node.branch_code,
      node.branch_name,
      node.department_code,
      node.department_name,
      node.division_code,
      node.division_name,
      node.unit_code,
      node.unit_name,
      ...(node.occupants || [])
        .flatMap(
          (item) => [
            item.employee_code,
            item.full_name,
          ]
        ),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      !haystack.includes(
        keyword
      )
    ) {
      continue;
    }

    let current =
      node;

    const visited =
      new Set();

    while (
      current &&
      !visited.has(
        String(current.id)
      )
    ) {
      visited.add(
        String(current.id)
      );

      includeIds.add(
        String(current.id)
      );

      if (
        !current.parent_id
      ) {
        break;
      }

      current =
        byId.get(
          String(
            current.parent_id
          )
        );
    }
  }

  return nodes.filter(
    (node) =>
      includeIds.has(
        String(node.id)
      )
  );
}

/* =========================================================
   GET /api/admin/org-chart
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.org_chart",
        "view",
        {
          lineageScope: true,
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      );

    const companyId =
      cleanNullableText(
        searchParams.get(
          "company_id"
        )
      );

    const branchGroupId =
      cleanNullableText(
        searchParams.get(
          "branch_group_id"
        )
      );

    const branchId =
      cleanNullableText(
        searchParams.get(
          "branch_id"
        )
      );

    const departmentId =
      cleanNullableText(
        searchParams.get(
          "department_id"
        )
      );

    const divisionId =
      cleanNullableText(
        searchParams.get(
          "division_id"
        )
      );

    const unitId =
      cleanNullableText(
        searchParams.get(
          "unit_id"
        )
      );

    const occupancy =
      cleanText(
        searchParams.get(
          "occupancy"
        )
      ).toLowerCase();

    const showInactive =
      searchParams.get(
        "show_inactive"
      ) === "true";

    /* =======================================================
       1. Load Position Slots
    ======================================================= */

    const {
      data:
        slotRows,
      error:
        slotError,
    } =
      await supabaseAdmin
        .from(
          "org_position_slots"
        )
        .select("*")
        .limit(MAX_SLOTS);

    if (slotError) {
      throw slotError;
    }

    let slots =
      (slotRows || [])
        .filter(
          (slot) =>
            showInactive ||
            isActiveRecord(slot)
        )
        .filter(
          (slot) =>
            canSeeSlot(
              guard,
              slot
            )
        );

    if (companyId) {
      slots =
        slots.filter(
          (slot) =>
            String(
              slot.company_id ||
              ""
            ) ===
            String(companyId)
        );
    }

    if (branchGroupId) {
      slots =
        slots.filter(
          (slot) =>
            String(
              slot.branch_group_id ||
              ""
            ) ===
            String(
              branchGroupId
            )
        );
    }

    if (branchId) {
      slots =
        slots.filter(
          (slot) =>
            String(
              slot.branch_id ||
              ""
            ) ===
            String(branchId)
        );
    }

    if (departmentId) {
      slots =
        slots.filter(
          (slot) =>
            String(
              slot.department_id ||
              ""
            ) ===
            String(
              departmentId
            )
        );
    }

    if (divisionId) {
      slots =
        slots.filter(
          (slot) =>
            String(
              slot.division_id ||
              ""
            ) ===
            String(divisionId)
        );
    }

    if (unitId) {
      slots =
        slots.filter(
          (slot) =>
            String(
              slot.unit_id ||
              ""
            ) ===
            String(unitId)
        );
    }

    const slotIds =
      new Set(
        slots.map(
          (slot) =>
            String(slot.id)
        )
      );

    /* =======================================================
       2. Current Employee Position Assignments
    ======================================================= */

    const {
      data:
        assignmentRows,
      error:
        assignmentError,
    } =
      await supabaseAdmin
        .from(
          "employee_position_assignments"
        )
        .select("*")
        .limit(
          MAX_ASSIGNMENTS
        );

    if (assignmentError) {
      throw assignmentError;
    }

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const currentAssignments =
      (assignmentRows || [])
        .filter(
          (assignment) =>
            isCurrentAssignment(
              assignment,
              today
            )
        )
        .filter(
          (assignment) => {
            const slotId =
              getAssignmentSlotId(
                assignment
              );

            return (
              slotId &&
              slotIds.has(
                String(slotId)
              )
            );
          }
        );

    const employeeIds =
      unique(
        currentAssignments.map(
          getAssignmentEmployeeId
        )
      );

    /* =======================================================
       3. Employees
    ======================================================= */

    const employees =
      await loadByIds(
        "employees",
        employeeIds,
        `
          id,
          employee_code,
          first_name_th,
          middle_name_th,
          last_name_th,
          first_name_en,
          middle_name_en,
          last_name_en,
          employee_photo_url,
          employee_photo_path,
          supervisor_employee_id,
          company_id,
          branch_group_id,
          branch_id,
          department_id,
          division_id,
          unit_id,
          position_id,
          position_level_id,
          status
        `
      );

    const employeeById =
      mapById(employees);

    /* =======================================================
       4. Master Data
    ======================================================= */

    const positionIds =
      unique([
        ...slots.map(
          (slot) =>
            slot.position_id
        ),
        ...employees.map(
          (employee) =>
            employee.position_id
        ),
      ]);

    const positionLevelIds =
      unique([
        ...slots.map(
          (slot) =>
            slot.position_level_id
        ),
        ...employees.map(
          (employee) =>
            employee.position_level_id
        ),
      ]);

    const [
      positions,
      positionLevels,
      companies,
      branchGroups,
      branches,
      departments,
      divisions,
      units,
    ] =
      await Promise.all([
        loadByIds(
          "positions",
          positionIds,
          "id,position_code,position_name,position_family_id,status,sort_order"
        ),

        loadByIds(
          "position_levels",
          positionLevelIds,
          "id,level_code,level_name,sort_order,status"
        ),

        loadByIds(
          "companies",
          slots.map(
            (slot) =>
              slot.company_id
          ),
          "id,company_code,company_name_th,company_name_en,status,sort_order"
        ),

        loadByIds(
          "branch_groups",
          slots.map(
            (slot) =>
              slot.branch_group_id
          ),
          "id,group_code,group_name,status,sort_order"
        ),

        loadByIds(
          "branches",
          slots.map(
            (slot) =>
              slot.branch_id
          ),
          "id,branch_code,branch_name,company_id,status,sort_order"
        ),

        loadByIds(
          "departments",
          slots.map(
            (slot) =>
              slot.department_id
          ),
          "id,department_code,department_name,status,sort_order"
        ),

        loadByIds(
          "divisions",
          slots.map(
            (slot) =>
              slot.division_id
          ),
          "id,division_code,division_name,department_id,status,sort_order"
        ),

        loadByIds(
          "units",
          slots.map(
            (slot) =>
              slot.unit_id
          ),
          "id,unit_code,unit_name,division_id,status,sort_order"
        ),
      ]);

    const positionById =
      mapById(positions);

    const levelById =
      mapById(
        positionLevels
      );

    const companyById =
      mapById(companies);

    const groupById =
      mapById(branchGroups);

    const branchById =
      mapById(branches);

    const departmentById =
      mapById(departments);

    const divisionById =
      mapById(divisions);

    const unitById =
      mapById(units);

    /* =======================================================
       5. Assignments by Slot
    ======================================================= */

    const assignmentsBySlot =
      new Map();

    for (
      const assignment of
        currentAssignments
    ) {
      const slotId =
        String(
          getAssignmentSlotId(
            assignment
          )
        );

      if (
        !assignmentsBySlot.has(
          slotId
        )
      ) {
        assignmentsBySlot.set(
          slotId,
          []
        );
      }

      assignmentsBySlot
        .get(slotId)
        .push(assignment);
    }

    /* =======================================================
       6. Create Enriched Nodes
    ======================================================= */

    let nodes =
      slots.map(
        (slot) => {
          const position =
            positionById.get(
              String(
                slot.position_id ||
                ""
              )
            ) ||
            null;

          const assignments =
            assignmentsBySlot.get(
              String(slot.id)
            ) ||
            [];

          const occupants =
            assignments
              .map(
                (assignment) => {
                  const employee =
                    employeeById.get(
                      String(
                        getAssignmentEmployeeId(
                          assignment
                        ) ||
                        ""
                      )
                    );

                  if (!employee) {
                    return null;
                  }

                  return {
                    assignment_id:
                      assignment.id,

                    employee_id:
                      employee.id,

                    employee_code:
                      employee.employee_code,

                    full_name:
                      fullName(
                        employee
                      ),

                    employee_photo_url:
                      employee.employee_photo_url ||
                      null,

                    supervisor_employee_id:
                      employee.supervisor_employee_id ||
                      null,

                    position_id:
                      employee.position_id ||
                      null,

                    position_level_id:
                      employee.position_level_id ||
                      null,
                  };
                }
              )
              .filter(Boolean);

          const capacity =
            getCapacity(slot);

          const filled =
            occupants.length;

          const vacant =
            Math.max(
              0,
              capacity -
              filled
            );

          const company =
            companyById.get(
              String(
                slot.company_id ||
                ""
              )
            );

          const branchGroup =
            groupById.get(
              String(
                slot.branch_group_id ||
                ""
              )
            );

          const branch =
            branchById.get(
              String(
                slot.branch_id ||
                ""
              )
            );

          const department =
            departmentById.get(
              String(
                slot.department_id ||
                ""
              )
            );

          const division =
            divisionById.get(
              String(
                slot.division_id ||
                ""
              )
            );

          const unit =
            unitById.get(
              String(
                slot.unit_id ||
                ""
              )
            );

          const level =
            levelById.get(
              String(
                slot.position_level_id ||
                occupants[0]
                  ?.position_level_id ||
                ""
              )
            );

          return {
            id:
              slot.id,

            parent_id:
              getSlotParentId(
                slot
              ),

            slot_code:
              getSlotCode(
                slot
              ),

            slot_name:
              getSlotName(
                slot,
                position
              ),

            position_id:
              slot.position_id ||
              null,

            position_code:
              position
                ?.position_code ||
              "",

            position_name:
              position
                ?.position_name ||
              "",

            position_level_id:
              level?.id ||
              slot.position_level_id ||
              null,

            position_level_code:
              level?.level_code ||
              "",

            position_level_name:
              level?.level_name ||
              "",

            company_id:
              slot.company_id ||
              null,

            company_code:
              company
                ?.company_code ||
              "",

            company_name:
              company
                ?.company_name_th ||
              company
                ?.company_name_en ||
              "",

            branch_group_id:
              slot.branch_group_id ||
              null,

            branch_group_code:
              branchGroup
                ?.group_code ||
              "",

            branch_group_name:
              branchGroup
                ?.group_name ||
              "",

            branch_id:
              slot.branch_id ||
              null,

            branch_code:
              branch
                ?.branch_code ||
              "",

            branch_name:
              branch
                ?.branch_name ||
              "",

            department_id:
              slot.department_id ||
              null,

            department_code:
              department
                ?.department_code ||
              "",

            department_name:
              department
                ?.department_name ||
              "",

            division_id:
              slot.division_id ||
              null,

            division_code:
              division
                ?.division_code ||
              "",

            division_name:
              division
                ?.division_name ||
              "",

            unit_id:
              slot.unit_id ||
              null,

            unit_code:
              unit
                ?.unit_code ||
              "",

            unit_name:
              unit
                ?.unit_name ||
              "",

            capacity,
            filled,
            vacant,

            occupants,

            status:
              slot.status ||
              "active",

            sort_order:
              asNumber(
                firstValue(
                  slot,
                  [
                    "sort_order",
                    "sequence_no",
                  ],
                  0
                ),
                0
              ),
          };
        }
      );

    /* =======================================================
       7. Fallback Parent:
          occupant.supervisor_employee_id -> supervisor's slot
    ======================================================= */

    const slotIdByEmployeeId =
      new Map();

    for (
      const node of
        nodes
    ) {
      for (
        const occupant of
          node.occupants
      ) {
        slotIdByEmployeeId.set(
          String(
            occupant.employee_id
          ),
          String(node.id)
        );
      }
    }

    const visibleNodeIds =
      new Set(
        nodes.map(
          (node) =>
            String(node.id)
        )
      );

    nodes =
      nodes.map(
        (node) => {
          if (
            node.parent_id &&
            visibleNodeIds.has(
              String(
                node.parent_id
              )
            ) &&
            String(
              node.parent_id
            ) !==
              String(node.id)
          ) {
            return node;
          }

          for (
            const occupant of
              node.occupants
          ) {
            const supervisorId =
              occupant
                .supervisor_employee_id;

            if (!supervisorId) {
              continue;
            }

            const supervisorSlotId =
              slotIdByEmployeeId.get(
                String(
                  supervisorId
                )
              );

            if (
              supervisorSlotId &&
              supervisorSlotId !==
                String(node.id)
            ) {
              return {
                ...node,

                parent_id:
                  supervisorSlotId,
              };
            }
          }

          return {
            ...node,
            parent_id: null,
          };
        }
      );

    /* =======================================================
       8. Occupancy Filter
    ======================================================= */

    if (
      occupancy === "filled"
    ) {
      nodes =
        nodes.filter(
          (node) =>
            node.filled > 0
        );
    } else if (
      occupancy === "vacant"
    ) {
      nodes =
        nodes.filter(
          (node) =>
            node.vacant > 0
        );
    }

    /*
     * ถ้ากรอง occupancy แล้ว parent ถูกตัดออก
     * ให้ node กลายเป็น root แทน เพื่อไม่สร้าง dangling relation
     */
    const occupancyNodeIds =
      new Set(
        nodes.map(
          (node) =>
            String(node.id)
        )
      );

    nodes =
      nodes.map(
        (node) => ({
          ...node,

          parent_id:
            node.parent_id &&
            occupancyNodeIds.has(
              String(
                node.parent_id
              )
            )
              ? node.parent_id
              : null,
        })
      );

    /* =======================================================
       9. Text Search + Ancestors
    ======================================================= */

    nodes =
      includeMatchesAndAncestors(
        nodes,
        search
      );

    nodes.sort(
      compareNodes
    );

    /* =======================================================
       10. Summary
    ======================================================= */

    const totalCapacity =
      nodes.reduce(
        (
          sum,
          node
        ) =>
          sum +
          node.capacity,
        0
      );

    const totalFilled =
      nodes.reduce(
        (
          sum,
          node
        ) =>
          sum +
          node.filled,
        0
      );

    const totalVacant =
      nodes.reduce(
        (
          sum,
          node
        ) =>
          sum +
          node.vacant,
        0
      );

    const nodeIds =
      new Set(
        nodes.map(
          (node) =>
            String(node.id)
        )
      );

    const rootCount =
      nodes.filter(
        (node) =>
          !node.parent_id ||
          !nodeIds.has(
            String(
              node.parent_id
            )
          )
      ).length;

    return NextResponse.json({
      success: true,

      data: nodes,

      summary: {
        total_slots:
          nodes.length,

        total_capacity:
          totalCapacity,

        filled:
          totalFilled,

        vacant:
          totalVacant,

        occupied_slots:
          nodes.filter(
            (node) =>
              node.filled > 0
          ).length,

        vacant_slots:
          nodes.filter(
            (node) =>
              node.vacant > 0
          ).length,

        roots:
          rootCount,
      },

      meta: {
        scope:
          "organization_lineage",

        has_all_scope:
          Boolean(
            guard.hasAllScope
          ),

        parent_strategy:
          "slot_parent_then_employee_supervisor",

        max_slots:
          MAX_SLOTS,
      },
    });
  } catch (error) {
    console.error(
      "GET_ORG_CHART_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดผังโครงสร้างองค์กรได้",
      },
      {
        status: 500,
      }
    );
  }
}
