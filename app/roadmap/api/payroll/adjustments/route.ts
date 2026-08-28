import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data: evalRows, error: evalError } = await supabaseAdmin
      .from("rm_evaluations")
      .select(
        `
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
      `,
      )
      .eq("status", "Completed")
      .not("newSalary", "is", null)
      .order("created_at", { ascending: false });

    if (evalError) throw evalError;
    if (!evalRows || evalRows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const employeeIds = [
      ...new Set(evalRows.map((row: any) => row.employee_id)),
    ];

    const { data: employeeRows, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(
        `
        id,
        employee_code,
        first_name_th,
        last_name_th,
        departments ( department_name ),
        positions (
          position_level_mappings (
            is_default,
            position_levels ( level_code )
          )
        )
      `,
      )
      .in("id", employeeIds);

    if (employeeError) throw employeeError;

    const { data: bankRows, error: bankError } = await supabaseAdmin
      .from("employee_bank_accounts")
      .select(
        `
        employee_id,
        account_no,
        account_name,
        is_primary,
        status,
        banks (
          bank_name_th,
          bank_short_name
        )
      `,
      )
      .in("employee_id", employeeIds)
      .eq("status", "active");

    if (bankError) throw bankError;

    const employeeMap = new Map(
      employeeRows?.map((emp: any) => [emp.id, emp]) || [],
    );

    const bankMap = new Map<string, any>();

    (bankRows || []).forEach((bankRow: any) => {
      const existing = bankMap.get(bankRow.employee_id);

      if (!existing) {
        bankMap.set(bankRow.employee_id, bankRow);
        return;
      }

      if (bankRow.is_primary && !existing.is_primary) {
        bankMap.set(bankRow.employee_id, bankRow);
      }
    });

    const mapped = evalRows
      .map((item: any) => {
        const employee = employeeMap.get(item.employee_id);
        if (!employee) return null;

        const scorePercent =
          item.maxScore > 0
            ? `${Math.round((item.totalScore / item.maxScore) * 100)}%`
            : "0%";

        const level =
          employee.positions?.position_level_mappings?.find(
            (m: any) => m.is_default,
          )?.position_levels?.level_code || "";

        const bankRow = bankMap.get(item.employee_id);

        const bankName =
          bankRow?.banks?.bank_name_th ||
          bankRow?.banks?.bank_short_name ||
          bankRow?.account_name ||
          "ยังไม่มีข้อมูล";

        return {
          id: item.id,
          name: `${employee.first_name_th} ${employee.last_name_th}`,
          employeeId: employee.employee_code || "-",
          department: employee.departments?.department_name || "",
          level,
          evaluation: `${item.rm_evaluation_types?.name || "การประเมิน"} (${scorePercent})`,
          oldSalary: item.currentSalary || 0,
          newSalary: item.newSalary || 0,
          bank: bankName,
          accountNumber: bankRow?.account_no || "-",
          status: bankRow ? "พร้อมส่งบัญชี" : "รอข้อมูลบัญชี",
        };
      })
      .filter((row) => row !== null && row.newSalary !== row.oldSalary);

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("PAYROLL_API_ERROR DETAILS:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { evaluationIds, updatedById } = await request.json();

    // 1. ดึงข้อมูลใบประเมิน
    const { data: evals, error: fetchError } = await supabaseAdmin
      .from("rm_evaluations")
      .select("id, employee_id, currentSalary, newSalary")
      .in("id", evaluationIds);

    if (fetchError) throw fetchError;
    if (!evals || evals.length === 0) {
      return NextResponse.json({
        success: true,
        message: "ดำเนินการสำเร็จ 0 รายการ (ไม่พบข้อมูลใบประเมิน)",
      });
    }

    // 2. ดึงข้อมูลเงินเดือนปัจจุบันแยกออกมา
    const employeeIds = evals.map((e) => e.employee_id);
    const { data: comps } = await supabaseAdmin
      .from("employee_compensations")
      .select("id, employee_id, salary_structure_id")
      .in("employee_id", employeeIds);

    const compMap = new Map(comps?.map((c) => [c.employee_id, c]) || []);
    const results = [];

    for (const item of evals) {
      const currentComp = compMap.get(item.employee_id);

      // A. อัปเดตเงินเดือนพนักงาน
      const { error: upError } = await supabaseAdmin
        .from("employee_compensations")
        .update({ base_salary: item.newSalary, updated_by: updatedById })
        .eq("employee_id", item.employee_id);

      if (upError)
        throw new Error(`Update Compensation Error: ${upError.message}`);

      // B. บันทึกประวัติ (Log)
      const diff = (item.newSalary || 0) - (item.currentSalary || 0);
      const { error: logError } = await supabaseAdmin
        .from("employee_compensation_adjustments")
        .insert({
          employee_id: item.employee_id,
          current_compensation_id: currentComp?.id,
          salary_structure_id: currentComp?.salary_structure_id,
          adjustment_type: "annual_increment",
          current_salary: item.currentSalary,
          adjustment_amount: diff,
          proposed_salary: item.newSalary,
          effective_date: new Date().toISOString().split("T")[0],
          status: "approved",
          evaluation_reference_id: item.id,
          created_by: updatedById,
          updated_by: updatedById,
        });

      if (logError) throw new Error(`Insert Log Error: ${logError.message}`);

      // C. อัปเดตสถานะใบประเมินเป็น SalaryUpdated
      await supabaseAdmin
        .from("rm_evaluations")
        .update({ status: "SalaryUpdated" })
        .eq("id", item.id);

      results.push(item.id);
    }

    return NextResponse.json({
      success: true,
      message: `อัปเดตข้อมูลสำเร็จ ${results.length} รายการ`,
    });
  } catch (error: any) {
    console.error("❌ API ERROR:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
