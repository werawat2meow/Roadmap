import { supabaseAdmin } from "@/lib/supabaseServer";

export const EMPLOYEE_STATUTORY_MODULE =
  "ems.employee_statutory_profiles";

export const EMPLOYEE_STATUTORY_TABLE =
  "employee_statutory_profiles";

const ALLOWED_IDENTITY_TYPES = [
  "citizen_id",
  "passport",
  "tax_id",
];

const ALLOWED_TAX_RESIDENT = [
  "resident",
  "non_resident",
];

const ALLOWED_INSURED_TYPES = [
  "section_33",
  "section_39",
  "section_40",
  "custom",
];

const STATUTORY_FIELDS = [
  "tax_identity_type",
  "tax_identification_no",
  "tax_filing_form_code",
  "tax_resident_status",
  "tax_withholding_company_id",
  "statutory_effective_from",
  "social_security_registered",
  "social_security_no",
  "insured_type",
  "social_security_company_id",
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
}

function cleanDate(value) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? text
    : null;
}

function normalizeTaxForm(value) {
  const text = cleanText(value).toUpperCase();
  return text || null;
}

export function hasEmployeeStatutoryPayload(
  body = {}
) {
  return STATUTORY_FIELDS.some(
    (field) =>
      Object.prototype.hasOwnProperty.call(
        body,
        field
      )
  );
}

export function resolveEmployeeTaxIdentity(
  payload,
  employee
) {
  if (
    payload?.tax_identity_type ===
    "citizen_id"
  ) {
    return cleanNullableText(
      employee?.citizen_id
    );
  }

  if (
    payload?.tax_identity_type ===
    "passport"
  ) {
    return cleanNullableText(
      employee?.passport_no
    );
  }

  return cleanNullableText(
    payload?.tax_identification_no
  );
}

export function normalizeEmployeeStatutoryPayload(
  body = {},
  {
    employee,
    current = null,
  } = {}
) {
  const identityTypeRaw =
    body.tax_identity_type !== undefined
      ? cleanText(
          body.tax_identity_type
        ).toLowerCase()
      : cleanText(
          current?.tax_identity_type ||
            "citizen_id"
        ).toLowerCase();

  const identityType =
    ALLOWED_IDENTITY_TYPES.includes(
      identityTypeRaw
    )
      ? identityTypeRaw
      : "citizen_id";

  const residentRaw =
    body.tax_resident_status !== undefined
      ? cleanText(
          body.tax_resident_status
        ).toLowerCase()
      : cleanText(
          current?.tax_resident_status ||
            "resident"
        ).toLowerCase();

  const taxResidentStatus =
    ALLOWED_TAX_RESIDENT.includes(
      residentRaw
    )
      ? residentRaw
      : "resident";

  const socialRegistered =
    body.social_security_registered !==
    undefined
      ? cleanBoolean(
          body.social_security_registered,
          false
        )
      : Boolean(
          current?.social_security_registered
        );

  const insuredRaw =
    body.insured_type !== undefined
      ? cleanText(
          body.insured_type
        ).toLowerCase()
      : cleanText(
          current?.insured_type
        ).toLowerCase();

  const insuredType =
    socialRegistered
      ? ALLOWED_INSURED_TYPES.includes(
          insuredRaw
        )
        ? insuredRaw
        : insuredRaw
          ? "custom"
          : null
      : null;

  const effectiveFrom =
    cleanDate(
      body.statutory_effective_from
    ) ||
    cleanDate(body.effective_from) ||
    cleanDate(
      current?.effective_from
    ) ||
    cleanDate(
      employee?.start_work_date
    ) ||
    cleanDate(employee?.hire_date) ||
    new Date()
      .toISOString()
      .slice(0, 10);

  const payload = {
    tax_identity_type:
      identityType,

    tax_identification_no:
      body.tax_identification_no !==
      undefined
        ? cleanNullableText(
            body.tax_identification_no
          )
        : cleanNullableText(
            current?.tax_identification_no
          ),

    tax_filing_form_code:
      body.tax_filing_form_code !==
      undefined
        ? normalizeTaxForm(
            body.tax_filing_form_code
          )
        : normalizeTaxForm(
            current?.tax_filing_form_code
          ),

    tax_withholding_company_id:
      body.tax_withholding_company_id !==
      undefined
        ? cleanNullableText(
            body.tax_withholding_company_id
          )
        : cleanNullableText(
            current?.tax_withholding_company_id
          ),

    tax_resident_status:
      taxResidentStatus,

    social_security_registered:
      socialRegistered,

    social_security_no:
      socialRegistered
        ? body.social_security_no !==
          undefined
          ? cleanNullableText(
              body.social_security_no
            )
          : cleanNullableText(
              current?.social_security_no
            )
        : null,

    insured_type:
      insuredType,

    social_security_company_id:
      socialRegistered
        ? body.social_security_company_id !==
          undefined
          ? cleanNullableText(
              body.social_security_company_id
            )
          : cleanNullableText(
              current?.social_security_company_id
            )
        : null,

    effective_from:
      effectiveFrom,

    effective_to:
      current?.effective_to || null,

    status: "active",

    remark:
      cleanNullableText(
        current?.remark
      ) ||
      "สร้าง/ปรับปรุงจาก Employee Wizard",
  };

  payload.tax_identification_no =
    resolveEmployeeTaxIdentity(
      payload,
      employee
    );

  return payload;
}

