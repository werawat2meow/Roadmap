// ไฟล์ใหม่ — เดิน relation:
// positions -> unit_positions -> units -> divisions -> departments
//           -> branch_departments -> branches
// เพื่อหา company (branch) ทั้งหมดที่เกี่ยวข้องกับตำแหน่งที่เลือก
// และคำนวณโควตาสูงสุด = headcount_target - จำนวนพนักงานปัจจุบัน (position_id)
//
// หมายเหตุ: ใช้ nested select ของ supabase-js ซึ่งต้องมี foreign key
// ระหว่างตารางตั้งไว้ถูกต้องใน Postgres (units.division_id -> divisions.id,
// divisions.department_id -> departments.id, branch_departments.department_id
// -> departments.id, branch_departments.branch_id -> branches.id)
// ถ้ามี FK ซ้ำซ้อนไปตารางเดียวกันหลายเส้น อาจต้องระบุชื่อ constraint
// เพิ่มเติมใน select (ดู supabase docs: "Specifying foreign key hints")

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /recruitment/api/positions/:id/companies
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const positionId = id;


    const [positionRes, employeesRes, unitPositionsRes] = await Promise.all([
      supabaseAdmin
        .from("positions")
        .select("id")
        .eq("id", positionId)
        .single(),

      // ดึงรายตัวพร้อม branch_id / unit_id เพื่อนับแยกตามบริษัท
      // สมมติฐาน: table employees มีคอลัมน์ branch_id และ unit_id เก็บอยู่
      // (ถ้า schema จริงไม่มี ให้ปรับ select นี้ตามคอลัมน์ที่ใช้อ้างอิงบริษัทของพนักงานแทน)
      supabaseAdmin
        .from("employees")
        .select("id, branch_id, unit_id")
        .eq("position_id", positionId),

      supabaseAdmin
        .from("unit_positions")
        .select(
          `
          headcount_target,
          unit:units (
            id, unit_name,
            division:divisions (
              id, division_name,
              department:departments (
                id, department_name,
                branch_departments (
                  branch:branches ( id, branch_name )
                )
              )
            )
          )
        `
        )
        .eq("position_id", positionId),
    ]);

    if (positionRes.error) {
      return NextResponse.json(
        { success: false, message: positionRes.error.message },
        { status: 404 }
      );
    }
    if (unitPositionsRes.error) {
      return NextResponse.json(
        { success: false, message: unitPositionsRes.error.message },
        { status: 500 }
      );
    }

    const headcountTarget = unitPositionsRes.data[0].headcount_target ?? 0;
    const employees = employeesRes.data || [];
    const employeeCount = employees.length; // รวมทั้งตำแหน่ง — ใช้คำนวณโควตาสูงสุด
    const maxOpening = Math.max(headcountTarget - employeeCount, 0);

    // นับจำนวนพนักงานแยกตาม "unit+branch" (ตรงกับแต่ละแถวในตาราง)
    // และสำรองไว้แยกตาม branch อย่างเดียว เผื่อพนักงานบางคนไม่มี unit_id
    const employeeCountByRow = {};
    const employeeCountByBranch = {};
    for (const emp of employees) {
      if (emp.branch_id != null) {
        employeeCountByBranch[emp.branch_id] =
          (employeeCountByBranch[emp.branch_id] || 0) + 1;
      }
      if (emp.unit_id != null && emp.branch_id != null) {
        const rk = `${emp.unit_id}-${emp.branch_id}`;
        employeeCountByRow[rk] = (employeeCountByRow[rk] || 0) + 1;
      }
    }

    const rows = [];
    const seen = new Set();

    for (const up of unitPositionsRes.data || []) {
      const unit = up.unit;
      if (!unit) continue;
      const division = unit.division;
      if (!division) continue;
      const department = division.department;
      if (!department) continue;

      for (const bd of department.branch_departments || []) {
        const branch = bd.branch;
        if (!branch) continue;

        const key = `${unit.id}-${branch.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const rowEmployeeCount =
          employeeCountByRow[key] ?? employeeCountByBranch[branch.id] ?? 0;

        rows.push({
          branch_id: branch.id,
          branch_name: branch.branch_name,
          department_id: department.id,
          department_name: department.department_name,
          division_id: division.id,
          division_name: division.division_name,
          unit_id: unit.id,
          unit_name: unit.unit_name,
          employee_count: rowEmployeeCount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { rows, maxOpening, headcountTarget, employeeCount },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}