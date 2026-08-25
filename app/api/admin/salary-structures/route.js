import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_BATCH_SIZE = 1000;

function cleanText(value) {
  return String(value ?? "").trim();
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function errorResponse(message, status = 500, extra = {}) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    { status }
  );
}

async function findDuplicateName(name) {
  const { data, error } = await supabaseAdmin
    .from("salary_structures")
    .select("id,name")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function loadAllSalaryStructures({ search = "" } = {}) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabaseAdmin
      .from("salary_structures")
      .select("id,name,created_at")
      .order("name", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, from + ALL_BATCH_SIZE - 1);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < ALL_BATCH_SIZE) {
      break;
    }

    from += ALL_BATCH_SIZE;
  }

  return rows;
}

/* =========================================================
   GET /api/admin/salary-structures

   Query:
   - search
   - page
   - pageSize
   - all=true
========================================================= */
export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.salary_structures",
      "view"
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } = new URL(req.url);

    const search = cleanText(searchParams.get("search"));
    const all = searchParams.get("all") === "true";

    if (all) {
      const data = await loadAllSalaryStructures({ search });

      return NextResponse.json({
        success: true,
        data,
        total: data.length,
        pagination: {
          page: 1,
          pageSize: data.length,
          total: data.length,
          totalPages: data.length > 0 ? 1 : 0,
          hasMore: false,
        },
      });
    }

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const requestedPageSize = parsePositiveInt(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE
    );
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let countQuery = supabaseAdmin
      .from("salary_structures")
      .select("id", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.ilike("name", `%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    const total = Number(count || 0);
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    // สำคัญ: ไม่ยิง .range() ถ้าหน้าเกินข้อมูลจริง
    // ป้องกัน PostgREST 416 Requested range not satisfiable
    if (total === 0 || from >= total) {
      return NextResponse.json({
        success: true,
        data: [],
        total,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasMore: false,
        },
      });
    }

    let query = supabaseAdmin
      .from("salary_structures")
      .select("id,name,created_at")
      .order("name", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/salary-structures error:", error);

    return errorResponse(
      "ไม่สามารถโหลดข้อมูลโครงสร้างเงินเดือนได้",
      500
    );
  }
}

/* =========================================================
   POST /api/admin/salary-structures

   Current table schema:
   - id
   - name
   - created_at
========================================================= */
export async function POST(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.salary_structures",
      "create"
    );

    if (!guard.ok) {
      return guard.response;
    }

    const body = await req.json();
    const name = cleanText(body?.name);

    if (!name) {
      return errorResponse("กรุณาระบุชื่อโครงสร้างเงินเดือน", 400);
    }

    if (name.length > 255) {
      return errorResponse(
        "ชื่อโครงสร้างเงินเดือนต้องไม่เกิน 255 ตัวอักษร",
        400
      );
    }

    const duplicate = await findDuplicateName(name);

    if (duplicate) {
      return errorResponse(
        "ชื่อโครงสร้างเงินเดือนนี้มีอยู่แล้ว",
        409,
        {
          duplicate: {
            id: duplicate.id,
            name: duplicate.name,
          },
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("salary_structures")
      .insert({ name })
      .select("id,name,created_at")
      .single();

    if (error) {
      // PostgreSQL unique violation เผื่อภายหลังมี unique index
      if (error.code === "23505") {
        return errorResponse(
          "ชื่อโครงสร้างเงินเดือนนี้มีอยู่แล้ว",
          409
        );
      }

      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มโครงสร้างเงินเดือนเรียบร้อยแล้ว",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/salary-structures error:", error);

    return errorResponse(
      "ไม่สามารถเพิ่มโครงสร้างเงินเดือนได้",
      500
    );
  }
}
