import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  // 1. ดึงการประเมินที่สถานะ Completed ทั้งหมด
  const { data: evalRows, error: evalError } = await supabaseAdmin
    .from("rm_evaluations")
    .select(`
      id,
      employee_id,
      status,
      totalScore,
      maxScore,
      created_at,
      evaluation_types:evaluation_type_id (name),
      new_salary,
      total_salary_new
    `)
    .eq("status", "Completed")
    .order("created_at", { ascending: false });

  if (evalError) return NextResponse.json({ success: false, error: evalError.message }, { status: 500 });

  // 2. ดึงข้อมูลพนักงานที่เกี่ยวข้อง (รวมข้อมูลธนาคาร)
  const employeeIds = [...new Set(evalRows.map((r: any) => r.employee_id))];
  
  const { data: employeeRows, error: employeeError } = await supabaseAdmin
    .from("employees")
    .select(`
      id,
      employee_code,
      first_name_th,
      last_name_th,
      base_salary,
      bank_name,
      account_number,
      bank_account_status,
      departments(department_name),
      positions(
        position_level_mappings(
          position_levels(level_code),
          is_default
        )
      )
    `)
    .in("id", employeeIds);

  if (employeeError) return NextResponse.json({ success: false, error: employeeError.message }, { status: 500 });

  const employeeMap = new Map(employeeRows.map((emp: any) => [emp.id, emp]));

  // 3. Mapping และ Filter เฉพาะคนที่มีการปรับเงินเดือน (New Salary > 0)
  const mapped = evalRows
    .map((item: any) => {
      const employee = employeeMap.get(item.employee_id) || {};
      const oldSalary = employee.base_salary || 0;
      // ใช้ new_salary จากผลประเมิน ถ้าไม่มีให้เป็น 0
      const newSalary = item.total_salary_new || item.new_salary || 0;
      
      const scorePercent = item.maxScore > 0 ? `${Math.round((item.totalScore / item.maxScore) * 100)}%` : "0%";
      const level = employee.positions?.position_level_mappings?.find((m: any) => m.is_default)?.position_levels?.level_code || "";

      return {
        id: item.id,
        name: `${employee.first_name_th} ${employee.last_name_th}`,
        employeeId: employee.employee_code,
        department: employee.departments?.department_name || "",
        level: level,
        evaluation: `${item.evaluation_types?.name} - ${scorePercent}`,
        oldSalary: oldSalary,
        newSalary: newSalary,
        bank: employee.bank_name || "ยังไม่ได้กรอก",
        accountNumber: employee.account_number || "-",
        status: employee.bank_account_status || "รอข้อมูลบัญชี", // ใช้สถานะจากตาราง employee แทน
      };
    })
    .filter((row: any) => row.newSalary > 0); // *** กรองเฉพาะคนที่มีการปรับเงินเดือน ***

  return NextResponse.json({ success: true, data: mapped });
}