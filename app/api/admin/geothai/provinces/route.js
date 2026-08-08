import { NextResponse } from "next/server";

import {
  getThaiProvinces,
} from "@/lib/geothai";

function cleanText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const search = cleanText(
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
          searchParams.get("pageSize")
        ) || 20,
        1
      ),
      100
    );

    let rows =
      getThaiProvinces();

    if (search) {
      rows = rows.filter((item) => {
        return (
          item.code
            .toLowerCase()
            .includes(search) ||
          item.name_th
            ?.toLowerCase()
            .includes(search) ||
          item.name_en
            ?.toLowerCase()
            .includes(search)
        );
      });
    }

    const total = rows.length;

    const from =
      (page - 1) * pageSize;

    const data = rows.slice(
      from,
      from + pageSize
    );

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(
          Math.ceil(
            total / pageSize
          ),
          1
        ),
      },
    });
  } catch (error) {
    console.error(
      "GeoThai provinces GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถโหลดข้อมูลจังหวัดได้",
        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}