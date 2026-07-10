import { NextResponse } from "next/server";

import {
  getThaiProvinces,
  getThaiDistricts,
  getThaiSubdistricts,
} from "@/lib/geothai";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type")?.trim();
    const provinceCode = searchParams.get("province_code")?.trim();
    const districtCode = searchParams.get("district_code")?.trim();

    if (type === "provinces") {
      return NextResponse.json({
        success: true,
        data: getThaiProvinces(),
      });
    }

    if (type === "districts") {
      if (!provinceCode) {
        return NextResponse.json(
          {
            success: false,
            error: "ไม่พบรหัสจังหวัด",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: getThaiDistricts(provinceCode),
      });
    }

    if (type === "subdistricts") {
      if (!districtCode) {
        return NextResponse.json(
          {
            success: false,
            error: "ไม่พบรหัสอำเภอ",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: getThaiSubdistricts(districtCode),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "ประเภทข้อมูลไม่ถูกต้อง",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("GET_THAI_ADDRESS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถโหลดข้อมูลที่อยู่ได้",
      },
      { status: 500 }
    );
  }
}