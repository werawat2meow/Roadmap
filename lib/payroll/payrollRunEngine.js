/* =========================================================
   HRMS Enterprise - Payroll Run Engine Adapter
========================================================= */

/*
 * IMPORTANT
 * ---------
 * Module Payroll Run แยก "Workflow" ออกจาก "Calculation Engine"
 * เพื่อให้หน้า /admin/payroll-runs ใช้งานได้โดยไม่ผูกกับ
 * schema ของ Salary Component / Payroll Formula แบบตายตัว
 *
 * Engine ปัจจุบัน = base_salary_v1
 * - Gross = Base Salary
 * - Deduction = 0
 * - Net = Base Salary
 *
 * จุดประสงค์:
 * 1) ให้ Workflow / Scope / Permission / Lock / Snapshot พร้อมก่อน
 * 2) วันเชื่อม Salary Structure + Formula Engine
 *    เปลี่ยนเฉพาะ calculatePayrollRunItem()
 *
 * ห้ามนำ Engine นี้ไปถือเป็น Final Production Payroll
 * จนกว่าจะเชื่อม Earnings / Deductions / Tax / SSO / Formula จริง
 */

export const PAYROLL_ENGINE_CODE =
  "base_salary_v1";

function money(value) {
  const number =
    Number(value || 0);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return Math.round(
    number * 100
  ) / 100;
}

export function calculatePayrollRunItem(
  item
) {
  const baseSalary =
    money(
      item?.base_salary
    );

  return {
    gross_amount:
      baseSalary,

    deduction_amount:
      0,

    net_amount:
      baseSalary,

    calculation_status:
      "calculated",

    calculation_note:
      "Engine base_salary_v1: คำนวณเฉพาะ Base Salary ยังไม่รวม Earnings, Deductions, Tax, SSO และ Payroll Formula",
  };
}
