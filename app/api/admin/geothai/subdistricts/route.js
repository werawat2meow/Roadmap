import { NextResponse } from "next/server";

import {
  getThaiSubdistricts,
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

    const districtCode =
      String(
        searchParams.get(
          "district_code"
        ) || ""
      ).trim();

    const search = cleanText(
      searchParams.get("search")
    );

    if (!districtCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาระบุรหัสอำเภอ",
        },
        {
          status: 400,
        }
      );
    }

    let rows =
      getThaiSubdistricts(
        districtCode
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
            .includes(search) ||
          item.postcode
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
      "GeoThai subdistricts GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถโหลดข้อมูลตำบลได้",
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