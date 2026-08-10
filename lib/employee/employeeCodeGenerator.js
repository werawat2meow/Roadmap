import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  cleanInteger,
  cleanText,
} from "./employeePayload";

const EMPLOYEE_CODE_RPC =
  "reserve_employee_code";

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function success(data) {
  return {
    success: true,
    data,
    message: null,
  };
}

function failure(
  message,
  error = null
) {
  return {
    success: false,
    data: null,
    message,
    error,
  };
}

/* =========================================================
   VALIDATE SETTING
========================================================= */

export async function getEmployeeCodeSetting({
  companyId,
  settingId,
  runningDate,
}) {
  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .select(
        `
          id,
          company_id,
          code_name,
          code_pattern,
          running_digits,
          year_digits,
          executive_digit,
          thai_digit,
          non_b_digit,
          myanmar_digit,
          parttime_digit,
          running_start,
          reset_policy,
          is_default,
          effective_date,
          expire_date,
          status
        `
      )
      .eq("id", settingId)
      .maybeSingle();

    if (error) {
      return failure(
        "ไม่สามารถตรวจสอบรูปแบบรหัสพนักงานได้",
        error
      );
    }

    if (!data) {
      return failure(
        "ไม่พบรูปแบบรหัสพนักงานที่เลือก"
      );
    }

    if (
      data.company_id !==
      companyId
    ) {
      return failure(
        "รูปแบบรหัสพนักงานไม่ได้อยู่ในบริษัทที่เลือก"
      );
    }

    if (
      data.status !== "active"
    ) {
      return failure(
        "รูปแบบรหัสพนักงานไม่ได้เปิดใช้งาน"
      );
    }

    if (
      data.effective_date &&
      runningDate <
        data.effective_date
    ) {
      return failure(
        "รูปแบบรหัสพนักงานยังไม่ถึงวันที่เริ่มใช้งาน"
      );
    }

    if (
      data.expire_date &&
      runningDate >
        data.expire_date
    ) {
      return failure(
        "รูปแบบรหัสพนักงานหมดอายุแล้ว"
      );
    }

    return success(data);
  } catch (error) {
    console.error(
      "getEmployeeCodeSetting exception:",
      error
    );

    return failure(
      "เกิดข้อผิดพลาดในการตรวจสอบรูปแบบรหัสพนักงาน",
      error
    );
  }
}

/* =========================================================
   RESERVE EMPLOYEE CODE
========================================================= */

export async function reserveEmployeeCode({
  companyId,
  settingId,
  employeeType,
  runningDate,
}) {
  try {
    const settingResult =
      await getEmployeeCodeSetting({
        companyId,
        settingId,
        runningDate,
      });

    if (!settingResult.success) {
      return settingResult;
    }

    const {
      data: rawData,
      error,
    } = await supabaseAdmin.rpc(
      EMPLOYEE_CODE_RPC,
      {
        p_company_id:
          companyId,

        p_employee_code_setting_id:
          settingId,

        p_employee_type:
          employeeType,

        p_running_date:
          runningDate,
      }
    );

    if (error) {
      console.error(
        "reserveEmployeeCode RPC error:",
        error
      );

      return failure(
        "ไม่สามารถสร้างรหัสพนักงานได้",
        error
      );
    }

    const result =
      Array.isArray(rawData)
        ? rawData[0]
        : rawData;

    const employeeCode =
      cleanText(
        result?.employee_code
      );

    const employeeTypeDigit =
      cleanText(
        result?.employee_type_digit
      );

    const employeeYear2d =
      cleanText(
        result?.employee_year_2d
      );

    const employeeRunningNo =
      cleanInteger(
        result?.employee_running_no,
        null
      );

    const employeeRunningId =
      cleanText(
        result?.employee_running_id
      ) || null;

    if (
      !employeeCode ||
      employeeRunningNo === null
    ) {
      console.error(
        "Invalid reserve_employee_code response:",
        rawData
      );

      return failure(
        "ผลลัพธ์จากระบบสร้างรหัสพนักงานไม่สมบูรณ์"
      );
    }

    return success({
      setting:
        settingResult.data,

      employee_code:
        employeeCode,

      employee_type_digit:
        employeeTypeDigit ||
        null,

      employee_year_2d:
        employeeYear2d ||
        null,

      employee_running_no:
        employeeRunningNo,

      employee_running_id:
        employeeRunningId,
    });
  } catch (error) {
    console.error(
      "reserveEmployeeCode exception:",
      error
    );

    return failure(
      "เกิดข้อผิดพลาดในการสร้างรหัสพนักงาน",
      error
    );
  }
}