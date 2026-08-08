import { NextResponse } from "next/server";

import {
  getThaiDistricts,
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

    const provinceCode =
      String(
        searchParams.get(
          "province_code"
        ) || ""
      ).trim();

    const search = cleanText(
      searchParams.get("search")
    );

    if (!provinceCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาระบุรหัสจังหวัด",
        },
        {
          status: 400,
        }
      );
    }

    let rows =
      getThaiDistricts(
        provinceCode
      );

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

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error(
      "GeoThai districts GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถโหลดข้อมูลอำเภอได้",
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