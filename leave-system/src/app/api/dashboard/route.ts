import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const token = cookies().get("employee_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        try {
            await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentYear = new Date().getFullYear();

        // 1. Monthly Leaves - วันลาเฉลี่ยรายเดือน
        const monthlyData = await prisma.leaveRequest.groupBy({
            by: ['startDate'],
            _sum: { requestedDays: true },
            _count: true,
            where: {
                status: 'APPROVED',
                startDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`),
                }
            }
        });

        const monthlyLeaves = Array.from({ length: 12 }, (_, i) => {
            const monthName = new Date(currentYear, i, 1).toLocaleDateString("en", { month: "short" });
            const monthdata = monthlyData.filter(item =>
                new Date(item.startDate).getMonth() === i
            );
            const totalDays = monthdata.reduce((sum, item) => sum + Number(item._sum.requestedDays || 0), 0);
            const totalRequests = monthdata.reduce((sum, item) => sum + item._count, 0);
            return {
                m: monthName,
                avgDays: totalRequests > 0 ? Number((totalDays / totalRequests).toFixed(1)) : 0
            };
        });

        // 2. Leave Types - จำนวนตามประเภทลา
        const leaveTypesData = await prisma.leaveRequest.groupBy({
            by: ['kind'],
            _count: true,
            where: {
                startDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`),
                }
            }
        });

        const leaveTypeMap: Record<string, string> = {
            'ANNUAL': 'ลาพักร้อน',
            'SICK': 'ลาป่วย',
            'BUSINESS': 'ลากิจ',
            'MATERNITY': 'ลาคลอด',
            'BIRTHDAY': 'ลาวันเกิด',
            'ORDAIN': 'ลาบวช',
            'UNPAID': 'ลาไม่ได้รับเงิน',
            'ANNUAL_HOLIDAY': 'ลาวันหยุดประจำปี'
        };

        const leaveTypes = leaveTypesData.map(item => ({
            type: leaveTypeMap[item.kind] || item.kind,
            count: item._count
        }));

        // 3. Status Distribution - สัดส่วนสถานะ
        const statusData = await prisma.leaveRequest.groupBy({
            by: ['status'],
            _count: true,
            where: {
                startDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`),
                }
            }
        });

        const statusMap: Record<string, string> = {
            'APPROVED': 'อนุมัติ',
            'PENDING': 'รออนุมัติ',
            'REJECTED': 'ไม่อนุมัติ'
        };

        const statusDist = statusData.map(item => ({
            name: statusMap[item.status] || item.status,
            value: item._count
        }));

        return NextResponse.json({
            ok: true,
            data: {
                monthlyLeaves,
                leaveTypes,
                statusDist,
            }
        });

    } catch (error) {
        console.error("GET /api/dashboard error:", error);
        return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
}