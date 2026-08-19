import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || "all";
    const year =
      searchParams.get("year") || new Date().getFullYear().toString();

    const requestedYear = parseInt(year, 10);
    const currentYear =
      requestedYear > 2500 ? requestedYear - 543 : requestedYear;

    // 1. ดึงข้อมูลการประเมิน (ดึงฟิลด์เงินเดือนมาคำนวณยอดปรับ)
    const { data: yearlyData, error: evalError } = await supabaseAdmin
      .from("rm_evaluations")
      .select(
        `
        id,
        employee_id,
        status,
        created_at,
        currentSalary,
        newSalary,
        special_compensation,
        rm_evaluation_types(name)
      `,
      )
      .gte("created_at", `${currentYear}-01-01T00:00:00Z`)
      .lte("created_at", `${currentYear}-12-31T23:59:59Z`);

    if (evalError) throw evalError;

    // 2. ดึงข้อมูลพนักงานแยก เพื่อเอา 'branch' (สังกัด)
    const employeeIds = [
      ...new Set((yearlyData || []).map((item) => item.employee_id)),
    ];
    const { data: employees, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, branches(branch_name)")
      .in("id", employeeIds);

    if (employeeError) throw employeeError;
    const branchMap = new Map(
      (employees || []).map((emp: any) => [
        emp.id,
        emp.branches?.branch_name || "ไม่ระบุ",
      ]),
    );

    // 3. รวมร่างข้อมูลเบื้องต้น
    const mergedData = (yearlyData || []).map((item: any) => ({
      ...item,
      branch: branchMap.get(item.employee_id) || "ไม่ระบุ",
    }));

    // 4. กรองข้อมูลตามเดือนที่เลือก
    const filteredData = mergedData.filter((item) => {
      if (month === "all") return true;
      const itemMonth = new Date(item.created_at).getMonth() + 1;
      return itemMonth === parseInt(month, 10);
    });

    // 5. คำนวณสรุปรายสังกัด (Branch Summary) ตามภาพที่ต้องการ
    const branchSummaryMap: Record<
      string,
      { branch: string; count: number; totalAmount: number }
    > = {};

    filteredData.forEach((item: any) => {
      const branchName = item.branch;

      // คำนวณยอดปรับ: (เงินเดือนใหม่ - เงินเดือนเก่า) + ค่าตอบแทนพิเศษ
      const salaryDiff = (item.newSalary || 0) - (item.currentSalary || 0);
      const adjustment = salaryDiff + (Number(item.special_compensation) || 0);

      if (!branchSummaryMap[branchName]) {
        branchSummaryMap[branchName] = {
          branch: branchName,
          count: 0,
          totalAmount: 0,
        };
      }

      branchSummaryMap[branchName].count += 1;
      branchSummaryMap[branchName].totalAmount += adjustment;
    });

    const branchSummary = Object.values(branchSummaryMap);

    // 6. คำนวณ Stats หน้าบัตร
    const completedCount = filteredData.filter(
      (item) => item.status === "Completed",
    ).length;

    // 7. เตรียมข้อมูลกราฟ (ใช้ข้อมูลทั้งปี)
    const monthsThai = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const chartData = monthsThai.map((name, index) => {
      const monthItems = mergedData.filter(
        (item) => new Date(item.created_at).getMonth() === index,
      );
      return {
        name,
        Total: monthItems.length,
        Completed: monthItems.filter((item) => item.status === "Completed")
          .length,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees: new Set(filteredData.map((item) => item.employee_id))
          .size,
        evaluations: filteredData.length,
        completed: completedCount,
        promotions: filteredData.filter((item) => {
          const typeName = Array.isArray(item.rm_evaluation_types)
            ? item.rm_evaluation_types[0]?.name
            : (item.rm_evaluation_types as any)?.name;
          return item.status === "Completed" && typeName === "Promote";
        }).length,
        evalPercent:
          filteredData.length > 0
            ? Math.round((completedCount / filteredData.length) * 100)
            : 0,
      },
      chartData,
      branchSummary, // ข้อมูลสำหรับตารางสรุปรายสังกัด
    });
  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
