import { NextResponse } from "next/server";

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
  normalizePayload,
  validatePayload,
  unsetOtherDefaults,
  loadSetting,
} from "../_helpers";

export async function GET(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.social_security",
        "view",
        {
          scopeType: "company",
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
      await loadSetting(id);

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบการตั้งค่าประกันสังคม",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์ดูข้อมูลประกันสังคมของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET_SOCIAL_SECURITY_DETAIL_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function PATCH(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.social_security",
        "edit",
        {
          scopeType: "company",
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
      await loadSetting(id);

    if (
      currentResult.error
    ) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบการตั้งค่าประกันสังคม",
        404
      );
    }

    const currentScopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์แก้ไขข้อมูลประกันสังคมของบริษัทนี้"
      );

    if (
      currentScopeError
    ) {
      return currentScopeError;
    }

    const body =
      await req
        .json()
        .catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
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
      validatePayload(payload);

    if (validationError) {
      return jsonError(
        validationError,
        400
      );
    }

    const targetScopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์ย้ายข้อมูลประกันสังคมไปยังบริษัทนี้"
      );

    if (
      targetScopeError
    ) {
      return targetScopeError;
    }

    const requestedDefault =
      payload.is_default;

    const actorId =
      getActorId(guard);

    const now =
      new Date()
        .toISOString();

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "social_security_settings"
        )
        .update({
          ...payload,
          is_default: false,
          updated_by:
            actorId,
          updated_at:
            now,
        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    if (requestedDefault) {
      await unsetOtherDefaults({
        companyId:
          payload.company_id,
        schemeType:
          payload.scheme_type,
        excludeId:
          id,
      });

      const {
        error: defaultError,
      } =
        await supabaseAdmin
          .from(
            "social_security_settings"
          )
          .update({
            is_default: true,
            updated_at:
              now,
          })
          .eq("id", id);

      if (defaultError) {
        throw defaultError;
      }

      data.is_default = true;
    }

    try {
      await writeActivityLog({
        moduleName:
          "social_security",
        actionType:
          "UPDATE",
        referenceTable:
          "social_security_settings",
        referenceId:
          id,
        description:
          `แก้ไขการตั้งค่าประกันสังคม ${data.setting_code} - ${data.setting_name}`,
        oldData:
          current,
        newData:
          data,
      });
    } catch (logError) {
      console.error(
        "SOCIAL_SECURITY_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขการตั้งค่าประกันสังคมเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "PATCH_SOCIAL_SECURITY_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function DELETE(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.social_security",
        "delete",
        {
          scopeType: "company",
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
      await loadSetting(id);

    if (
      currentResult.error
    ) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบการตั้งค่าประกันสังคม",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์ลบข้อมูลประกันสังคมของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      current.status !==
      "inactive"
    ) {
      return jsonError(
        "เพื่อรักษาประวัติ ลบได้เฉพาะรายการสถานะ Inactive เท่านั้น",
        400
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "social_security_settings"
        )
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "social_security",
        actionType:
          "DELETE",
        referenceTable:
          "social_security_settings",
        referenceId:
          id,
        description:
          `ลบการตั้งค่าประกันสังคม ${current.setting_code} - ${current.setting_name}`,
        oldData:
          current,
      });
    } catch (logError) {
      console.error(
        "SOCIAL_SECURITY_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "ลบการตั้งค่าประกันสังคมเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_SOCIAL_SECURITY_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
