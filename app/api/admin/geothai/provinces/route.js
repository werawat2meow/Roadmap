import { NextResponse } from "next/server";

/* =========================================================
   Runtime
========================================================= */

export const runtime = "nodejs";

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/* =========================================================
   GET /api/admin/geothai/provinces
========================================================= */

export async function GET(req) {
  try {
    /* =====================================================
       Load GeoThai inside try/catch

       ตั้งใจ dynamic import เพื่อถ้า geothai โหลดไม่ได้
       เช่น หา data file ไม่เจอ เราจะเห็น error จริง
       ใน response แทน generic 500
    ===================================================== */

    const {
      getThaiProvinces,
    } = await import(
      "@/lib/geothai"
    );

    /* =====================================================
       Query Params
    ===================================================== */

    const { searchParams } =
      new URL(req.url);

    const search =
      cleanText(
        searchParams.get("search")
      );

    const page = Math.max(
      Number(
        searchParams.get("page")
      ) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get(
            "pageSize"
          )
        ) || 20,
        1
      ),
      100
    );

    /* =====================================================
       Load Provinces
    ===================================================== */

    let rows =
      getThaiProvinces();

    if (!Array.isArray(rows)) {
      throw new Error(
        "GeoThai provinces result is not an array"
      );
    }

    /* =====================================================
       Search
    ===================================================== */

    if (search) {
      rows = rows.filter(
        (item) => {
          const code =
            cleanText(
              item?.code
            );

          const nameTh =
            cleanText(
              item?.name_th
            );

          const nameEn =
            cleanText(
              item?.name_en
            );

          return (
            code.includes(
              search
            ) ||
            nameTh.includes(
              search
            ) ||
            nameEn.includes(
              search
            )
          );
        }
      );
    }

    /* =====================================================
       Pagination
    ===================================================== */

    const total =
      rows.length;

    const from =
      (page - 1) *
      pageSize;

    const data =
      rows.slice(
        from,
        from + pageSize
      );

    /* =====================================================
       Response
    ===================================================== */

    return NextResponse.json({
      success: true,

      data,

      pagination: {
        page,
        pageSize,
        total,

        totalPages:
          Math.max(
            Math.ceil(
              total /
                pageSize
            ),
            1
          ),
      },
    });
  } catch (error) {
    /* =====================================================
       Error
    ===================================================== */

    console.error(
      "[GEOTHAI_PROVINCES_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถโหลดข้อมูลจังหวัดได้",

        error:
          error instanceof Error
            ? error.message
            : String(error),

        stack:
          process.env.NODE_ENV ===
          "development"
            ? error?.stack
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}