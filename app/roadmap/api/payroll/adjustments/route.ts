import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // 1. ดึงข้อมูลการประเมิน (ฟิลด์เหล่านี้มีจริงตาม Prisma Schema)
    const { data: evalRows, error: evalError } = await supabaseAdmin
      .from("rm_evaluations")
      .select(`
        id,
        employee_id,
        status,
        totalScore,
        maxScore,
        currentSalary,
        newSalary,
        created_at,
        rm_evaluation_types (
          name
        )
      `)
      .eq("status", "Completed")
      .not("newSalary", "is", null) 
      .order("created_at", { ascending: false });

    if (evalError) throw evalError;
    if (!evalRows || evalRows.length === 0) return NextResponse.json({ success: true, data: [] });

    // 2. ดึงข้อมูลพนักงาน (เอาเฉพาะฟิลด์ที่มีจริงในปัจจุบัน)
    const employeeIds = [...new Set(evalRows.map((r: any) => r.employee_id))];
    const { data: employeeRows, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        departments (department_name),
        positions (
          position_level_mappings (
            is_default,
            position_levels (level_code)
          )
        )
      `)
      .in("id", employeeIds);

    if (employeeError) throw employeeError;

    const employeeMap = new Map(employeeRows?.map((emp: any) => [emp.id, emp]) || []);

    // 3. Mapping ข้อมูล (ใส่ค่าหลอกในส่วนที่ DB ยังไม่มีฟิลด์)
    const mapped = evalRows
      .map((item: any) => {
        const employee = employeeMap.get(item.employee_id);
        if (!employee) return null;

        const scorePercent = item.maxScore > 0 
          ? `${Math.round((item.totalScore / item.maxScore) * 100)}%` 
          : "0%";

        const level = employee.positions?.position_level_mappings?.find((m: any) => m.is_default)
                      ?.position_levels?.level_code || "";

        return {
          id: item.id,
          name: `${employee.first_name_th} ${employee.last_name_th}`,
          employeeId: employee.employee_code || "-",
          department: employee.departments?.department_name || "",
          level: level,
          evaluation: `${item.rm_evaluation_types?.name || "การประเมิน"} (${scorePercent})`,
          oldSalary: item.currentSalary || 0,
          newSalary: item.newSalary || 0,
          
          // --- ส่วนที่ DB ยังไม่มีฟิลด์ ให้ใส่ข้อความรอไว้ก่อน ---
          bank: "รอข้อมูลจากระบบ (ยังไม่มีฟิลด์)", 
          accountNumber: "-",
          status: "รอข้อมูลบัญชี"
        };
      })
      .filter((row) => row !== null && row.newSalary !== row.oldSalary);

    return NextResponse.json({ success: true, data: mapped });

  } catch (error: any) {
    console.error("PAYROLL_API_ERROR DETAILS:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}