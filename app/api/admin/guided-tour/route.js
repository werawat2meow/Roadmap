import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  getCurrentUserAccountId,
} from "@/lib/auth/getCurrentUserAccountId";

const DEFAULT_TOUR_CODE =
  "portal_intro";

const DEFAULT_TOUR_VERSION =
  1;

const ALLOWED_STATUSES =
  new Set([
    "started",
    "completed",
    "skipped",
  ]);

function cleanText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeVersion(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(
      number
    ) ||
    number < 1
  ) {
    return DEFAULT_TOUR_VERSION;
  }

  return number;
}

/* =========================================================
   GET
   อ่านสถานะ Tour ของ User ปัจจุบัน
========================================================= */

export async function GET(
  req
) {
  try {
    const userAccountId =
      await getCurrentUserAccountId();

    if (!userAccountId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const tourCode =
      cleanText(
        searchParams.get(
          "tour_code"
        )
      ) ||
      DEFAULT_TOUR_CODE;

    const tourVersion =
      normalizeVersion(
        searchParams.get(
          "tour_version"
        )
      );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "user_onboarding_progress"
        )
        .select(
          `
            id,
            user_account_id,
            tour_code,
            tour_version,
            status,
            current_step,
            started_at,
            completed_at,
            skipped_at,
            created_at,
            updated_at
          `
        )
        .eq(
          "user_account_id",
          userAccountId
        )
        .eq(
          "tour_code",
          tourCode
        )
        .eq(
          "tour_version",
          tourVersion
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,

      data:
        data || null,

      should_open:
        !data ||
        data.status ===
          "started",

      tour_code:
        tourCode,

      tour_version:
        tourVersion,
    });
  } catch (error) {
    console.error(
      "GET_GUIDED_TOUR_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดสถานะ Guided Tour ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
   started / completed / skipped / current step
========================================================= */

export async function PATCH(
  req
) {
  try {
    const userAccountId =
      await getCurrentUserAccountId();

    if (!userAccountId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const tourCode =
      cleanText(
        body?.tour_code
      ) ||
      DEFAULT_TOUR_CODE;

    const tourVersion =
      normalizeVersion(
        body?.tour_version
      );

    const status =
      cleanText(
        body?.status
      ).toLowerCase();

    if (
      !ALLOWED_STATUSES.has(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "สถานะ Guided Tour ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const currentStep =
      Math.max(
        Number.parseInt(
          String(
            body?.current_step ??
              0
          ),
          10
        ) || 0,
        0
      );

    const now =
      new Date()
        .toISOString();

    const payload = {
      user_account_id:
        userAccountId,

      tour_code:
        tourCode,

      tour_version:
        tourVersion,

      status,

      current_step:
        currentStep,

      updated_at:
        now,
    };

    if (
      status ===
      "started"
    ) {
      payload.started_at =
        now;

      payload.completed_at =
        null;

      payload.skipped_at =
        null;
    }

    if (
      status ===
      "completed"
    ) {
      payload.completed_at =
        now;
    }

    if (
      status ===
      "skipped"
    ) {
      payload.skipped_at =
        now;
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "user_onboarding_progress"
        )
        .upsert(
          payload,
          {
            onConflict:
              "user_account_id,tour_code,tour_version",
          }
        )
        .select(
          `
            id,
            tour_code,
            tour_version,
            status,
            current_step,
            started_at,
            completed_at,
            skipped_at,
            updated_at
          `
        )
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "PATCH_GUIDED_TOUR_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถบันทึกสถานะ Guided Tour ได้",
      },
      {
        status: 500,
      }
    );
  }
}
