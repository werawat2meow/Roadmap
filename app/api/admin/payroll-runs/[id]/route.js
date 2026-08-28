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
  RUN_TYPES,
  cleanText,
  cleanNullableText,
  cleanCode,
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  loadRun,
  validatePeriod,
} from "../_helpers";

function normalizePayload(
  body,
  current
) {
  return {
    company_id:
      cleanText(
        body.company_id ??
        current.company_id
      ),

    payroll_period_id:
      cleanText(
        body.payroll_period_id ??
        current.payroll_period_id
      ),

    run_code:
      cleanCode(
        body.run_code ??
        current.run_code
      ),

    run_name:
      cleanText(
        body.run_name ??
        current.run_name
      ),

    run_type:
      cleanText(
        body.run_type ??
        current.run_type
      ),

    remark:
      cleanNullableText(
        body.remark ??
        current.remark
      ),
  };
}

function validatePayload(
  payload
) {
  if (
    !payload.company_id
  ) {
    return "กรุณาเลือกบริษัท";
  }

  if (
    !payload.payroll_period_id
  ) {
    return "กรุณาเลือกงวดเงินเดือน";
  }

  if (
    !payload.run_code
  ) {
    return "กรุณากรอกรหัส Payroll Run";
  }

  if (
    !payload.run_name
  ) {
    return "กรุณากรอกชื่อ Payroll Run";
  }

  if (
    !RUN_TYPES.includes(
      payload.run_type
    )
  ) {
    return "ประเภท Payroll Run ไม่ถูกต้อง";
  }

  return null;
}

/* =========================================================
   GET /api/admin/payroll-runs/[id]
========================================================= */

export async function GET(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_runs",
        "view",
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

    const {
      data,
      error,
    } =
      await loadRun(
        id
      );

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบ Payroll Run",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์ดู Payroll Run ของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    return NextResponse.json({
      success:
        true,
      data,
    });
  } catch (error) {
    console.error(
      "GET_PAYROLL_RUN_ERROR:",
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

/* =========================================================
   PATCH /api/admin/payroll-runs/[id]
   แก้ได้เฉพาะ Draft
========================================================= */

export async function PATCH(
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

    const currentResult =
      await loadRun(
        id
      );

    if (
      currentResult.error
    ) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบ Payroll Run",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์แก้ไข Payroll Run ของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      current.status !==
      "draft"
    ) {
      return jsonError(
        "แก้ไขได้เฉพาะ Payroll Run สถานะ Draft เท่านั้น",
        400
      );
    }

    if (
      current.is_locked
    ) {
      return jsonError(
        "Payroll Run นี้ถูก Lock แล้ว",
        400
      );
    }

    const body =
      await req
        .json()
        .catch(
          () => null
        );

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(
        body
      )
    ) {
      return jsonError(
        "Request Body ไม่ถูกต้อง",
        400
      );
    }

    const payload =
      normalizePayload(
        body,
        current
      );

    const validationError =
      validatePayload(
        payload
      );

    if (
      validationError
    ) {
      return jsonError(
        validationError,
        400
      );
    }

    const targetScopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์ย้าย Payroll Run ไปยังบริษัทนี้"
      );

    if (
      targetScopeError
    ) {
      return targetScopeError;
    }

    const periodValidation =
      await validatePeriod({
        companyId:
          payload.company_id,

        payrollPeriodId:
          payload.payroll_period_id,

        requireOpen:
          false,
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

    if (
      period.status ===
      "processed"
    ) {
      return jsonError(
        "งวดเงินเดือนนี้ประมวลผลเสร็จแล้ว",
        400
      );
    }

    const actorId =
      getActorId(
        guard
      );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "payroll_runs"
        )
        .update({
          company_id:
            payload.company_id,

          payroll_period_id:
            payload.payroll_period_id,

          payroll_group_id:
            period.payroll_group_id,

          run_code:
            payload.run_code,

          run_name:
            payload.run_name,

          run_type:
            payload.run_type,

          remark:
            payload.remark,

          updated_by:
            actorId,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
        )
        .select(
          `
            *,
            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            ),
            payroll_periods:payroll_period_id (
              id,
              period_code,
              period_name,
              period_year,
              period_no,
              payment_date,
              status
            ),
            payroll_groups:payroll_group_id (
              id,
              payroll_group_code,
              payroll_group_name
            )
          `
        )
        .single();

    if (error) {
      throw error;
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
          `แก้ไข Payroll Run ${data.run_code} - ${data.run_name}`,

        oldData:
          current,

        newData:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "PAYROLL_RUN_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไข Payroll Run เรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_PAYROLL_RUN_ERROR:",
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

/* =========================================================
   DELETE /api/admin/payroll-runs/[id]
   ลบได้เฉพาะ Draft
========================================================= */

export async function DELETE(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_runs",
        "delete",
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

    const currentResult =
      await loadRun(
        id
      );

    if (
      currentResult.error
    ) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบ Payroll Run",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์ลบ Payroll Run ของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      current.status !==
      "draft"
    ) {
      return jsonError(
        "ลบได้เฉพาะ Payroll Run สถานะ Draft เท่านั้น",
        400
      );
    }

    if (
      current.is_locked
    ) {
      return jsonError(
        "Payroll Run นี้ถูก Lock แล้ว",
        400
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "payroll_runs"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "payroll_runs",

        actionType:
          "DELETE",

        referenceTable:
          "payroll_runs",

        referenceId:
          id,

        description:
          `ลบ Payroll Run ${current.run_code} - ${current.run_name}`,

        oldData:
          current,
      });
    } catch (
      logError
    ) {
      console.error(
        "PAYROLL_RUN_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "ลบ Payroll Run เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_PAYROLL_RUN_ERROR:",
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
