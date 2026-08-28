import { NextResponse } from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const MAX_SLOTS = 20000;
const CHUNK_SIZE = 200;

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

function isActive(
  row
) {
  const status =
    String(
      row?.status || ""
    )
      .trim()
      .toLowerCase();

  return (
    !status ||
    status === "active"
  );
}

async function loadByIds(
  table,
  ids,
  select
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

function sortBy(
  rows,
  codeKey
) {
  return [
    ...(rows || []),
  ].sort(
    (a, b) =>
      String(
        a?.[codeKey] || ""
      ).localeCompare(
        String(
          b?.[codeKey] || ""
        ),
        "th"
      )
  );
}

export async function GET() {
  try {
    const guard =
      await requireScopedAccess(
        "ems.org_chart",
        "view",
        {
          lineageScope:
            true,
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

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
        .limit(
          MAX_SLOTS
        );

    if (slotError) {
      throw slotError;
    }

    const slots =
      (slotRows || [])
        .filter(
          isActive
        )
        .filter(
          (slot) =>
            canSeeSlot(
              guard,
              slot
            )
        );

    const [
      companies,
      branchGroups,
      branches,
      departments,
      divisions,
      units,
    ] =
      await Promise.all([
        loadByIds(
          "companies",
          slots.map(
            (item) =>
              item.company_id
          ),
          "id,company_code,company_name_th,company_name_en,status,sort_order"
        ),

        loadByIds(
          "branch_groups",
          slots.map(
            (item) =>
              item.branch_group_id
          ),
          "id,group_code,group_name,status,sort_order"
        ),

        loadByIds(
          "branches",
          slots.map(
            (item) =>
              item.branch_id
          ),
          "id,company_id,branch_code,branch_name,status,sort_order"
        ),

        loadByIds(
          "departments",
          slots.map(
            (item) =>
              item.department_id
          ),
          "id,department_code,department_name,status,sort_order"
        ),

        loadByIds(
          "divisions",
          slots.map(
            (item) =>
              item.division_id
          ),
          "id,department_id,division_code,division_name,status,sort_order"
        ),

        loadByIds(
          "units",
          slots.map(
            (item) =>
              item.unit_id
          ),
          "id,division_id,unit_code,unit_name,status,sort_order"
        ),
      ]);

    return NextResponse.json({
      success: true,

      data: {
        companies:
          sortBy(
            companies,
            "company_code"
          ),

        branch_groups:
          sortBy(
            branchGroups,
            "group_code"
          ),

        branches:
          sortBy(
            branches,
            "branch_code"
          ),

        departments:
          sortBy(
            departments,
            "department_code"
          ),

        divisions:
          sortBy(
            divisions,
            "division_code"
          ),

        units:
          sortBy(
            units,
            "unit_code"
          ),
      },

      meta: {
        has_all_scope:
          Boolean(
            guard.hasAllScope
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET_ORG_CHART_OPTIONS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดตัวเลือกผังองค์กรได้",
      },
      {
        status: 500,
      }
    );
  }
}
