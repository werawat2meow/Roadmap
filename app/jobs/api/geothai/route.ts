import { NextRequest, NextResponse } from "next/server";

import {
    getAllProvinces,
    getProvincesByCriterion,
    getProvinceByCode,
    getDistrictsByCriterion,
    getDistrictByCode,
    getSubdistrictsByCriterion,
    getSubdistrictByCode,
} from "geothai";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);      

        const type = searchParams.get("type");
        const id = searchParams.get("id");
        const provinceId = searchParams.get("provinceId");
        const districtId = searchParams.get("districtId");
        
        switch (type) {
            /**
             * จังหวัด
             *
             * GET /api/address?type=province
             * GET /api/address?type=province&id=10
             */
            case "province": {
                if (id) {
                    const province = getProvinceByCode(id);

                    if (!province) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: "Province not found",
                            },
                            { status: 404 }
                        );
                    }

                    return NextResponse.json({
                        success: true,
                        data: province,
                    });
                }

                const provinces = getAllProvinces();            

                return NextResponse.json({
                    success: true,
                    data: provinces,
                });
            }

            /**
             * อำเภอ
             *
             * GET /api/address?type=district&provinceId=10
             * GET /api/address?type=district&id=1001
             */
            case "district": {
                if (id) {
                    const district = getDistrictByCode(id);

                    if (!district) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: "District not found",
                            },
                            { status: 404 }
                        );
                    }

                    return NextResponse.json({
                        success: true,
                        data: district,
                    });
                }

                if (!provinceId) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "provinceId is required",
                        },
                        { status: 400 }
                    );
                }

                const districts = getDistrictsByCriterion({ province_code: Number(provinceId) });

                return NextResponse.json({
                    success: true,
                    data: districts,
                });
            }

            /**
             * ตำบล
             *
             * GET /api/address?type=subdistrict&districtId=1001
             * GET /api/address?type=subdistrict&id=100101
             */
            case "subdistrict": {
                if (id) {
                    const subdistrict = getSubdistrictByCode(id);

                    if (!subdistrict) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: "Subdistrict not found",
                            },
                            { status: 404 }
                        );
                    }

                    return NextResponse.json({
                        success: true,
                        data: subdistrict,
                    });
                }

                if (!districtId) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "districtId is required",
                        },
                        { status: 400 }
                    );
                }

                const subdistricts = getSubdistrictsByCriterion({ district_code: Number(districtId) });

                return NextResponse.json({
                    success: true,
                    data: subdistricts,
                });
            }

            default:
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid type. Use province, district or subdistrict.",
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}