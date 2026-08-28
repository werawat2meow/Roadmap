import { NextResponse } from "next/server";

export const runtime = "nodejs";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  parseEmployeeMigrationWorkbook,
  REQUIRED_EMPLOYEE_COLUMNS,
  validateEmployeeMigration,
} from "@/lib/imports/employeeMigration";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

function jsonError(
  error,
  status = 500,
  extra = {}
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...extra,
    },
    {
      status,
    }
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

export async function POST(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "data.import",
        "view",
        {
          scopeType:
            "employee",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

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

    const result =
      await validateEmployeeMigration({
        parsedRows:
          rows,

        scopeGuard:
          guard,
      });

    return NextResponse.json({
      success: true,

      mode:
        "employee_migration",

      preserve_employee_code:
        true,

      file_name:
        file.name,

      summary:
        result.summary,

      rows:
        result.rows.map(
          (item) => ({
            row_no:
              item.row_no,

            employee_code:
              item.employee_code,

            external_employee_id:
              item.external_employee_id,

            employee_name:
              [
                item.first_name_th,
                item.last_name_th,
              ]
                .filter(
                  Boolean
                )
                .join(" "),

            company_code:
              item.company_code,

            branch_code:
              item.branch_code,

            department_code:
              item.department_code,

            position_code:
              item.position_code,

            base_salary:
              item.base_salary,

            action:
              item.action,

            valid:
              item.valid,

            errors:
              item.errors,

            warnings:
              item.warnings,
          })
        ),
    });
  } catch (error) {
    console.error(
      "PREVIEW_EMPLOYEE_MIGRATION_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถตรวจสอบไฟล์ Employee Migration ได้",
      500
    );
  }
}
