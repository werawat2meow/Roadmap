import { NextResponse } from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

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

export async function GET(
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

    const {
      searchParams,
    } =
      new URL(req.url);

    const page =
      Math.max(
        Number(
          searchParams.get(
            "page"
          )
        ) ||
          1,
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          Number(
            searchParams.get(
              "pageSize"
            )
          ) ||
            20,
          1
        ),
        100
      );

    let query =
      supabaseAdmin
        .from(
          "data_import_jobs"
        )
        .select(
          `
            id,
            import_type,
            file_name,
            status,
            total_rows,
            valid_rows,
            invalid_rows,
            inserted_rows,
            updated_rows,
            skipped_rows,
            failed_rows,
            created_by,
            started_at,
            completed_at,
            created_at
          `,
          {
            count:
              "exact",
          }
        )
        .eq(
          "import_type",
          "employee_migration"
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    /*
     * Job ไม่ได้มี Organization FK โดยตรง
     * User ที่ไม่ใช่ All Scope จึงเห็นเฉพาะ Import Job ของตัวเอง
     */
    if (
      !guard.hasAllScope
    ) {
      query =
        query.eq(
          "created_by",
          getActorId(
            guard
          )
        );
    }

    const from =
      (page - 1) *
      pageSize;

    const to =
      from +
      pageSize -
      1;

    const {
      data,
      error,
      count,
    } =
      await query.range(
        from,
        to
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,

      data:
        data || [],

      pagination: {
        page,
        pageSize,
        total:
          count || 0,

        totalPages:
          Math.ceil(
            (count || 0) /
              pageSize
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET_EMPLOYEE_IMPORT_HISTORY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดประวัติการนำเข้าได้",
      },
      {
        status: 500,
      }
    );
  }
}
