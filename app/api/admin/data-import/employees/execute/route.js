import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
  EMPLOYEE_IMPORT_TYPE,
  executeEmployeeMigrationRow,
  mapWithConcurrency,
  parseEmployeeMigrationWorkbook,
  REQUIRED_EMPLOYEE_COLUMNS,
  validateEmployeeMigration,
} from "@/lib/imports/employeeMigration";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

function jsonError(
  error,
  status = 500
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
    }
  );
}

function getActorId(
  guard
) {
  return (
    guard?.access
      ?.user_account_id ||
    guard?.access
      ?.user?.id ||
    guard?.user?.id ||
    null
  );
}

function isExcelFile(
  file
) {
  const name =
    String(
      file?.name || ""
    ).toLowerCase();

  return (
    name.endsWith(
      ".xlsx"
    ) ||
    name.endsWith(
      ".xls"
    )
  );
}

async function insertAuditRows(
  rows
) {
  const chunkSize = 200;

  for (
    let index = 0;
    index < rows.length;
    index += chunkSize
  ) {
    const chunk =
      rows.slice(
        index,
        index +
          chunkSize
      );

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "data_import_rows"
        )
        .insert(
          chunk
        );

    if (error) {
      throw error;
    }
  }
}

export async function POST(
  req
) {
  let jobId = null;

  try {
    /*
     * Preview/Read Scope
     */
    const viewGuard =
      await requireScopedAccess(
        "data.import",
        "view",
        {
          scopeType:
            "employee",
        }
      );

    if (!viewGuard.ok) {
      return viewGuard.response;
    }

    /*
     * Action Permissions
     * create = INSERT พนักงานใหม่
     * edit   = UPDATE พนักงานเดิม
     */
    const [
      createGuard,
      editGuard,
    ] =
      await Promise.all([
        requireScopedAccess(
          "data.import",
          "create",
          {
            scopeType:
              "employee",
          }
        ),

        requireScopedAccess(
          "data.import",
          "edit",
          {
            scopeType:
              "employee",
          }
        ),
      ]);

    const formData =
      await req.formData();

    const file =
      formData.get(
        "file"
      );

    if (
      !file ||
      typeof file.arrayBuffer !==
        "function"
    ) {
      return jsonError(
        "กรุณาเลือกไฟล์ Excel",
        400
      );
    }

    if (
      !isExcelFile(
        file
      )
    ) {
      return jsonError(
        "รองรับเฉพาะไฟล์ .xlsx หรือ .xls",
        400
      );
    }

    if (
      Number(
        file.size || 0
      ) >
      MAX_FILE_SIZE
    ) {
      return jsonError(
        "ไฟล์มีขนาดเกิน 10 MB",
        400
      );
    }

    const buffer =
      await file.arrayBuffer();

    const {
      headers,
      rows,
    } =
      parseEmployeeMigrationWorkbook(
        buffer
      );

    const missingColumns =
      REQUIRED_EMPLOYEE_COLUMNS.filter(
        (column) =>
          !headers.includes(
            column
          )
      );

    if (
      missingColumns.length
    ) {
      return jsonError(
        `Template ไม่ถูกต้อง ไม่พบคอลัมน์: ${missingColumns.join(", ")}`,
        400
      );
    }

    if (!rows.length) {
      return jsonError(
        "ไม่พบข้อมูลพนักงานใน Sheet Employees",
        400
      );
    }

    if (
      rows.length >
      5000
    ) {
      return jsonError(
        "หนึ่งไฟล์นำเข้าได้ไม่เกิน 5,000 คน",
        400
      );
    }

    /*
     * Re-validate ฝั่ง Server ก่อน Import จริงเสมอ
     */
    const validation =
      await validateEmployeeMigration({
        parsedRows:
          rows,

        scopeGuard:
          viewGuard,
      });

    /*
     * ตรวจ Permission + Action Scope ต่อแถว
     */
    for (
      const row of
        validation.rows
    ) {
      if (!row.valid) {
        continue;
      }

      if (
        row.action ===
        "insert"
      ) {
        if (!createGuard.ok) {
          row.errors.push(
            "คุณไม่มี Permission data.import.create สำหรับเพิ่มพนักงานใหม่"
          );

          row.valid = false;
          continue;
        }

        if (
          !createGuard.canAccessEmployee(
            row.employee_payload
          )
        ) {
          row.errors.push(
            "ไม่มี Create Scope สำหรับโครงสร้างองค์กรของพนักงานรายนี้"
          );

          row.valid = false;
        }
      }

      if (
        row.action ===
        "update"
      ) {
        if (!editGuard.ok) {
          row.errors.push(
            "คุณไม่มี Permission data.import.edit สำหรับอัปเดตพนักงานเดิม"
          );

          row.valid = false;
          continue;
        }

        if (
          !editGuard.canAccessEmployee(
            row.employee_payload
          )
        ) {
          row.errors.push(
            "ไม่มี Edit Scope สำหรับโครงสร้างองค์กรปลายทางของพนักงานรายนี้"
          );

          row.valid = false;
        }
      }
    }

    const actorId =
      getActorId(
        viewGuard
      );

    const validRows =
      validation.rows.filter(
        (item) =>
          item.valid
      );

    const invalidRows =
      validation.rows.filter(
        (item) =>
          !item.valid
      );

    /*
     * Create Audit Job
     */
    const {
      data:
        job,
      error:
        jobError,
    } =
      await supabaseAdmin
        .from(
          "data_import_jobs"
        )
        .insert({
          import_type:
            EMPLOYEE_IMPORT_TYPE,

          file_name:
            file.name,

          status:
            "processing",

          total_rows:
            validation.rows
              .length,

          valid_rows:
            validRows.length,

          invalid_rows:
            invalidRows.length,

          created_by:
            actorId,

          started_at:
            new Date()
              .toISOString(),
        })
        .select(
          "id"
        )
        .single();

    if (jobError) {
      throw jobError;
    }

    jobId =
      job.id;

    /*
     * Import เฉพาะ Row ที่ Validate ผ่าน
     * จำกัด concurrency เพื่อไม่ยิง DB หนักเกินไป
     */
    const executeResults =
      await mapWithConcurrency(
        validRows,
        5,
        async (
          row
        ) => {
          try {
            const result =
              await executeEmployeeMigrationRow({
                row,
                actorId,
              });

            return {
              success: true,
              row,
              result,
            };
          } catch (error) {
            return {
              success: false,
              row,
              error:
                error?.message ||
                "Import failed",
            };
          }
        }
      );

    const auditRows = [];

    for (
      const row of
        invalidRows
    ) {
      auditRows.push({
        import_job_id:
          jobId,

        row_no:
          row.row_no,

        employee_code:
          row.employee_code ||
          null,

        external_employee_id:
          row.external_employee_id ||
          null,

        action:
          "skip",

        status:
          "invalid",

        error_messages:
          row.errors ||
          [],

        warning_messages:
          row.warnings ||
          [],

        employee_id:
          row.existing_employee_id ||
          null,
      });
    }

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (
      const item of
        executeResults
    ) {
      const row =
        item.row;

      if (
        item.success
      ) {
        if (
          row.action ===
          "insert"
        ) {
          inserted += 1;
        } else {
          updated += 1;
        }

        auditRows.push({
          import_job_id:
            jobId,

          row_no:
            row.row_no,

          employee_code:
            row.employee_code,

          external_employee_id:
            row.external_employee_id ||
            null,

          action:
            row.action,

          status:
            "imported",

          error_messages:
            [],

          warning_messages:
            row.warnings ||
            [],

          employee_id:
            item.result
              .employee_id,
        });
      } else {
        failed += 1;

        auditRows.push({
          import_job_id:
            jobId,

          row_no:
            row.row_no,

          employee_code:
            row.employee_code ||
            null,

          external_employee_id:
            row.external_employee_id ||
            null,

          action:
            row.action,

          status:
            "failed",

          error_messages: [
            item.error,
          ],

          warning_messages:
            row.warnings ||
            [],

          employee_id:
            row.existing_employee_id ||
            null,
        });
      }
    }

    await insertAuditRows(
      auditRows
    );

    const completedWithErrors =
      invalidRows.length >
        0 ||
      failed >
        0;

    const {
      error:
        updateJobError,
    } =
      await supabaseAdmin
        .from(
          "data_import_jobs"
        )
        .update({
          status:
            completedWithErrors
              ? "completed_with_errors"
              : "completed",

          inserted_rows:
            inserted,

          updated_rows:
            updated,

          skipped_rows:
            invalidRows.length,

          failed_rows:
            failed,

          completed_at:
            new Date()
              .toISOString(),

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          jobId
        );

    if (
      updateJobError
    ) {
      throw updateJobError;
    }

    try {
      await writeActivityLog({
        moduleName:
          "data_import",

        actionType:
          "IMPORT",

        referenceTable:
          "data_import_jobs",

        referenceId:
          jobId,

        description:
          `Employee Migration ${file.name}: INSERT ${inserted}, UPDATE ${updated}, SKIP ${invalidRows.length}, FAILED ${failed}`,

        oldData:
          null,

        newData: {
          import_type:
            EMPLOYEE_IMPORT_TYPE,

          file_name:
            file.name,

          total:
            validation.rows
              .length,

          inserted,
          updated,

          skipped:
            invalidRows.length,

          failed,
        },
      });
    } catch (
      logError
    ) {
      console.error(
        "EMPLOYEE_IMPORT_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        completedWithErrors
          ? "นำเข้าข้อมูลเสร็จแล้ว แต่มีบางรายการที่ถูกข้ามหรือเกิดข้อผิดพลาด"
          : "นำเข้าพนักงานจากระบบเก่าเรียบร้อยแล้ว",

      job_id:
        jobId,

      preserve_employee_code:
        true,

      summary: {
        total:
          validation.rows
            .length,

        inserted,

        updated,

        skipped:
          invalidRows.length,

        failed,
      },

      errors:
        auditRows
          .filter(
            (item) =>
              item.status ===
                "invalid" ||
              item.status ===
                "failed"
          )
          .slice(
            0,
            200
          ),
    });
  } catch (error) {
    console.error(
      "EXECUTE_EMPLOYEE_MIGRATION_ERROR:",
      error
    );

    if (jobId) {
      try {
        await supabaseAdmin
          .from(
            "data_import_jobs"
          )
          .update({
            status:
              "failed",

            completed_at:
              new Date()
                .toISOString(),

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            jobId
          );
      } catch {
        // ignore audit recovery error
      }
    }

    return jsonError(
      error?.message ||
        "ไม่สามารถนำเข้าพนักงานจากระบบเก่าได้",
      500
    );
  }
}
