// employee_status_change_history

import { NextResponse } from "next/server";

import {
  db,
  gate,
  safeError,
  authorizedEmployee,
  parseDate,
} from "@/lib/employeeMovements";

import {
  sendEmployeeStatusWebhook,
} from "@/lib/employeeMovementsWebhook";

/* =========================================================
   Employee Status Transitions
========================================================= */

const TRANSITIONS = {
  PRE_HIRE: ["PROBATION", "ACTIVE"],

  PROBATION: [
    "ACTIVE",
    "NOTICE",
    "RESIGNED",
    "SUSPENDED",
    "TERMINATED",
    "DISMISSED",
  ],

  ACTIVE: [
    "NOTICE",
    "RESIGNED",
    "SUSPENDED",
    "RETIRED",
    "TERMINATED",
    "DISMISSED",
  ],

  NOTICE: ["RESIGNED", "ACTIVE", "DISMISSED"],

  SUSPENDED: ["ACTIVE", "TERMINATED", "DISMISSED"],
};

/* =========================================================
   Helpers
========================================================= */

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fail = (error, status = 400) =>
  NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );

const todayTH = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const noticeDays = (code) => {
  const match = /^P(\d{1,2})$/i.exec(
    String(code || "").trim()
  );

  if (!match) return null;

  const p = Number(match[1]);

  return p >= 2 && p <= 6
    ? 15
    : p >= 7 && p <= 8
      ? 30
      : p >= 9 && p <= 10
        ? 60
        : null;
};

const addDays = (iso, count) => {
  const date = new Date(`${iso}T00:00:00Z`);

  date.setUTCDate(
    date.getUTCDate() + count
  );

  return date.toISOString().slice(0, 10);
};

/* =========================================================
   POST - Change Employee Status
========================================================= */

