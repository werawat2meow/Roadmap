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
  calculatePayrollRunItem,
  PAYROLL_ENGINE_CODE,
} from "@/lib/payroll/payrollRunEngine";

import {
  getActorId,
  jsonError,
  loadRun,
  mapDatabaseError,
  getErrorStatus,
} from "../../_helpers";

/* =========================================================
   POST /api/admin/payroll-runs/[id]/process
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
        "คุณไม่มีสิทธิ์ประมวลผล Payroll Run ของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      run.status !==
      "prepared"
    ) {
      return jsonError(
        "ต้อง Prepare Payroll Run ก่อนประมวลผล",
        400
      );
    }

    const {
      data: items,
      error:
        itemError,
    } =
      await supabaseAdmin
        .from(
          "payroll_run_items"
        )
        .select(
          `
            id,
            payroll_run_id,
            employee_id,
            employee_code,
            employee_name,
            base_salary,
            gross_amount,
            deduction_amount,
            net_amount,
            calculation_status,
            calculation_note,
            snapshot
          `
        )
        .eq(
          "payroll_run_id",
          id
        )
        .order(
          "employee_code",
          {
            ascending:
              true,
          }
        );

    if (itemError) {
      throw itemError;
    }

    if (
      !items ||
      items.length ===
      0
    ) {
      return jsonError(
        "Payroll Run ยังไม่มี Employee Snapshot กรุณา Prepare ใหม่",
        400
      );
    }

    const actorId =
      getActorId(
        guard
      );

    const startedAt =
      new Date()
        .toISOString();

    const {
      error:
        markProcessingError,
    } =
      await supabaseAdmin
        .from(
          "payroll_runs"
        )
        .update({
          status:
            "processing",

          is_locked:
            true,

          calculation_engine:
            PAYROLL_ENGINE_CODE,

          started_at:
            startedAt,

          updated_by:
            actorId,

          updated_at:
            startedAt,
        })
        .eq(
          "id",
          id
        );

    if (
      markProcessingError
    ) {
      throw markProcessingError;
    }

    const calculatedItems =
      items.map(
        (item) => {
          try {
            return {
              id:
                item.id,

              payroll_run_id:
                item.payroll_run_id,

              employee_id:
                item.employee_id,

              employee_code:
                item.employee_code,

              employee_name:
                item.employee_name,

              base_salary:
                item.base_salary,

              snapshot:
                item.snapshot || {},

              ...calculatePayrollRunItem(
                item
              ),

              updated_at:
                new Date()
                  .toISOString(),
            };
          } catch (
            error
          ) {
            return {
              id:
                item.id,

              payroll_run_id:
                item.payroll_run_id,

              employee_id:
                item.employee_id,

              employee_code:
                item.employee_code,

              employee_name:
                item.employee_name,

              base_salary:
                item.base_salary,

              snapshot:
                item.snapshot || {},

              gross_amount:
                null,

              deduction_amount:
                null,

              net_amount:
                null,

              calculation_status:
                "error",

              calculation_note:
                error?.message ||
                "ไม่สามารถคำนวณรายการพนักงานได้",

              updated_at:
                new Date()
                  .toISOString(),
            };
          }
        }
      );

    const CHUNK_SIZE =
      500;

    for (
      let index = 0;
      index <
      calculatedItems.length;
      index +=
        CHUNK_SIZE
    ) {
      const chunk =
        calculatedItems.slice(
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
          .upsert(
            chunk,
            {
              onConflict:
                "id",
            }
          );

      if (error) {
        throw error;
      }
    }

    const successful =
      calculatedItems.filter(
        (item) =>
          item
            .calculation_status ===
          "calculated"
      );

    const failed =
      calculatedItems.filter(
        (item) =>
          item
            .calculation_status ===
          "error"
      );

    const grossAmount =
      successful.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item
              .gross_amount ||
            0
          ),
        0
      );

    const deductionAmount =
      successful.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item
              .deduction_amount ||
            0
          ),
        0
      );

    const netAmount =
      successful.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item
              .net_amount ||
            0
          ),
        0
      );

    const completedAt =
      new Date()
        .toISOString();

    const finalStatus =
      failed.length >
      0
        ? "prepared"
        : "completed";

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
            finalStatus,

          calculation_engine:
            PAYROLL_ENGINE_CODE,

          calculated_count:
            successful.length,

          error_count:
            failed.length,

          gross_amount:
            grossAmount,

          deduction_amount:
            deductionAmount,

          net_amount:
            netAmount,

          completed_at:
            failed.length ===
            0
              ? completedAt
              : null,

          is_locked:
            failed.length ===
            0,

          updated_by:
            actorId,

          updated_at:
            completedAt,
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
     * Regular Run สำเร็จ = ปิด Lifecycle ของ Payroll Period
     */
    if (
      finalStatus ===
        "completed" &&
      run.run_type ===
        "regular"
    ) {
      const {
        error:
          periodError,
      } =
        await supabaseAdmin
          .from(
            "payroll_periods"
          )
          .update({
            status:
              "processed",

            is_locked:
              true,

            updated_at:
              completedAt,
          })
          .eq(
            "id",
            run.payroll_period_id
          );

      if (
        periodError
      ) {
        throw periodError;
      }
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
          finalStatus ===
          "completed"
            ? `ประมวลผล Payroll Run ${run.run_code} สำเร็จ ${successful.length} พนักงาน`
            : `ประมวลผล Payroll Run ${run.run_code} พบ Error ${failed.length} รายการ`,

        oldData:
          run,

        newData:
          updatedRun,
      });
    } catch (
      logError
    ) {
      console.error(
        "PAYROLL_RUN_PROCESS_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        finalStatus ===
        "completed"
          ? `ประมวลผลสำเร็จ ${successful.length} พนักงาน`
          : `ประมวลผลเสร็จ แต่พบ Error ${failed.length} รายการ กรุณาตรวจสอบแล้ว Prepare/Process ใหม่`,

      data: {
        run:
          updatedRun,

        calculated_count:
          successful.length,

        error_count:
          failed.length,

        gross_amount:
          grossAmount,

        deduction_amount:
          deductionAmount,

        net_amount:
          netAmount,

        engine:
          PAYROLL_ENGINE_CODE,
      },
    });
  } catch (error) {
    console.error(
      "PROCESS_PAYROLL_RUN_ERROR:",
      error
    );

    /*
     * พยายามคืน status เป็น prepared
     * เพื่อให้ User แก้ข้อมูลและ Run ใหม่ได้
     */
    try {
      const {
        id,
      } =
        await params;

      await supabaseAdmin
        .from(
          "payroll_runs"
        )
        .update({
          status:
            "prepared",

          is_locked:
            false,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
        )
        .eq(
          "status",
          "processing"
        );
    } catch {
      // no-op
    }

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
