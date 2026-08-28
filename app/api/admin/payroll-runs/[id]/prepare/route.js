import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  writeActivityLog,
} from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  buildPayrollEmployeeSnapshot,
  getActorId,
  jsonError,
  loadRun,
  mapDatabaseError,
  getErrorStatus,
  validatePeriod,
} from "../../_helpers";

/* =========================================================
   POST /api/admin/payroll-runs/[id]/prepare
========================================================= */

export async function POST(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_runs",
        "edit",
        {
          scopeType:
            "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const runResult =
      await loadRun(id);

    if (runResult.error) {
      throw runResult.error;
    }

    const run =
      runResult.data;

    if (!run) {
      return jsonError(
        "ไม่พบ Payroll Run",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        run.company_id,
        "คุณไม่มีสิทธิ์เตรียม Payroll Run ของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      run.status !==
      "draft"
    ) {
      return jsonError(
        "เตรียมข้อมูลได้เฉพาะ Payroll Run สถานะ Draft เท่านั้น",
        400
      );
    }

    const periodValidation =
      await validatePeriod({
        companyId:
          run.company_id,

        payrollPeriodId:
          run.payroll_period_id,

        requireOpen:
          true,
      });

    if (
      periodValidation.error
    ) {
      return jsonError(
        periodValidation.error,
        400
      );
    }

    const period =
      periodValidation.period;

    const snapshot =
      await buildPayrollEmployeeSnapshot({
        companyId:
          run.company_id,

        payrollGroupId:
          run.payroll_group_id,

        period,
      });

    if (
      snapshot.length ===
      0
    ) {
      return jsonError(
        "ไม่พบพนักงานที่มี Employee Compensation และอยู่ใน Payroll Group ของงวดนี้",
        400,
        {
          hint:
            "ตรวจ payroll_group_id / payroll_company_id ของพนักงาน และ Employee Compensation ที่มีผลในช่วงงวด",
        }
      );
    }

    /*
     * Draft ยังไม่มี Result ที่ต้องรักษา
     * ล้าง Snapshot เดิมก่อน prepare ใหม่
     */
    const {
      error:
        deleteItemError,
    } =
      await supabaseAdmin
        .from(
          "payroll_run_items"
        )
        .delete()
        .eq(
          "payroll_run_id",
          id
        );

    if (
      deleteItemError
    ) {
      throw deleteItemError;
    }

    const items =
      snapshot.map(
        (item) => ({
          payroll_run_id:
            id,

          employee_id:
            item.employee_id,

          employee_code:
            item.employee_code,

          employee_name:
            item.employee_name,

          base_salary:
            item.base_salary,

          gross_amount:
            null,

          deduction_amount:
            null,

          net_amount:
            null,

          calculation_status:
            "pending",

          calculation_note:
            null,

          snapshot:
            item.snapshot,
        })
      );

    const CHUNK_SIZE =
      500;

    for (
      let index = 0;
      index <
      items.length;
      index +=
        CHUNK_SIZE
    ) {
      const chunk =
        items.slice(
          index,
          index +
            CHUNK_SIZE
        );

      const {
        error,
      } =
        await supabaseAdmin
          .from(
            "payroll_run_items"
          )
          .insert(
            chunk
          );

      if (error) {
        throw error;
      }
    }

    const baseSalaryTotal =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.base_salary ||
            0
          ),
        0
      );

    const actorId =
      getActorId(
        guard
      );

    const now =
      new Date()
        .toISOString();

    const {
      data:
        updatedRun,
      error:
        updateRunError,
    } =
      await supabaseAdmin
        .from(
          "payroll_runs"
        )
        .update({
          status:
            "prepared",

          employee_count:
            items.length,

          calculated_count:
            0,

          error_count:
            0,

          base_salary_total:
            baseSalaryTotal,

          gross_amount:
            null,

          deduction_amount:
            null,

          net_amount:
            null,

          prepared_at:
            now,

          started_at:
            null,

          completed_at:
            null,

          calculation_engine:
            null,

          is_locked:
            false,

          updated_by:
            actorId,

          updated_at:
            now,
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

    if (
      updateRunError
    ) {
      throw updateRunError;
    }

    /*
     * Lock Period หลัง Snapshot สำเร็จ
     * กันแก้ช่วงวันที่ระหว่างเตรียม Payroll
     */
    const {
      error:
        periodLockError,
    } =
      await supabaseAdmin
        .from(
          "payroll_periods"
        )
        .update({
          is_locked:
            true,

          updated_at:
            now,
        })
        .eq(
          "id",
          run.payroll_period_id
        );

    if (
      periodLockError
    ) {
      throw periodLockError;
    }

    try {
      await writeActivityLog({
        moduleName:
          "payroll_runs",

        actionType:
          "UPDATE",

        referenceTable:
          "payroll_runs",

        referenceId:
          id,

        description:
          `เตรียม Payroll Run ${run.run_code} จำนวน ${items.length} พนักงาน`,

        oldData:
          run,

        newData:
          updatedRun,
      });
    } catch (
      logError
    ) {
      console.error(
        "PAYROLL_RUN_PREPARE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        `เตรียมข้อมูล Payroll Run เรียบร้อย ${items.length} พนักงาน`,

      data: {
        run:
          updatedRun,

        employee_count:
          items.length,

        base_salary_total:
          baseSalaryTotal,
      },
    });
  } catch (error) {
    console.error(
      "PREPARE_PAYROLL_RUN_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(
        error
      ),
      getErrorStatus(
        error
      )
    );
  }
}
