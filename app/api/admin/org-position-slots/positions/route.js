import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   GET /api/admin/org-position-slots/positions

   Lazy Load Position สำหรับ Form ของ Org Position Slot เท่านั้น

   Query:
   - search
   - page
   - pageSize

   ไม่แก้ Logic ของ /api/admin/org-position-slots เดิม
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
      String(
        searchParams.get(
          "search"
        ) || ""
      ).trim();

    const page = Math.max(
      Number(
        searchParams.get(
          "page"
        ) || 1
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
      100
    );

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    let query =
      supabaseAdmin
        .from("positions")
        .select(
          `
            id,
            position_code,
            position_name,
            sort_order,
            status
          `,
          {
            count: "exact",
          }
        )
        .eq(
          "status",
          "active"
        );

    if (search) {
      query = query.or(
        [
          `position_code.ilike.%${search}%`,
          `position_name.ilike.%${search}%`,
        ].join(",")
      );
    }

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("position_code", {
        ascending: true,
      })
      .range(from, to);

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }

    const total =
      Number(count || 0);

    const totalPages =
      Math.max(
        Math.ceil(
          total / pageSize
        ),
        1
      );

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET_ORG_SLOT_POSITIONS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}