export function validateEmployeeStatutoryPayload(
  payload,
  employee
) {
  const identityNo =
    resolveEmployeeTaxIdentity(
      payload,
      employee
    );

  if (!identityNo) {
    if (
      payload.tax_identity_type ===
      "citizen_id"
    ) {
      return "พนักงานรายนี้ยังไม่มีเลขบัตรประชาชน กรุณากรอกในข้อมูลส่วนตัวก่อน";
    }

    if (
      payload.tax_identity_type ===
      "passport"
    ) {
      return "พนักงานรายนี้ยังไม่มีเลขหนังสือเดินทาง กรุณากรอกในข้อมูลส่วนตัวก่อน";
    }

    return "กรุณากรอกเลขประจำตัวผู้เสียภาษี";
  }

  if (
    !payload.tax_filing_form_code
  ) {
    return "กรุณาระบุแบบภาษี / การยื่น ภ.ง.ด.";
  }

  if (
    !payload.tax_withholding_company_id
  ) {
    return "กรุณาเลือกบริษัทผู้จ่ายเงินได้ / บริษัทนำส่งภาษี";
  }

  if (
    payload.social_security_registered
  ) {
    if (!payload.social_security_no) {
      return "กรุณากรอกเลขประกันสังคม";
    }

    if (!payload.insured_type) {
      return "กรุณาเลือกประเภทผู้ประกันตน";
    }

    if (
      !payload.social_security_company_id
    ) {
      return "กรุณาเลือกบริษัทที่ขึ้นทะเบียน / นำส่งประกันสังคม";
    }
  }

  return null;
}

async function getCompany(companyId) {
  if (!companyId) {
    return {
      data: null,
      error: null,
    };
  }

  return supabaseAdmin
    .from("companies")
    .select(
      "id, company_code, company_name_th, company_name_en, tax_id, status"
    )
    .eq("id", companyId)
    .maybeSingle();
}

export async function validateEmployeeStatutoryCompanies(
  payload
) {
  const [taxCompany, ssoCompany] =
    await Promise.all([
      getCompany(
        payload.tax_withholding_company_id
      ),
      getCompany(
        payload.social_security_company_id
      ),
    ]);

  if (taxCompany.error) {
    return {
      ok: false,
      message:
        "ไม่สามารถตรวจสอบบริษัทนำส่งภาษีได้",
      error: taxCompany.error,
    };
  }

  if (
    !taxCompany.data ||
    taxCompany.data.status ===
      "inactive"
  ) {
    return {
      ok: false,
      message:
        "บริษัทนำส่งภาษีที่เลือกไม่พร้อมใช้งาน",
      error: null,
    };
  }

  if (ssoCompany.error) {
    return {
      ok: false,
      message:
        "ไม่สามารถตรวจสอบบริษัทประกันสังคมได้",
      error: ssoCompany.error,
    };
  }

  if (
    payload.social_security_registered &&
    (!ssoCompany.data ||
      ssoCompany.data.status ===
        "inactive")
  ) {
    return {
      ok: false,
      message:
        "บริษัทประกันสังคมที่เลือกไม่พร้อมใช้งาน",
      error: null,
    };
  }

  return {
    ok: true,
    taxCompany: taxCompany.data,
    ssoCompany: ssoCompany.data,
  };
}

export async function getActiveEmployeeStatutoryProfile(
  employeeId
) {
  return supabaseAdmin
    .from(EMPLOYEE_STATUTORY_TABLE)
    .select("*")
    .eq("employee_id", employeeId)
    .eq("status", "active")
    .maybeSingle();
}

export async function createEmployeeStatutoryProfile({
  employeeId,
  payload,
  actorId = null,
}) {
  return supabaseAdmin
    .from(EMPLOYEE_STATUTORY_TABLE)
    .insert({
      employee_id: employeeId,
      ...payload,
      created_by: actorId,
      updated_by: actorId,
    })
    .select("*")
    .single();
}

export async function updateEmployeeStatutoryProfile({
  id,
  payload,
  actorId = null,
}) {
  return supabaseAdmin
    .from(EMPLOYEE_STATUTORY_TABLE)
    .update({
      ...payload,
      updated_by: actorId,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteEmployeeStatutoryProfilesByEmployeeId(
  employeeId
) {
  if (!employeeId) {
    return {
      error: null,
    };
  }

  return supabaseAdmin
    .from(EMPLOYEE_STATUTORY_TABLE)
    .delete()
    .eq("employee_id", employeeId);
}
