import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import {
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  normalizePayload,
  validatePayload,
  loadPolicy,
  hasVersionChange,
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
        "policy.hr_policies",
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
    } = await params;

    const {
      data,
      error,
    } = await loadPolicy(id);

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบนโยบายบริษัท",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์ดูนโยบายของบริษัทนี้"
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
      "GET_HR_POLICY_ERROR:",
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
        "policy.hr_policies",
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
    } = await params;

    const currentResult =
      await loadPolicy(id);

    if (currentResult.error) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบนโยบายบริษัท",
        404
      );
    }

    const currentScopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์แก้ไขนโยบายของบริษัทนี้"
      );

    if (currentScopeError) {
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
        "คุณไม่มีสิทธิ์ย้ายนโยบายไปยังบริษัทนี้"
      );

    if (targetScopeError) {
      return targetScopeError;
    }

    const actorId =
      getActorId(guard);

    const now =
      new Date().toISOString();

    const currentVersion =
      current.current_version;

    const versionChanged =
      hasVersionChange(
        currentVersion,
        payload
      );

    let nextVersionNo =
      Number(
        current.current_version_no ||
        1
      );

    if (versionChanged) {
      nextVersionNo += 1;
    }

    const {
      data: updated,
      error: updateError,
    } = await supabaseAdmin
      .from("hr_policies")
      .update({
        company_id:
          payload.company_id,
        policy_code:
          payload.policy_code,
        policy_name:
          payload.policy_name,
        policy_category:
          payload.policy_category,
        description:
          payload.description,
        owner_department:
          payload.owner_department,
        status:
          payload.status,
        current_version_no:
          nextVersionNo,
        effective_date:
          payload.effective_date,
        expire_date:
          payload.expire_date,
        is_mandatory:
          payload.is_mandatory,
        updated_by:
          actorId,
        updated_at:
          now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    let version =
      currentVersion;

    if (versionChanged) {
      if (
        currentVersion?.id &&
        currentVersion.status ===
          "published"
      ) {
        const {
          error:
            archiveError,
        } = await supabaseAdmin
          .from(
            "hr_policy_versions"
          )
          .update({
            status: "archived",
          })
          .eq(
            "id",
            currentVersion.id
          );

        if (archiveError) {
          throw archiveError;
        }
      }

      const published =
        payload.status ===
        "published";

      const {
        data:
          createdVersion,
        error:
          versionError,
      } = await supabaseAdmin
        .from(
          "hr_policy_versions"
        )
        .insert({
          policy_id: id,
          version_no:
            nextVersionNo,
          version_title:
            payload.version_title,
          content:
            payload.content,
          change_summary:
            payload.change_summary,
          status:
            payload.status,
          effective_date:
            payload.effective_date,
          expire_date:
            payload.expire_date,
          published_at:
            published
              ? now
              : null,
          published_by:
            published
              ? actorId
              : null,
          created_by:
            actorId,
        })
        .select("*")
        .single();

      if (versionError) {
        throw versionError;
      }

      version =
        createdVersion;
    }

    try {
      await writeActivityLog({
        moduleName:
          "hr_policies",
        actionType:
          "UPDATE",
        referenceTable:
          "hr_policies",
        referenceId: id,
        description:
          `แก้ไขนโยบายบริษัท ${updated.policy_code} - ${updated.policy_name}`,
        oldData: current,
        newData: {
          ...updated,
          current_version:
            version,
          created_new_version:
            versionChanged,
        },
      });
    } catch (logError) {
      console.error(
        "HR_POLICY_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        versionChanged
          ? `แก้ไขนโยบายและสร้าง Version ${nextVersionNo} เรียบร้อยแล้ว`
          : "แก้ไขข้อมูลนโยบายเรียบร้อยแล้ว",
      data: {
        ...updated,
        current_version:
          version,
      },
    });
  } catch (error) {
    console.error(
      "PATCH_HR_POLICY_ERROR:",
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
        "policy.hr_policies",
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
    } = await params;

    const currentResult =
      await loadPolicy(id);

    if (currentResult.error) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบนโยบายบริษัท",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์ลบนโยบายของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (
      current.status !== "draft"
    ) {
      return jsonError(
        "เพื่อรักษาประวัติ ลบได้เฉพาะนโยบายสถานะ Draft เท่านั้น",
        400
      );
    }

    const {
      error,
    } = await supabaseAdmin
      .from("hr_policies")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "hr_policies",
        actionType:
          "DELETE",
        referenceTable:
          "hr_policies",
        referenceId: id,
        description:
          `ลบนโยบายบริษัท ${current.policy_code} - ${current.policy_name}`,
        oldData: current,
      });
    } catch (logError) {
      console.error(
        "HR_POLICY_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "ลบนโยบายบริษัทเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_HR_POLICY_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
