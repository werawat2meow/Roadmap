import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function success(data = {}) {
  return {
    success: true,
    data,
    message: null,
    error: null,
  };
}

function failure(
  message,
  error = null,
  status = 400
) {
  return {
    success: false,
    data: null,
    message,
    error,
    status,
  };
}

/* =========================================================
   HELPERS
========================================================= */

function isActive(record) {
  return (
    !record?.status ||
    record.status === "active"
  );
}

function getDatabaseErrorStatus(error) {
  if (!error) {
    return 500;
  }

  if (
    error.code === "22P02" ||
    error.code === "23503" ||
    error.code === "23514"
  ) {
    return 400;
  }

  if (error.code === "23505") {
    return 409;
  }

  return 500;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function isDateInEffectiveRange(
  targetDateValue,
  effectiveDateValue,
  expireDateValue
) {
  const targetDate =
    parseDate(targetDateValue);

  const effectiveDate =
    parseDate(effectiveDateValue);

  const expireDate =
    parseDate(expireDateValue);

  if (!targetDate) {
    return true;
  }

  if (
    effectiveDate &&
    targetDate < effectiveDate
  ) {
    return false;
  }

  if (
    expireDate &&
    targetDate > expireDate
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   VALIDATE PAYROLL COMPANY
========================================================= */

async function validatePayrollCompany(
  employee
) {
  /* -----------------------------------------------------
     Payroll Company ไม่บังคับ
  ----------------------------------------------------- */

  if (
    !employee.payroll_company_id
  ) {
    return success({
      payrollCompany: null,
    });
  }

  /* -----------------------------------------------------
     Load Payroll Company

     payroll_companies:
     - id
     - payroll_company_code
     - payroll_company_name
     - company_id
     - payroll_type_id
     - payment_day
     - status
  ----------------------------------------------------- */

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(
      "payroll_companies"
    )
    .select(
      `
        id,
        payroll_company_code,
        payroll_company_name,
        company_id,
        payroll_type_id,
        payment_day,
        status
      `
    )
    .eq(
      "id",
      employee.payroll_company_id
    )
    .maybeSingle();

  /* -----------------------------------------------------
     Database Error
  ----------------------------------------------------- */

  if (error) {
    return failure(
      "ไม่สามารถตรวจสอบบริษัทเงินเดือนได้",
      error,
      getDatabaseErrorStatus(
        error
      )
    );
  }

  /* -----------------------------------------------------
     Not Found
  ----------------------------------------------------- */

  if (!data) {
    return failure(
      "ไม่พบบริษัทเงินเดือนที่เลือก",
      null,
      404
    );
  }

  /* -----------------------------------------------------
     Active
  ----------------------------------------------------- */

  if (
    !isActive(data)
  ) {
    return failure(
      "บริษัทเงินเดือนไม่ได้เปิดใช้งาน"
    );
  }

  /* -----------------------------------------------------
     Employee Company
     ต้องตรงกับ Company ของ Payroll Company
  ----------------------------------------------------- */

  if (
    data.company_id &&
    employee.company_id &&
    String(
      data.company_id
    ) !==
      String(
        employee.company_id
      )
  ) {
    return failure(
      "บริษัทเงินเดือนไม่ตรงกับบริษัทของพนักงาน"
    );
  }

  /* -----------------------------------------------------
     Payroll Type

     ถ้า Payroll Company กำหนด payroll_type_id ไว้
     Payroll Type ของ Employee ต้องตรงกัน
  ----------------------------------------------------- */

  if (
    data.payroll_type_id &&
    employee.payroll_type_id &&
    String(
      data.payroll_type_id
    ) !==
      String(
        employee.payroll_type_id
      )
  ) {
    return failure(
      "รอบการจ่ายเงินไม่ตรงกับบริษัทเงินเดือนที่เลือก"
    );
  }

  /* -----------------------------------------------------
     Success
  ----------------------------------------------------- */

  return success({
    payrollCompany:
      data,
  });
}

/* =========================================================
   VALIDATE PAYROLL TYPE
========================================================= */

async function validatePayrollType(
  employee
) {
  if (!employee.payroll_type_id) {
    return success({
      payrollType: null,
    });
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("payroll_types")
    .select(
      `
        id,
        payroll_type_code,
        payroll_type_name,
        payment_frequency,
        default_payment_day,
        cutoff_end_day,
        payment_offset_month,
        status
      `
    )
    .eq(
      "id",
      employee.payroll_type_id
    )
    .maybeSingle();

  if (error) {
    return failure(
      "ไม่สามารถตรวจสอบรอบการจ่ายเงินได้",
      error,
      getDatabaseErrorStatus(error)
    );
  }

  if (!data) {
    return failure(
      "ไม่พบรอบการจ่ายเงินที่เลือก",
      null,
      404
    );
  }

  if (!isActive(data)) {
    return failure(
      "รอบการจ่ายเงินไม่ได้เปิดใช้งาน"
    );
  }

  return success({
    payrollType: data,
  });
}

/* =========================================================
   VALIDATE PAYROLL GROUP
========================================================= */

async function validatePayrollGroup(
  employee
) {
  if (!employee.payroll_group_id) {
    return success({
      payrollGroup: null,
    });
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("payroll_groups")
    .select("*")
    .eq(
      "id",
      employee.payroll_group_id
    )
    .maybeSingle();

  if (error) {
    return failure(
      "ไม่สามารถตรวจสอบกลุ่มเงินเดือนได้",
      error,
      getDatabaseErrorStatus(error)
    );
  }

  if (!data) {
    return failure(
      "ไม่พบกลุ่มเงินเดือนที่เลือก",
      null,
      404
    );
  }

  if (!isActive(data)) {
    return failure(
      "กลุ่มเงินเดือนไม่ได้เปิดใช้งาน"
    );
  }

  if (
    data.payroll_company_id &&
    employee.payroll_company_id &&
    data.payroll_company_id !==
      employee.payroll_company_id
  ) {
    return failure(
      "กลุ่มเงินเดือนไม่ได้อยู่ในบริษัทเงินเดือนที่เลือก"
    );
  }

  if (
    data.payroll_type_id &&
    employee.payroll_type_id &&
    data.payroll_type_id !==
      employee.payroll_type_id
  ) {
    return failure(
      "กลุ่มเงินเดือนไม่ตรงกับรอบการจ่ายเงินที่เลือก"
    );
  }

  return success({
    payrollGroup: data,
  });
}

/* =========================================================
   VALIDATE POSITION LEVEL BAND
========================================================= */

async function validatePositionLevelBand(
  employee
) {
  if (
    !employee.position_level_band_id
  ) {
    return success({
      positionLevelBand: null,
    });
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(
      "position_level_bands"
    )
    .select(
      `
        id,
        position_level_id,
        band_code,
        band_name,
        step_no,
        currency,
        salary_min,
        salary_mid,
        salary_max,
        annual_min,
        annual_mid,
        annual_max,
        target_bonus_percent,
        merit_increase_percent,
        overtime_rate,
        allowance_amount,
        effective_date,
        expire_date,
        status,
        sort_order
      `
    )
    .eq(
      "id",
      employee
        .position_level_band_id
    )
    .maybeSingle();

  if (error) {
    return failure(
      "ไม่สามารถตรวจสอบช่วงเงินเดือนได้",
      error,
      getDatabaseErrorStatus(error)
    );
  }

  if (!data) {
    return failure(
      "ไม่พบช่วงเงินเดือนที่เลือก",
      null,
      404
    );
  }

  if (!isActive(data)) {
    return failure(
      "ช่วงเงินเดือนไม่ได้เปิดใช้งาน"
    );
  }

  if (
    employee.position_level_id &&
    data.position_level_id !==
      employee.position_level_id
  ) {
    return failure(
      "ช่วงเงินเดือนที่เลือกไม่ได้อยู่ในระดับตำแหน่งของพนักงาน"
    );
  }

  const referenceDate =
    employee.start_work_date ||
    employee.hire_date ||
    new Date().toISOString();

  if (
    !isDateInEffectiveRange(
      referenceDate,
      data.effective_date,
      data.expire_date
    )
  ) {
    return failure(
      "ช่วงเงินเดือนยังไม่เริ่มใช้งานหรือหมดอายุแล้ว"
    );
  }

  return success({
    positionLevelBand: data,
  });
}

/* =========================================================
   VALIDATE PAYROLL RELATIONSHIPS
========================================================= */

function validatePayrollRelationships({
  employee,

  payrollCompany,

  payrollType,

  payrollGroup,

  positionLevelBand,
}) {
  /* -----------------------------------------------------
     Payroll Company ↔ Payroll Type
  ----------------------------------------------------- */

  if (
    payrollCompany
      ?.payroll_type_id &&
    payrollType?.id &&
    String(
      payrollCompany
        .payroll_type_id
    ) !==
      String(
        payrollType.id
      )
  ) {
    return failure(
      "รอบการจ่ายเงินไม่ตรงกับบริษัทเงินเดือน"
    );
  }

  /* -----------------------------------------------------
     Payroll Group ↔ Payroll Company
  ----------------------------------------------------- */

  if (
    payrollGroup
      ?.payroll_company_id &&
    payrollCompany?.id &&
    String(
      payrollGroup
        .payroll_company_id
    ) !==
      String(
        payrollCompany.id
      )
  ) {
    return failure(
      "กลุ่มเงินเดือนไม่ตรงกับบริษัทเงินเดือน"
    );
  }

  /* -----------------------------------------------------
     Payroll Group ↔ Payroll Type
  ----------------------------------------------------- */

  if (
    payrollGroup
      ?.payroll_type_id &&
    payrollType?.id &&
    String(
      payrollGroup
        .payroll_type_id
    ) !==
      String(
        payrollType.id
      )
  ) {
    return failure(
      "กลุ่มเงินเดือนไม่ตรงกับรอบการจ่ายเงิน"
    );
  }

  /* -----------------------------------------------------
     Position Level Band ↔ Position Level
  ----------------------------------------------------- */

  if (
    positionLevelBand &&
    employee.position_level_id &&
    String(
      positionLevelBand
        .position_level_id
    ) !==
      String(
        employee
          .position_level_id
      )
  ) {
    return failure(
      "ช่วงเงินเดือนไม่ตรงกับระดับตำแหน่ง"
    );
  }

  return success();
}

/* =========================================================
   VALIDATE EMPLOYEE PAYROLL
========================================================= */

export async function validateEmployeePayroll(
  employee = {}
) {
  try {
    const payrollCompanyResult =
      await validatePayrollCompany(
        employee
      );

    if (
      !payrollCompanyResult.success
    ) {
      return payrollCompanyResult;
    }

    const payrollTypeResult =
      await validatePayrollType(
        employee
      );

    if (!payrollTypeResult.success) {
      return payrollTypeResult;
    }

    const payrollGroupResult =
      await validatePayrollGroup(
        employee
      );

    if (!payrollGroupResult.success) {
      return payrollGroupResult;
    }

    const positionLevelBandResult =
      await validatePositionLevelBand(
        employee
      );

    if (
      !positionLevelBandResult.success
    ) {
      return positionLevelBandResult;
    }

    const payrollCompany =
      payrollCompanyResult.data
        .payrollCompany;

    const payrollType =
      payrollTypeResult.data
        .payrollType;

    const payrollGroup =
      payrollGroupResult.data
        .payrollGroup;

    const positionLevelBand =
      positionLevelBandResult.data
        .positionLevelBand;

    const relationshipResult =
      validatePayrollRelationships({
        employee,
        payrollCompany,
        payrollType,
        payrollGroup,
        positionLevelBand,
      });

    if (
      !relationshipResult.success
    ) {
      return relationshipResult;
    }

    return success({
      payrollCompany,
      payrollType,
      payrollGroup,
      positionLevelBand,
    });
  } catch (error) {
    console.error(
      "validateEmployeePayroll exception:",
      error
    );

    return failure(
      "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล Payroll",
      error,
      500
    );
  }
}