export async function POST(req) {
  try {
    /* -----------------------------------------------------
       Permission + Employee Scope
    ----------------------------------------------------- */

    const access = await gate(req, "edit");

    if (access.response) {
      return access.response;
    }

    /* -----------------------------------------------------
       Request Payload
    ----------------------------------------------------- */

    const body = await req.json();

    const {
      employee_id,
      expected_status_id,
      new_status_id,
      effective_date,
      last_working_day,
      reason,
      exit_reason_code,
      confirm_direct_exit,
    } = body || {};

    if (
      ![
        employee_id,
        expected_status_id,
        new_status_id,
      ].every(
        (value) =>
          typeof value === "string" &&
          UUID.test(value)
      ) ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.length > 1000 ||
      effective_date !== todayTH()
    ) {
      return fail(
        "กรุณาระบุสถานะ เหตุผล และวันที่มีผลเป็นวันนี้"
      );
    }

    /* -----------------------------------------------------
       Validate Employee Scope
    ----------------------------------------------------- */

    if (
      !(await authorizedEmployee(
        access.guard,
        employee_id
      ))
    ) {
      return fail(
        "ไม่มีสิทธิ์แก้ไขพนักงานรายนี้",
        403
      );
    }

    /* -----------------------------------------------------
       Load Employee
    ----------------------------------------------------- */

    const {
      data: employee,
      error: employeeError,
    } = await db
      .from("employees")
      .select(
        "id,employee_status_id,is_deleted,hire_date,resignation_date,position_level_id"
      )
      .eq("id", employee_id)
      .maybeSingle();

    if (employeeError) {
      throw employeeError;
    }

    if (!employee || employee.is_deleted) {
      return fail(
        "ไม่พบพนักงานที่ใช้งานอยู่",
        404
      );
    }

    if (
      employee.employee_status_id !==
      expected_status_id
    ) {
      return fail(
        "สถานะพนักงานเปลี่ยนไปแล้ว กรุณารีเฟรช",
        409
      );
    }

    /* -----------------------------------------------------
       Validate Status Transition
    ----------------------------------------------------- */

    const {
      data: statuses,
      error: statusError,
    } = await db
      .from("employee_statuses")
      .select("id,status_code,status")
      .in("id", [
        expected_status_id,
        new_status_id,
      ]);

    if (statusError) {
      throw statusError;
    }

    const current = statuses?.find(
      (status) =>
        status.id === expected_status_id
    );

    const next = statuses?.find(
      (status) =>
        status.id === new_status_id
    );

    if (
      !current ||
      !next ||
      next.status !== "active" ||
      !(
        TRANSITIONS[current.status_code] || []
      ).includes(next.status_code)
    ) {
      return fail(
        "ไม่อนุญาตให้เปลี่ยนสถานะคู่นี้"
      );
    }

    /* -----------------------------------------------------
       Hire Date Validation
    ----------------------------------------------------- */

    if (
      ["PROBATION", "ACTIVE"].includes(
        next.status_code
      ) &&
      (
        !employee.hire_date ||
        employee.hire_date > effective_date
      )
    ) {
      return fail(
        "ยังไม่ถึงวันเริ่มงานจริง"
      );
    }

    /* -----------------------------------------------------
       Notice Period Validation
    ----------------------------------------------------- */

    if (next.status_code === "NOTICE") {
      if (
        !parseDate(last_working_day) ||
        last_working_day < effective_date
      ) {
        return fail(
          "กรุณาระบุ Last Working Day ให้ถูกต้อง"
        );
      }

      if (!employee.position_level_id) {
        return fail(
          "ไม่พบระดับ P ของพนักงาน กรุณาตรวจสอบ Employee Master"
        );
      }

      const {
        data: level,
        error: levelError,
      } = await db
        .from("position_levels")
        .select("level_code")
        .eq(
          "id",
          employee.position_level_id
        )
        .maybeSingle();

      if (levelError) {
        throw levelError;
      }

      const days = noticeDays(
        level?.level_code
      );

      if (days === null) {
        return fail(
          "ระดับตำแหน่งต้องเป็น P2–P10 จึงจะยื่นลาออกตามเงื่อนไขนี้ได้"
        );
      }

      if (
        last_working_day <
        addDays(effective_date, days)
      ) {
        return fail(
          `ระดับ ${level.level_code} ต้องแจ้งล่วงหน้าอย่างน้อย ${days} วัน`
        );
      }
    }

    /* -----------------------------------------------------
       Direct Exit Validation
    ----------------------------------------------------- */

    const direct =
      next.status_code === "DISMISSED" &&
      ["ACTIVE", "PROBATION", "NOTICE", "SUSPENDED"].includes(
        current.status_code
      );

    const voluntaryDirectResignation =
      next.status_code === "RESIGNED" &&
      ["ACTIVE", "PROBATION"].includes(
        current.status_code
      );

    if (
      direct &&
      (
        ![
          "ABSENCE_OVER_3_DAYS",
          "OTHER",
        ].includes(exit_reason_code) ||
        confirm_direct_exit !== true
      )
    ) {
      return fail(
        "พ้นสภาพจากความผิดร้ายแรงต้องเลือกเหตุผลและยืนยันการตรวจสอบ"
      );
    }

    /* -----------------------------------------------------
       Last Working Day Validation
    ----------------------------------------------------- */

    if (
      next.status_code === "RESIGNED" &&
      !direct &&
      !voluntaryDirectResignation &&
      (
        !employee.resignation_date ||
        employee.resignation_date >
          effective_date
      )
    ) {
      return fail(
        "ยังไม่ถึงวันพ้นสภาพตาม Last Day ที่บันทึกไว้"
      );
    }

    /* -----------------------------------------------------
       Change Status Transaction

       Update:
       - employees.employee_status_id
       - employees.resignation_date (if applicable)
       - employee_status_change_history
    ----------------------------------------------------- */

    const { data, error } = await db.rpc(
      "ems_change_employee_status_v4",
      {
        p_employee_id: employee_id,

        p_expected_status_id:
          expected_status_id,

        p_new_status_id:
          new_status_id,

        p_effective_date:
          effective_date,

        p_reason:
          reason.trim(),

        p_actor_user_account_id:
          access.actor.user_account_id,

        p_last_working_day:
          next.status_code === "NOTICE"
            ? last_working_day || null
            : voluntaryDirectResignation
              ? effective_date
              : null,

        p_exit_reason_code:
          direct
            ? exit_reason_code
            : null,

        p_confirm_direct_exit:
          direct ? true : false,
      }
    );

    if (error) {
      throw error;
    }

    if (!data?.success) {
      return fail(
        ({
          STATUS_CHANGED:
            "สถานะเปลี่ยนไปแล้ว กรุณารีเฟรช",

          NOTICE_DAYS_NOT_MET:
            "Last Day ไม่ครบระยะเวลาแจ้งล่วงหน้า",

          LEVEL_REQUIRED:
            "ไม่พบระดับ P2–P10",

          EXIT_DATE_CONFLICT:
            "พบวันทำงานสุดท้ายเดิมค้างอยู่ กรุณาอัปเดต SQL Function ตามไฟล์แนบ",

          DIRECT_EXIT_CONFIRM_REQUIRED:
            "ยังไม่ได้ยืนยันพ้นสภาพโดยตรง",
        })[data?.error] ||
          data?.error ||
          "ไม่สามารถเปลี่ยนสถานะได้",

        data?.error === "STATUS_CHANGED"
          ? 409
          : 400
      );
    }

    /* -----------------------------------------------------
       Assets Webhook

       ส่งหลังเปลี่ยนสถานะสำเร็จเท่านั้น
       Webhook failure ไม่ทำให้ HRMS rollback
    ----------------------------------------------------- */

    let assetsWebhookStatus = "sent";

    try {
      await sendEmployeeStatusWebhook(
        employee_id
      );
    } catch (webhookError) {
      assetsWebhookStatus = "failed";

      console.error(
        "ASSETS_EMPLOYEE_STATUS_WEBHOOK_ERROR:",
        {
          employee_id,
          new_status_id,
          message:
            webhookError?.message ||
            "Unknown webhook error",
        }
      );
    }

    /* -----------------------------------------------------
       Response
    ----------------------------------------------------- */

    return NextResponse.json({
      success: true,

      message:
        "เปลี่ยนสถานะการทำงานสำเร็จ",

      data: {
        employee_id,

        employee_status_id:
          new_status_id,

        assets_webhook_status:
          assetsWebhookStatus,
      },
    });

  } catch (error) {
    return safeError(error);
  }
}

