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
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  normalizeHeader,
  normalizeBrackets,
  validateHeader,
  validateBrackets,
  unsetOtherDefaults,
  loadTaxRateSet,
} from "../_helpers";

/* =========================================================
   GET /api/admin/tax-rates/[id]
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
        "ems.tax_rates",
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
      await loadTaxRateSet(
        id
      );

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบชุดอัตราภาษี",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์ดูอัตราภาษีของบริษัทนี้"
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
      "GET_TAX_RATE_ERROR:",
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
   PATCH /api/admin/tax-rates/[id]
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
        "ems.tax_rates",
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
      await loadTaxRateSet(
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
        "ไม่พบชุดอัตราภาษี",
        404
      );
    }

    const currentScopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์แก้ไขอัตราภาษีของบริษัทนี้"
      );

    if (
      currentScopeError
    ) {
      return currentScopeError;
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

    const header =
      normalizeHeader(
        body,
        current
      );

    const brackets =
      normalizeBrackets(
        body.brackets ??
        current.brackets
      );

    const headerError =
      validateHeader(
        header
      );

    if (headerError) {
      return jsonError(
        headerError,
        400
      );
    }

    const bracketError =
      validateBrackets(
        brackets,
        header
          .calculation_method
      );

    if (bracketError) {
      return jsonError(
        bracketError,
        400
      );
    }

    const targetScopeError =
      guard.assertAccessId(
        header.company_id,
        "คุณไม่มีสิทธิ์ย้ายชุดอัตราภาษีไปยังบริษัทนี้"
      );

    if (
      targetScopeError
    ) {
      return targetScopeError;
    }

    const requestedDefault =
      header.is_default;

    const actorId =
      getActorId(
        guard
      );

    const now =
      new Date()
        .toISOString();

    const {
      data: updated,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "tax_rate_sets"
        )
        .update({
          ...header,

          /*
           * จัด Default หลังบันทึก Detail สำเร็จ
           * เพื่อลดความเสี่ยงยกเลิก Default ชุดเดิม
           * ก่อน Save หลักเสร็จ
           */
          is_default:
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

    if (updateError) {
      throw updateError;
    }

    /*
     * Replace detail rows
     * Header + brackets ถูก Validate ครบก่อนถึงจุดนี้
     */
    const {
      error:
        deleteBracketError,
    } =
      await supabaseAdmin
        .from(
          "tax_rate_brackets"
        )
        .delete()
        .eq(
          "tax_rate_set_id",
          id
        );

    if (
      deleteBracketError
    ) {
      throw deleteBracketError;
    }

    const {
      error:
        insertBracketError,
    } =
      await supabaseAdmin
        .from(
          "tax_rate_brackets"
        )
        .insert(
          brackets.map(
            (item) => ({
              ...item,

              tax_rate_set_id:
                id,

              updated_at:
                now,
            })
          )
        );

    if (
      insertBracketError
    ) {
      throw insertBracketError;
    }

    if (
      requestedDefault
    ) {
      await unsetOtherDefaults({
        companyId:
          header.company_id,

        taxYear:
          header.tax_year,

        excludeId:
          id,
      });

      const {
        error:
          defaultError,
      } =
        await supabaseAdmin
          .from(
            "tax_rate_sets"
          )
          .update({
            is_default:
              true,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            id
          );

      if (defaultError) {
        throw defaultError;
      }

      updated.is_default =
        true;
    }

    try {
      await writeActivityLog({
        moduleName:
          "tax_rates",

        actionType:
          "UPDATE",

        referenceTable:
          "tax_rate_sets",

        referenceId:
          id,

        description:
          `แก้ไขชุดอัตราภาษี ${updated.tax_rate_code} - ${updated.tax_rate_name}`,

        oldData:
          current,

        newData: {
          ...updated,
          brackets,
        },
      });
    } catch (logError) {
      console.error(
        "TAX_RATE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไขชุดอัตราภาษีเรียบร้อยแล้ว",

      data: {
        ...updated,
        brackets,
      },
    });
  } catch (error) {
    console.error(
      "PATCH_TAX_RATE_ERROR:",
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
   DELETE /api/admin/tax-rates/[id]
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
        "ems.tax_rates",
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
      await loadTaxRateSet(
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
        "ไม่พบชุดอัตราภาษี",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์ลบอัตราภาษีของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      current.status !==
      "inactive"
    ) {
      return jsonError(
        "เพื่อรักษาประวัติอัตราภาษี ลบได้เฉพาะชุดที่เป็น Inactive เท่านั้น",
        400
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "tax_rate_sets"
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
          "tax_rates",

        actionType:
          "DELETE",

        referenceTable:
          "tax_rate_sets",

        referenceId:
          id,

        description:
          `ลบชุดอัตราภาษี ${current.tax_rate_code} - ${current.tax_rate_name}`,

        oldData:
          current,
      });
    } catch (logError) {
      console.error(
        "TAX_RATE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "ลบชุดอัตราภาษีเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_TAX_RATE_ERROR:",
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
