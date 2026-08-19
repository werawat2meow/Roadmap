import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_BATCH_SIZE = 1000;

function parsePositiveInteger(
  value,
  fallback,
  max = Number.MAX_SAFE_INTEGER
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 1
  ) {
    return fallback;
  }

  return Math.min(
    Math.floor(number),
    max
  );
}

function sanitizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ")
    .slice(0, 200);
}

function applyFilters(
  query,
  {
    search = "",
    status = "",
  } = {}
) {
  let nextQuery = query;

  if (status) {
    nextQuery = nextQuery.eq(
      "status",
      status
    );
  }

  if (search) {
    nextQuery = nextQuery.or(
      [
        `family_code.ilike.%${search}%`,
        `family_name.ilike.%${search}%`,
      ].join(",")
    );
  }

  return nextQuery;
}

/* =========================================================
   GET /api/admin/position-families

   รองรับ:
   - page / pageSize
   - search จากฐานข้อมูลทั้งหมด
   - status
   - id สำหรับ Edit selected value
   - all=true สำหรับหน้าที่ต้องใช้ข้อมูลทั้งหมด
   - ป้องกัน 416 Requested range not satisfiable
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const search =
      sanitizeSearch(
        searchParams.get("search")
      );

    const status =
      String(
        searchParams.get("status") || ""
      ).trim();

    const id =
      String(
        searchParams.get("id") || ""
      ).trim();

    const all =
      searchParams.get("all") ===
      "true";

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        1
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get("pageSize"),
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE
      );

    /* =====================================================
       GET BY ID
       ใช้ตอน Edit Employee ถ้าค่าเดิมไม่อยู่ใน 20 รายการแรก
    ===================================================== */

    if (id) {
      let query =
        supabaseAdmin
          .from("position_families")
          .select("*")
          .eq("id", id);

      if (status) {
        query = query.eq(
          "status",
          status
        );
      }

      const {
        data,
        error,
      } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: data ? [data] : [],
        pagination: {
          page: 1,
          pageSize: 1,
          total: data ? 1 : 0,
          totalPages: data ? 1 : 0,
          hasMore: false,
        },
      });
    }

    /* =====================================================
       COUNT ก่อนยิง RANGE
       เพื่อไม่ให้หน้าที่เกินข้อมูลจริงกลายเป็น HTTP 416
    ===================================================== */

    let countQuery =
      supabaseAdmin
        .from("position_families")
        .select("id", {
          count: "exact",
          head: true,
        });

    countQuery = applyFilters(
      countQuery,
      {
        search,
        status,
      }
    );

    const {
      count,
      error: countError,
    } = await countQuery;

    if (countError) {
      throw countError;
    }

    const total =
      Number(count || 0);

    /* =====================================================
       ALL MODE
       โหลดเป็น batch เพื่อไม่ติด limit 1000 ของ PostgREST
    ===================================================== */

    if (all) {
      const rows = [];

      for (
        let from = 0;
        from < total;
        from += ALL_BATCH_SIZE
      ) {
        const to = Math.min(
          from +
            ALL_BATCH_SIZE -
            1,
          total - 1
        );

        let batchQuery =
          supabaseAdmin
            .from("position_families")
            .select("*");

        batchQuery = applyFilters(
          batchQuery,
          {
            search,
            status,
          }
        );

        const {
          data: batch,
          error: batchError,
        } = await batchQuery
          .order("sort_order", {
            ascending: true,
          })
          .order("family_code", {
            ascending: true,
          })
          .range(from, to);

        if (batchError) {
          throw batchError;
        }

        rows.push(...(batch || []));
      }

      return NextResponse.json({
        success: true,
        data: rows,
        pagination: {
          page: 1,
          pageSize: rows.length,
          total,
          totalPages:
            total > 0 ? 1 : 0,
          hasMore: false,
        },
      });
    }

    /* =====================================================
       PAGINATION ครั้งละ 20
    ===================================================== */

    const totalPages =
      total > 0
        ? Math.ceil(
            total / pageSize
          )
        : 0;

    const from =
      (page - 1) * pageSize;

    /* -----------------------------------------------------
       Client ขอ page เกินข้อมูลจริง
       คืน [] + HTTP 200 แทน 416
    ----------------------------------------------------- */

    if (
      total === 0 ||
      from >= total
    ) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasMore: false,
        },
      });
    }

    const to = Math.min(
      from + pageSize - 1,
      total - 1
    );

    let query =
      supabaseAdmin
        .from("position_families")
        .select("*");

    query = applyFilters(
      query,
      {
        search,
        status,
      }
    );

    const {
      data,
      error,
    } = await query
      .order("sort_order", {
        ascending: true,
      })
      .order("family_code", {
        ascending: true,
      })
      .range(from, to);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore:
          page < totalPages,
      },
    });
  } catch (err) {
    console.error(
      "GET_POSITION_FAMILIES_ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "ไม่สามารถโหลดกลุ่มสายงานได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const payload = {
      family_code: body.family_code
        ?.trim()
        ?.toUpperCase(),

      family_name:
        body.family_name?.trim(),

      description:
        body.description?.trim() ||
        null,

      sort_order:
        Number(body.sort_order) || 0,

      status:
        body.status || "active",

      updated_at:
        new Date().toISOString(),
    };

    if (!payload.family_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอก Family Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.family_name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอก Family Name",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from("position_families")
      .select("id")
      .eq(
        "family_code",
        payload.family_code
      )
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Family Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("position_families")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message:
        "สร้าง Position Family สำเร็จ",
      data,
    });
  } catch (err) {
    console.error(
      "CREATE_POSITION_FAMILY_ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "ไม่สามารถสร้าง Position Family ได้",
      },
      {
        status: 500,
      }
    );
  }
}