/* =========================================================
   GET - Change Status Policy Preview

   HR Edit + Employee Scope
========================================================= */

export async function GET(req) {
  try {
    const access = await gate(
      req,
      "edit"
    );

    if (access.response) {
      return access.response;
    }

    const id = new URL(
      req.url
    ).searchParams.get(
      "employee_id"
    );

    if (
      !id ||
      !UUID.test(id)
    ) {
      return fail(
        "รหัสพนักงานไม่ถูกต้อง"
      );
    }

    if (
      !(await authorizedEmployee(
        access.guard,
        id
      ))
    ) {
      return fail(
        "ไม่มีสิทธิ์ดูพนักงานรายนี้",
        403
      );
    }

    const {
      data: employee,
      error: employeeError,
    } = await db
      .from("employees")
      .select(
        "id,position_level_id"
      )
      .eq("id", id)
      .maybeSingle();

    if (employeeError) {
      throw employeeError;
    }

    if (!employee) {
      return fail(
        "ไม่พบพนักงาน",
        404
      );
    }

    let level = null;

    if (
      employee.position_level_id
    ) {
      const result = await db
        .from("position_levels")
        .select(
          "level_code,level_name"
        )
        .eq(
          "id",
          employee.position_level_id
        )
        .maybeSingle();

      if (result.error) {
        throw result.error;
      }

      level = result.data;
    }

    return NextResponse.json({
      success: true,

      data: {
        level_code:
          level?.level_code || null,

        level_name:
          level?.level_name || null,

        notice_required_days:
          noticeDays(
            level?.level_code
          ),
      },
    });

  } catch (error) {
    return safeError(error);
  }
}
