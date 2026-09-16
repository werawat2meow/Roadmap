import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function cleanSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/[%*]/g, "")
    .trim();
}

function positiveInteger(value, fallback, max = null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.max(Math.trunc(parsed), 1);
  return max ? Math.min(normalized, max) : normalized;
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_organization",
      "view",
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } = new URL(req.url);
    const search = cleanSearch(searchParams.get("search"));
    const page = positiveInteger(searchParams.get("page"), 1);
    const pageSize = positiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("positions")
      .select(
        `
          id,
          position_code,
          position_name,
          status,
          sort_order,
          position_family_id
        `,
        { count: "exact" }
      )
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("position_code", { ascending: true });

    if (search) {
      query = query.or(
        [
          `position_code.ilike.%${search}%`,
          `position_name.ilike.%${search}%`,
        ].join(",")
      );
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const rows = data || [];

    const total = Number(count || 0);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/employee-organization/positions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถโหลดตำแหน่งได้",
        details: {
          code: error?.code || null,
          message: error?.message || null,
          details: error?.details || null,
          hint: error?.hint || null,
        },
      },
      { status: 500 }
    );
  }
}
