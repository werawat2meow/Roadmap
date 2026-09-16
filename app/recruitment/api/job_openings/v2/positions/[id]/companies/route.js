// app/recruitment/api/positions/[id]/companies/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /recruitment/api/positions/:id/companies

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const positionId = id;

    if (!positionId) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ position_id",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 1. ตรวจสอบ Position
    // =========================================================
    const { data: position, error: positionError } =
      await supabaseAdmin
        .from("positions")
        .select("id")
        .eq("id", positionId)
        .maybeSingle();

    if (positionError) {
      return NextResponse.json(
        {
          success: false,
          message: positionError.message,
        },
        { status: 500 }
      );
    }

    if (!position) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบตำแหน่งงาน",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 2. ดึง Job Description ที่เกี่ยวข้องกับ Position
    // =========================================================
    const {
      data: jobDescriptions,
      error: jobDescriptionError,
    } = await supabaseAdmin
      .from("recruit_job_description")
      .select("id")
      .eq("positions_id", positionId);

    if (jobDescriptionError) {
      return NextResponse.json(
        {
          success: false,
          message: jobDescriptionError.message,
        },
        { status: 500 }
      );
    }

    const jobDescriptionIds = (jobDescriptions || []).map(
      (item) => item.id
    );

    // =========================================================
    // 3. ดึง Branch ที่อนุญาตของ Job Description
    //
    // recruit_job_description
    //       ↓
    // recruit_job_description_branches
    //       ↓
    // branches
    // =========================================================
    let allowedBranches = [];

    if (jobDescriptionIds.length > 0) {
      const {
        data: descriptionBranches,
        error: descriptionBranchesError,
      } = await supabaseAdmin
        .from("recruit_job_description_branches")
        .select(`
          job_description_id,
          branch_id,
          branch:branches (
            id,
            branch_name
          )
        `)
        .in("job_description_id", jobDescriptionIds);

      if (descriptionBranchesError) {
        return NextResponse.json(
          {
            success: false,
            message: descriptionBranchesError.message,
          },
          { status: 500 }
        );
      }

      // -------------------------------------------------------
      // ป้องกัน Branch ซ้ำ
      // -------------------------------------------------------
      const branchMap = new Map();

      for (const item of descriptionBranches || []) {
        const branch = item.branch;

        if (!branch || !branch.id) {
          continue;
        }

        if (!branchMap.has(branch.id)) {
          branchMap.set(branch.id, {
            branch_id: branch.id,
            branch_name: branch.branch_name,
          });
        }
      }

      allowedBranches = Array.from(branchMap.values());
    }

    // =========================================================
    // 4. ดึง unit_positions ทุก record ของ position
    //
    // unit_positions
    //      ↓
    // units
    //      ↓
    // divisions
    //      ↓
    // departments
    //      ↓
    // branch_departments
    //      ↓
    // branches
    // =========================================================
    const {
      data: unitPositions,
      error: unitPositionError,
    } = await supabaseAdmin
      .from("unit_positions")
      .select(`
        id,
        position_id,
        headcount_target,

        unit:units (
          id,
          unit_name,

          division:divisions (
            id,
            division_name,

            department:departments (
              id,
              department_name,

              branch_departments (
                branch_id,

                branch:branches (
                  id,
                  branch_name
                )
              )
            )
          )
        )
      `)
      .eq("position_id", positionId);

    if (unitPositionError) {
      return NextResponse.json(
        {
          success: false,
          message: unitPositionError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 5. สร้าง Map ของ Branch ที่มาจาก
    //    recruit_job_description_branches
    //
    //    ใช้สำหรับตรวจสอบว่า Branch จาก unit_positions
    //    เป็น Branch ที่อนุญาตจริงหรือไม่
    // =========================================================
    const allowedBranchMap = new Map();

    for (const branch of allowedBranches) {
      allowedBranchMap.set(branch.branch_id, branch);
    }

    // =========================================================
    // 6. ดึง Employees ทั้งหมดของ Position
    //
    // ต้องมี branch_id เพื่อคำนวณ employee_count
    // แยกตาม Branch
    // =========================================================
    const {
      data: employees,
      error: employeesError,
    } = await supabaseAdmin
      .from("employees")
      .select("id, branch_id")
      .eq("position_id", positionId);

    if (employeesError) {
      return NextResponse.json(
        {
          success: false,
          message: employeesError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 7. นับ Employee แยกตาม Branch
    // =========================================================
    const employeeCountByBranch = {};

    for (const employee of employees || []) {
      if (!employee.branch_id) {
        continue;
      }

      employeeCountByBranch[employee.branch_id] =
        (employeeCountByBranch[employee.branch_id] || 0) + 1;
    }

    // =========================================================
    // 8. สร้างข้อมูล Branch จาก unit_positions
    //
    // สำคัญ:
    //
    // - unit_positions อาจมีหลาย record
    // - แต่ Branch ห้ามซ้ำ
    // - ถ้า Branch ซ้ำ ให้รวม headcount_target
    // - ใช้ข้อมูล Unit/Division/Department ของ record แรก
    // =========================================================
    const branchResultMap = new Map();

    for (const unitPosition of unitPositions || []) {
      const unit = unitPosition.unit;

      if (!unit) {
        continue;
      }

      const division = unit.division;
      const department = division?.department;

      // -------------------------------------------------------
      // branch_departments อยู่ใต้ Department
      // -------------------------------------------------------
      const branchDepartments =
        department?.branch_departments || [];

      for (const branchDepartment of branchDepartments) {
        const branch = branchDepartment.branch;

        if (!branch || !branch.id) {
          continue;
        }

        // -----------------------------------------------------
        // ตรวจสอบ Branch กับ
        // recruit_job_description_branches
        // -----------------------------------------------------
        if (!allowedBranchMap.has(branch.id)) {
          continue;
        }

        const branchId = branch.id;

        const headcountTarget = Number(
          unitPosition.headcount_target || 0
        );

        // -----------------------------------------------------
        // ถ้า Branch นี้มีอยู่แล้ว
        // ให้รวม headcount_target
        // แต่ไม่สร้าง Branch ซ้ำ
        // -----------------------------------------------------
        if (branchResultMap.has(branchId)) {
          const existing = branchResultMap.get(branchId);

          existing.headcount_target += headcountTarget;

          continue;
        }

        // -----------------------------------------------------
        // Branch ใหม่
        // -----------------------------------------------------
        branchResultMap.set(branchId, {
          branch_id: branch.id,
          branch_name: branch.branch_name,

          department_id: department?.id ?? null,
          department_name:
            department?.department_name ?? null,

          division_id: division?.id ?? null,
          division_name:
            division?.division_name ?? null,

          unit_id: unit?.id ?? null,
          unit_name: unit?.unit_name ?? null,

          headcount_target: headcountTarget,
        });
      }
    }

    // =========================================================
    // 9. กรณีไม่มี unit_positions
    //
    // แต่มี Branch จาก
    // recruit_job_description_branches
    //
    // ให้ยังแสดง Branch
    // และ Organization เป็น null
    // headcount_target = 0
    // =========================================================
    if (branchResultMap.size === 0 && allowedBranches.length > 0) {
      for (const branch of allowedBranches) {
        branchResultMap.set(branch.branch_id, {
          branch_id: branch.branch_id,
          branch_name: branch.branch_name,

          department_id: null,
          department_name: null,

          division_id: null,
          division_name: null,

          unit_id: null,
          unit_name: null,

          headcount_target: 0,
        });
      }
    }

    // =========================================================
    // 10. คำนวณ employee_count และ maxOpening แยก Branch
    // =========================================================
    const rows = Array.from(branchResultMap.values()).map(
      (row) => {
        const employeeCount =
          employeeCountByBranch[row.branch_id] || 0;

        const maxOpening = Math.max(
          Number(row.headcount_target || 0) - employeeCount,
          0
        );

        return {
          branch_id: row.branch_id,
          branch_name: row.branch_name,

          department_id: row.department_id,
          department_name: row.department_name,

          division_id: row.division_id,
          division_name: row.division_name,

          unit_id: row.unit_id,
          unit_name: row.unit_name,

          headcount_target: Number(
            row.headcount_target || 0
          ),

          employee_count: employeeCount,

          maxOpening,
        };
      }
    );

    // =========================================================
    // 11. รวมข้อมูลสำหรับภาพรวม
    //
    // headcountTarget = รวมทุก Branch
    // employeeCount  = รวม Employee ของ Position
    // maxOpening     = รวม maxOpening ของแต่ละ Branch
    // =========================================================
    const headcountTarget = rows.reduce(
      (total, row) =>
        total + Number(row.headcount_target || 0),
      0
    );

    const employeeCount = rows.reduce(
      (total, row) =>
        total + Number(row.employee_count || 0),
      0
    );

    const maxOpening = rows.reduce(
      (total, row) =>
        total + Number(row.maxOpening || 0),
      0
    );

    // =========================================================
    // 12. Response
    // =========================================================
    return NextResponse.json({
      success: true,

      data: {
        rows,

        // ภาพรวมทั้งหมด
        headcountTarget,
        employeeCount,
        maxOpening,

        // Job Description ที่เกี่ยวข้อง
        jobDescriptionIds,

        // จำนวน Branch ที่ไม่ซ้ำ
        branchCount: rows.length,
      },
    });
  } catch (error) {
    console.error(
      "GET /recruitment/api/positions/[id]/companies error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}