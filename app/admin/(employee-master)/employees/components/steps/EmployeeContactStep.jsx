"use client";

import { useEffect } from "react";

import {
  Alert,
  AutoComplete,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";

import {
  ContactsOutlined,
  FileProtectOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const TAX_IDENTITY_OPTIONS = [
  {
    value: "citizen_id",
    label: "ใช้เลขบัตรประชาชน",
  },
  {
    value: "passport",
    label: "ใช้เลขหนังสือเดินทาง (Passport)",
  },
  {
    value: "tax_id",
    label: "ใช้เลขประจำตัวผู้เสียภาษีอื่น",
  },
];

const TAX_FORM_OPTIONS = [
  { value: "PND90", label: "PND90 / ภ.ง.ด.90" },
  { value: "PND91", label: "PND91 / ภ.ง.ด.91" },
  { value: "PND92", label: "PND92 / ภ.ง.ด.92" },
  { value: "PND93", label: "PND93 / ภ.ง.ด.93" },
  { value: "PND94", label: "PND94 / ภ.ง.ด.94" },
];

function buildTaxResidencyOptions(rows = []) {
  return (rows || [])
    .filter(
      (item) =>
        item?.residency_code
    )
    .map((item) => ({
      value:
        item.residency_code,
        label: `${item.residency_name_th || item.residency_code}${item.residency_name_en ? ` / ${item.residency_name_en}` : ''}`
    }));
}

function buildInsuredTypeOptions(rows = []) {
  return (rows || [])
    .filter(
      (item) =>
        item?.category_code
    )
    .map((item) => ({
      value:
        item.category_code,
      label:
        item.category_name_th ||
        item.category_name_en ||
        item.category_code,
    }));
}

function findCompanyById(
  companies = [],
  companyId
) {
  if (!companyId) {
    return null;
  }

  return (
    (companies || []).find(
      (item) =>
        String(item?.id || "") ===
        String(companyId)
    ) || null
  );
}

function normalizeEffectiveDate(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value?.format ===
    "function"
  ) {
    return value.format(
      "YYYY-MM-DD"
    );
  }

  return String(value)
    .trim()
    .slice(0, 10);
}

function findCompanyStatutorySetting(
  rows = [],
  companyId,
  effectiveDate
) {
  if (!companyId) {
    return null;
  }

  const targetDate =
    normalizeEffectiveDate(
      effectiveDate
    );

  const matches =
    (rows || [])
      .filter(
        (item) =>
          String(
            item?.company_id ||
              ""
          ) ===
            String(companyId) &&
          item?.status ===
            "active"
      )
      .filter((item) => {
        if (!targetDate) {
          return true;
        }

        const from =
          String(
            item?.effective_from ||
              ""
          ).slice(0, 10);

        const to =
          item?.effective_to
            ? String(
                item.effective_to
              ).slice(0, 10)
            : "9999-12-31";

        return (
          (!from ||
            from <= targetDate) &&
          targetDate <= to
        );
      })
      .sort((a, b) =>
        String(
          b?.effective_from ||
            ""
        ).localeCompare(
          String(
            a?.effective_from ||
              ""
          )
        )
      );

  return matches[0] || null;
}

function buildCompanyOptions(companies = []) {
  return (companies || [])
    .filter((item) => item?.id)
    .map((item) => {
      const name =
        item?.company_name_th ||
        item?.company_name_en ||
        "-";

      return {
        value: item.id,
        label: item?.company_code
          ? `${item.company_code} - ${name}`
          : name,
      };
    });
}

function buildSsoCompanyOptions(rows = []) {
  const map = new Map();

  for (const item of rows || []) {
    const companyId =
      item?.company_id;

    if (!companyId) {
      continue;
    }

    const key =
      String(companyId);

    if (map.has(key)) {
      continue;
    }

    const name =
      item?.company_name_th ||
      item?.company_name_en ||
      "-";

    map.set(key, {
      value:
        companyId,

      label:
        item?.company_code
          ? `${item.company_code} - ${name}`
          : name,
    });
  }

  return Array.from(
    map.values()
  );
}

function isThaiNationality(item) {
  if (!item) {
    return false;
  }

  const codes = [
    item.nationality_code,
    item.iso2,
    item.iso3,
  ]
    .map((value) =>
      String(value || "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean);

  if (
    codes.includes("TH") ||
    codes.includes("THA") ||
    codes.includes("THAI")
  ) {
    return true;
  }

  const nameTh =
    String(
      item.nationality_name_th ||
        ""
    ).trim();

  const nameEn =
    String(
      item.nationality_name_en ||
        ""
    )
      .trim()
      .toLowerCase();

  return (
    nameTh === "ไทย" ||
    nameTh === "สัญชาติไทย" ||
    nameEn === "thai" ||
    nameEn === "thailand"
  );
}

function compactPhoneNumber(value) {
  return String(value || "")
    .trim()
    .replace(/[\s\-()]/g, "");
}

function validatePhoneNumber(
  value,
  {
    mobile = false,
  } = {}
) {
  if (!value) {
    return Promise.resolve();
  }

  const raw =
    String(value).trim();

  if (
    !/^[0-9+\-\s()]+$/.test(
      raw
    )
  ) {
    return Promise.reject(
      new Error(
        "เบอร์โทรศัพท์ใช้ได้เฉพาะตัวเลข + - ( ) และช่องว่าง"
      )
    );
  }

  const compact =
    compactPhoneNumber(
      raw
    );

  /*
   * International:
   * รองรับรูปแบบ E.164 เช่น +66812345678
   * จำนวนตัวเลขรวม 8-15 หลัก
   */
  if (
    compact.startsWith("+")
  ) {
    if (
      /^\+[1-9]\d{7,14}$/.test(
        compact
      )
    ) {
      return Promise.resolve();
    }

    return Promise.reject(
      new Error(
        "รูปแบบเบอร์โทรต่างประเทศไม่ถูกต้อง เช่น +66812345678"
      )
    );
  }

  /*
   * เบอร์มือถือไทย:
   * 10 หลัก และขึ้นต้น 06 / 08 / 09
   */
  if (mobile) {
    if (
      /^0[689]\d{8}$/.test(
        compact
      )
    ) {
      return Promise.resolve();
    }

    return Promise.reject(
      new Error(
        "เบอร์มือถือไทยต้องมี 10 หลัก และขึ้นต้นด้วย 06, 08 หรือ 09"
      )
    );
  }

  /*
   * โทรศัพท์บ้าน / ที่ทำงาน:
   * รองรับเลขไทย 9-10 หลักที่ขึ้นต้นด้วย 0
   * เพื่อรองรับทั้งโทรศัพท์พื้นฐานและเบอร์มือถือบริษัท
   */
  if (
    /^0\d{8,9}$/.test(
      compact
    )
  ) {
    return Promise.resolve();
  }

  return Promise.reject(
    new Error(
      "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง เช่น 021234567, 0812345678 หรือ +6621234567"
    )
  );
}

export default function EmployeeContactStep({
  form,
  mode = "create",
  disabled = false,
  masterData = {},
  masterLoading = false,
}) {
  const identityType =
    Form.useWatch(
      "tax_identity_type",
      form
    ) || "";

  const citizenId =
    Form.useWatch(
      "citizen_id",
      {
        form,
        preserve: true,
      }
    ) || "";

  const passportNo =
    Form.useWatch(
      "passport_no",
      {
        form,
        preserve: true,
      }
    ) || "";

  const nationalityId =
    Form.useWatch(
      "nationality_id",
      {
        form,
        preserve: true,
      }
    );

  const taxWithholdingEnabled =
    Boolean(
      Form.useWatch(
        "tax_withholding_enabled",
        form
      )
    );

  const socialRegistered =
    Boolean(
      Form.useWatch(
        "social_security_registered",
        form
      )
    );

  const taxWithholdingCompanyId =
    Form.useWatch(
      "tax_withholding_company_id",
      form
    );

  const socialSecurityCompanyId =
    Form.useWatch(
      "social_security_company_id",
      form
    );

  const statutoryEffectiveFrom =
    Form.useWatch(
      "statutory_effective_from",
      form
    );

  const startWorkDate =
    Form.useWatch(
      "start_work_date",
      {
        form,
        preserve: true,
      }
    );

  const selectedNationality =
    (
      masterData?.nationalities ||
      []
    ).find(
      (item) =>
        String(
          item?.id ||
            ""
        ) ===
        String(
          nationalityId ||
            ""
        )
    ) ||
    null;

  const nationalityResolved =
    Boolean(
      nationalityId &&
      selectedNationality
    );

  const isThaiEmployee =
    nationalityResolved &&
    isThaiNationality(
      selectedNationality
    );

  const isForeignEmployee =
    nationalityResolved &&
    !isThaiEmployee;

  const scopedCompanies = masterData?.companies || [];
  const statutoryCompanies = masterData?.statutoryCompanies ||
  [];

  /*
  * Tax Company
  * ต้อง Scope ตามสิทธิ์ User
  */
  const taxCompanyOptions =
    buildCompanyOptions(
      scopedCompanies.filter(
        (item) => {
          if (mode !== "create") {
            return true;
          }

          return (
            String(item?.status || "")
              .trim()
              .toLowerCase() ===
            "active"
          );
        }
      )
    );

  /*
  * SSO Company
  * สามารถเลือกบริษัทอื่นนอก Scope ได้
  */
  const ssoCompanyOptions = buildSsoCompanyOptions(
    statutoryCompanies.filter(
      (item) => {
        if (mode !== "create") {
          return true;
        }

        return (
          String(item?.status || "")
            .trim()
            .toLowerCase() ===
            "active" &&
          String(
            item?.company_status || ""
          )
            .trim()
            .toLowerCase() ===
            "active"
        );
      }
    )
  );

  const taxResidencyOptions =
    buildTaxResidencyOptions(
      masterData?.taxResidencyStatuses
    );

  const insuredTypeOptions =
    buildInsuredTypeOptions(
      masterData?.ssoCategories
    );

  /*
  * Tax ใช้บริษัทที่อยู่ใน Scope
  */
  const selectedTaxCompany =
    findCompanyById(
      scopedCompanies,
      taxWithholdingCompanyId
    );

  /*
  * SSO ใช้บริษัททั้งหมด
  */
  const selectedSsoCompany =statutoryCompanies.find(
    (item) =>
      String(
        item?.company_id || ""
      ) ===
      String(
        socialSecurityCompanyId ||
          ""
      )
  ) || null;

  /*
  * SSO Registration
  * ต้องใช้ Master ที่ไม่ถูก Company Scope
  */
  const selectedSsoRegistration = findCompanyStatutorySetting(
    statutoryCompanies,
    socialSecurityCompanyId,
    statutoryEffectiveFrom ||
      startWorkDate
  );

  const statutoryDisabled =
    disabled || mode !== "create";


  const lockedIdentityType =
    citizenId
      ? "citizen_id"
      : passportNo
        ? "passport"
        : "";

  const hasPersonalIdentity =
    Boolean(lockedIdentityType);

  const taxIdentityOptions =
    TAX_IDENTITY_OPTIONS.map(
      (item) => ({
        ...item,
        disabled:
          item.value === "citizen_id"
            ? !citizenId
            : item.value === "passport"
              ? !passportNo
              : false,
      })
    );

  useEffect(() => {
    if (citizenId) {
      form.setFieldsValue({
        tax_identity_type:
          "citizen_id",
        tax_identification_no:
          citizenId,
      });

      return;
    }

    if (passportNo) {
      form.setFieldsValue({
        tax_identity_type:
          "passport",
        tax_identification_no:
          passportNo,
      });

      return;
    }

    const currentType =
      form.getFieldValue(
        "tax_identity_type"
      );

    if (
      currentType === "citizen_id" ||
      currentType === "passport"
    ) {
      form.setFieldsValue({
        tax_identity_type:
          undefined,
        tax_identification_no:
          "",
      });
    }
  }, [
    citizenId,
    passportNo,
    form,
  ]);

  useEffect(() => {
    if (
      mode !== "create" ||
      hasPersonalIdentity
    ) {
      return;
    }

    form.setFieldsValue({
      tax_withholding_enabled:
        false,
      tax_withholding_company_id:
        undefined,

      social_security_registered:
        false,
      social_security_no: "",
      insured_type: undefined,
      social_security_company_id:
        undefined,
    });
  }, [
    hasPersonalIdentity,
    form,
    mode,
  ]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    if (taxWithholdingEnabled) {
      return;
    }

    form.setFieldsValue({
      tax_filing_form_code:
        undefined,
      tax_resident_status:
        undefined,
      tax_withholding_company_id:
        undefined,
      statutory_effective_from:
        null,
    });
  }, [
    taxWithholdingEnabled,
    form,
    mode,
  ]);

  useEffect(() => {
    if (
      mode !== "create" ||
      !taxWithholdingEnabled ||
      form.getFieldValue(
        "tax_resident_status"
      )
    ) {
      return;
    }

    const firstTaxResidency =
      masterData
        ?.taxResidencyStatuses
        ?.[0]
        ?.residency_code;

    if (firstTaxResidency) {
      form.setFieldValue(
        "tax_resident_status",
        firstTaxResidency
      );
    }
  }, [
    taxWithholdingEnabled,
    form,
    masterData?.taxResidencyStatuses,
    mode,
  ]);

  useEffect(() => {
    if (
      mode !== "create" ||
      !socialRegistered ||
      form.getFieldValue(
        "insured_type"
      )
    ) {
      return;
    }

    const ssoCategories =
      masterData?.ssoCategories ||
      [];

    const defaultCategory =
      ssoCategories.find(
        (item) =>
          item?.is_default ===
          true
      ) ||
      ssoCategories[0] ||
      null;

    if (
      defaultCategory
        ?.category_code
    ) {
      form.setFieldValue(
        "insured_type",
        defaultCategory
          .category_code
      );
    }
  }, [
    socialRegistered,
    form,
    masterData?.ssoCategories,
    mode,
  ]);

  /*
   * เลขประกันสังคมของพนักงาน
   *
   * - สัญชาติไทย:
   *   ใช้เลขบัตรประชาชนเป็นเลขประกันสังคมอัตโนมัติ
   *   และไม่ให้กรอกซ้ำ
   *
   * - ต่างชาติ:
   *   ไม่ใช้ Passport เป็นเลขประกันสังคม
   *   เปิดให้ HR กรอกเลขผู้ประกันตนที่ได้รับจากประกันสังคม
   *
   * ทำเฉพาะ Create เพื่อไม่เขียนทับ Effective History
   */
  useEffect(() => {
    if (
      mode !== "create" ||
      !socialRegistered ||
      !nationalityResolved
    ) {
      return;
    }

    if (isThaiEmployee) {
      form.setFieldValue(
        "social_security_no",
        String(
          citizenId ||
            ""
        )
          .replace(/\D/g, "")
          .slice(0, 13)
      );

      return;
    }

    if (isForeignEmployee) {
      /*
       * เมื่อเปลี่ยนจากไทยเป็นต่างชาติ
       * ให้ล้างเลขที่เคย Auto จาก Citizen ID
       * จากนั้น User สามารถกรอกเลขผู้ประกันตนต่างชาติได้เอง
       */
      form.setFieldValue(
        "social_security_no",
        ""
      );
    }
  }, [
    citizenId,
    form,
    isForeignEmployee,
    isThaiEmployee,
    mode,
    nationalityResolved,
    socialRegistered,
  ]);

  return (
    <div>
      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <PhoneOutlined />
          ข้อมูลโทรศัพท์
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="โทรศัพท์มือถือ"
            name="mobile_phone"
            rules={[
              {
                validator: (
                  _,
                  value
                ) =>
                  validatePhoneNumber(
                    value,
                    {
                      mobile: true,
                    }
                  ),
              },
            ]}
          >
            <Input
              disabled={disabled}
              inputMode="tel"
              autoComplete="tel"
              maxLength={25}
              placeholder="เช่น 0812345678 หรือ +66812345678"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="โทรศัพท์บ้าน"
            name="home_phone"
            rules={[
              {
                validator: (
                  _,
                  value
                ) =>
                  validatePhoneNumber(
                    value
                  ),
              },
            ]}
          >
            <Input
              disabled={disabled}
              inputMode="tel"
              autoComplete="tel"
              maxLength={25}
              placeholder="เช่น 021234567 หรือ +6621234567"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="โทรศัพท์ที่ทำงาน"
            name="work_phone"
            rules={[
              {
                validator: (
                  _,
                  value
                ) =>
                  validatePhoneNumber(
                    value
                  ),
              },
            ]}
          >
            <Input
              disabled={disabled}
              inputMode="tel"
              autoComplete="tel"
              maxLength={25}
              placeholder="เช่น 021234567, 0812345678 หรือ +6621234567"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <MailOutlined />
          อีเมลและช่องทางติดต่อ
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="อีเมลส่วนตัว"
            name="personal_email"
            rules={[
              {
                type: "email",
                message:
                  "รูปแบบอีเมลส่วนตัวไม่ถูกต้อง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="personal@example.com"
              prefix={<MailOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="อีเมลบริษัท"
            name="work_email"
            rules={[
              {
                type: "email",
                message:
                  "รูปแบบอีเมลบริษัทไม่ถูกต้อง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="employee@company.com"
              prefix={<MailOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="LINE ID"
            name="line_id"
          >
            <Input
              disabled={disabled}
              placeholder="LINE ID"
              prefix={<ContactsOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <FileProtectOutlined />
          ข้อมูลภาษีเงินได้บุคคลธรรมดา / ภ.ง.ด.
        </Space>
      </Divider>

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="ข้อมูลภาษีสามารถเว้นว่างได้ในขั้นตอนเพิ่มพนักงาน"
        description="หากข้อมูลส่วนตัวมีเลขบัตรประชาชนหรือ Passport ระบบจะกำหนดเลขประจำตัวสำหรับภาษีและเลขประจำตัวผู้เสียภาษีให้อัตโนมัติและล็อกช่องไว้ หากยังไม่มีข้อมูล เช่น พนักงานต่างชาติที่อยู่ระหว่างจัดทำ Work Permit สามารถเว้นว่างและบันทึกพนักงานก่อนได้"
      />

      {mode !== "create" ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          title="ข้อมูลภาษีและประกันสังคมของพนักงานเดิมเป็น Effective History"
          description="หลังสร้างพนักงานแล้ว ให้แก้ไขหรือเปลี่ยนนิติบุคคลผู้ยื่นภาษี/ประกันสังคมที่หน้า ภาษีและประกันสังคมพนักงาน (/admin/employee-statutory-profiles) เพื่อไม่เขียนทับประวัติเดิม"
        />
      ) : null}

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            label="เลขประจำตัวสำหรับภาษี"
            name="tax_identity_type"
            required={
              mode === "create" &&
              hasPersonalIdentity
            }
            rules={[
              {
                validator: (
                  _,
                  value
                ) => {
                  if (
                    mode !== "create" ||
                    !hasPersonalIdentity
                  ) {
                    return Promise.resolve();
                  }

                  if (!value) {
                    return Promise.reject(
                      new Error(
                        "กรุณาระบุเลขประจำตัวสำหรับภาษี"
                      )
                    );
                  }

                  if (
                    value !==
                    lockedIdentityType
                  ) {
                    return Promise.reject(
                      new Error(
                        "เลขประจำตัวสำหรับภาษีไม่ตรงกับข้อมูลส่วนตัว"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select
              allowClear={
                !hasPersonalIdentity
              }
              disabled={
                statutoryDisabled ||
                hasPersonalIdentity
              }
              options={
                taxIdentityOptions
              }
              placeholder="เลือก Tax Identity (ถ้ามี)"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="เลขประจำตัวผู้เสียภาษี"
            name="tax_identification_no"
            required={
              mode === "create" &&
              hasPersonalIdentity
            }
            rules={[
              {
                validator: (
                  _,
                  value
                ) => {
                  if (
                    mode !== "create" ||
                    !hasPersonalIdentity
                  ) {
                    return Promise.resolve();
                  }

                  const expectedValue =
                    citizenId ||
                    passportNo;

                  if (!value) {
                    return Promise.reject(
                      new Error(
                        "กรุณาระบุเลขประจำตัวผู้เสียภาษี"
                      )
                    );
                  }

                  if (
                    String(
                      value || ""
                    ).trim() !==
                    String(
                      expectedValue || ""
                    ).trim()
                  ) {
                    return Promise.reject(
                      new Error(
                        "เลขประจำตัวผู้เสียภาษีไม่ตรงกับข้อมูลส่วนตัว"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              disabled={
                statutoryDisabled ||
                hasPersonalIdentity ||
                identityType !==
                  "tax_id"
              }
              maxLength={30}
              placeholder={
                hasPersonalIdentity
                  ? "ดึงจากข้อมูลส่วนตัวอัตโนมัติ"
                  : identityType ===
                      "tax_id"
                    ? "Tax Identification Number (ถ้ามี)"
                    : "เลือก Tax Identity ก่อน (ถ้ามี)"
              }
            />
          </Form.Item>
        </Col>

        <Divider
          titlePlacement="left"
          plain
        >
          <Space>
            <MoneyCollectOutlined />
            ข้อมูลบริษัทเป็นผู้หักและนำส่งภาษี
          </Space>
        </Divider>

        <Col xs={24} md={8}>
          <Form.Item
            label="บริษัทเป็นผู้หักและนำส่งภาษี"
            name="tax_withholding_enabled"
            valuePropName="checked"
          >
            <Switch
              disabled={
                statutoryDisabled ||
                !hasPersonalIdentity
              }
              checkedChildren="บริษัทนำส่ง"
              unCheckedChildren="ไม่นำส่ง"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Text type="secondary">
            {!hasPersonalIdentity
              ? "กรุณากรอกเลขบัตรประชาชนหรือ Passport ในข้อมูลส่วนตัวก่อน"
              : taxWithholdingEnabled
                ? "บริษัทเป็นผู้หักและนำส่งภาษี กรุณากรอกข้อมูลภาษีที่เกี่ยวข้องให้ครบก่อนกดถัดไป"
                : "พนักงานรายนี้ไม่ใช้บริษัทเป็นผู้หักและนำส่งภาษี สามารถกดถัดไปได้โดยไม่ต้องกรอกข้อมูลกลุ่มนี้"}
          </Text>
        </Col>

        {taxWithholdingEnabled ? (
          <>
            <Col xs={24} md={12}>
              <Form.Item
                label="แบบภาษี / การยื่น ภ.ง.ด."
                name="tax_filing_form_code"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุแบบภาษี / การยื่น ภ.ง.ด.",
                  },
                ]}
              >
                <AutoComplete
                  disabled={
                    statutoryDisabled
                  }
                  options={
                    TAX_FORM_OPTIONS
                  }
                  placeholder="เช่น PND91 / ภ.ง.ด.91 หรือระบุรหัสอื่น"
                  filterOption={(
                    input,
                    option
                  ) =>
                    String(
                      option?.label ||
                        ""
                    )
                      .toLowerCase()
                      .includes(
                        String(
                          input || ""
                        ).toLowerCase()
                      )
                  }
                />
              </Form.Item>
            </Col>

            {
              taxWithholdingEnabled &&
              !masterLoading &&
              taxResidencyOptions.length === 0
            ? (
              <Col xs={24}>
                <Alert
                  showIcon
                  type="warning"
                  title="ยังไม่มี Master สถานะผู้มีถิ่นที่อยู่ทางภาษี"
                  description="กรุณาตั้งค่าที่เมนู สถานะผู้มีถิ่นที่อยู่ทางภาษี ก่อนบันทึกพนักงานที่นำส่งภาษี"
                />
              </Col>
            ) : null}

            <Col xs={24} md={12}>
              <Form.Item
                label="สถานะผู้มีถิ่นที่อยู่ทางภาษี"
                name="tax_resident_status"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกสถานะผู้มีถิ่นที่อยู่ทางภาษี",
                  },
                ]}
              >
                <Select
                  disabled={
                    statutoryDisabled
                  }
                  loading={
                    masterLoading
                  }
                  options={
                    taxResidencyOptions
                  }
                  placeholder="เลือกสถานะผู้มีถิ่นที่อยู่ทางภาษี"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={16}>
              <Form.Item
                label="บริษัทผู้จ่ายเงินได้ / บริษัทนำส่งภาษี"
                name="tax_withholding_company_id"
                tooltip="เลือก Legal Entity ที่ใช้หักและนำส่งภาษีของพนักงานรายนี้ ซึ่งสามารถต่างจากบริษัทที่ทำงานและบริษัทเงินเดือนได้"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกบริษัทผู้จ่ายเงินได้ / บริษัทนำส่งภาษี",
                  },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  loading={
                    masterLoading
                  }
                  disabled={
                    statutoryDisabled
                  }
                  options={
                    taxCompanyOptions
                  }
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>

            {taxWithholdingCompanyId ? (
              <>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="เลขประจำตัวผู้เสียภาษีบริษัท"
                  >
                    <Input
                      readOnly
                      value={
                        selectedTaxCompany
                          ?.tax_id ||
                        ""
                      }
                      placeholder="ยังไม่ได้กำหนด Tax ID ใน Company Master"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="เลขสาขาภาษี"
                  >
                    <Input
                      readOnly
                      value={
                        selectedTaxCompany
                          ?.branch_no ||
                        ""
                      }
                      placeholder="ยังไม่ได้กำหนดเลขสาขาใน Company Master"
                    />
                  </Form.Item>
                </Col>
              </>
            ) : null}

            <Col xs={24} md={8}>
              <Form.Item
                label="วันที่เริ่มมีผลบังคับใช้ (Effective Date)"
                name="statutory_effective_from"
                required
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุวันที่เริ่มมีผลบังคับใช้",
                  },
                ]}
              >
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  disabled={
                    statutoryDisabled
                  }
                />
              </Form.Item>
            </Col>
          </>
        ) : null}
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SafetyCertificateOutlined />
          ข้อมูลประกันสังคม
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="ขึ้นทะเบียนประกันสังคม"
            name="social_security_registered"
            valuePropName="checked"
          >
            <Switch
              disabled={
                statutoryDisabled ||
                !hasPersonalIdentity
              }
              checkedChildren="ขึ้นทะเบียน"
              unCheckedChildren="ไม่ขึ้นทะเบียน"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Text type="secondary">
            {hasPersonalIdentity
              ? "บริษัทประกันสังคมสามารถเป็นคนละนิติบุคคลกับบริษัทเงินเดือนหรือบริษัทนำส่งภาษีได้"
              : "กรุณากรอกเลขบัตรประชาชนหรือ Passport ในข้อมูลส่วนตัวก่อน จึงจะสามารถเปิดการขึ้นทะเบียนประกันสังคมได้"}
          </Text>
        </Col>

        {socialRegistered ? (
          <>
            {
              !masterLoading &&
              insuredTypeOptions.length === 0
            ? (
              <Col xs={24}>
                <Alert
                  showIcon
                  type="warning"
                  message="ยังไม่มี Master ประเภทผู้ประกันตน"
                  description="กรุณาตั้งค่าที่เมนู ประเภทผู้ประกันตน ก่อนบันทึกพนักงานที่ขึ้นทะเบียนประกันสังคม"
                />
              </Col>
            ) : null}

            <Col xs={24} md={8}>
              <Form.Item
                label="เลขประกันสังคม"
                name="social_security_no"
                dependencies={[
                  "citizen_id",
                  "nationality_id",
                ]}
                rules={
                  mode === "create"
                    ? [
                        {
                          required: true,
                          message:
                            isThaiEmployee
                              ? "กรุณากรอกเลขบัตรประชาชนในข้อมูลส่วนตัว"
                              : "กรุณากรอกเลขประกันสังคม",
                        },
                        {
                          validator: (
                            _,
                            value
                          ) => {
                            if (
                              !value
                            ) {
                              return Promise.resolve();
                            }

                            if (
                              isThaiEmployee
                            ) {
                              const expected =
                                String(
                                  citizenId ||
                                    ""
                                )
                                  .replace(
                                    /\D/g,
                                    ""
                                  )
                                  .slice(
                                    0,
                                    13
                                  );

                              if (
                                String(
                                  value ||
                                    ""
                                ) !==
                                expected
                              ) {
                                return Promise.reject(
                                  new Error(
                                    "เลขประกันสังคมของพนักงานไทยต้องตรงกับเลขบัตรประชาชน"
                                  )
                                );
                              }
                            }

                            return Promise.resolve();
                          },
                        },
                      ]
                    : []
                }
              >
                <Input
                  disabled={
                    statutoryDisabled ||
                    isThaiEmployee
                  }
                  inputMode={
                    isThaiEmployee
                      ? "numeric"
                      : "text"
                  }
                  maxLength={20}
                  placeholder={
                    isThaiEmployee
                      ? "ดึงจากเลขบัตรประชาชนอัตโนมัติ"
                      : "กรอกเลขผู้ประกันตน"
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="ประเภทผู้ประกันตน"
                name="insured_type"
                rules={
                  mode === "create"
                    ? [
                        {
                          required: true,
                          message:
                            "กรุณาเลือกประเภทผู้ประกันตน",
                        },
                      ]
                    : []
                }
              >
                <Select
                  disabled={statutoryDisabled}
                  loading={
                    masterLoading
                  }
                  options={
                    insuredTypeOptions
                  }
                  placeholder="เลือกประเภทผู้ประกันตน"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="บริษัทที่ขึ้นทะเบียน / นำส่งประกันสังคม"
                name="social_security_company_id"
                tooltip="เลือก Legal Entity ที่ขึ้นทะเบียนและนำส่งประกันสังคมของพนักงานรายนี้"
                rules={
                  mode === "create"
                    ? [
                        {
                          required: true,
                          message:
                            "กรุณาเลือกบริษัทประกันสังคม",
                        },
                      ]
                    : []
                }
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  loading={masterLoading}
                  disabled={statutoryDisabled}
                  options={ssoCompanyOptions}
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>

            {socialSecurityCompanyId ? (
              <>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="เลขบัญชีนายจ้างประกันสังคม"
                  >
                    <Input
                      readOnly
                      value={
                        selectedSsoRegistration
                          ?.sso_employer_account_no ||
                        ""
                      }
                      placeholder="ยังไม่ได้ตั้งทะเบียน SSO ของบริษัท"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="เลขสาขาประกันสังคม"
                  >
                    <Input
                      readOnly
                      value={
                        selectedSsoRegistration
                          ?.sso_branch_no ||
                        ""
                      }
                      placeholder="ยังไม่ได้ตั้งเลขสาขา SSO"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="บริษัททะเบียน SSO"
                  >
                    <Input
                      readOnly
                      value={
                        selectedSsoCompany
                          ?.company_code
                          ? `${selectedSsoCompany.company_code} - ${
                              selectedSsoCompany.company_name_th ||
                              selectedSsoCompany.company_name_en ||
                              "-"
                            }`
                          : selectedSsoCompany
                              ?.company_name_th ||
                            selectedSsoCompany
                              ?.company_name_en ||
                            ""
                      }
                    />
                  </Form.Item>
                </Col>

                {!masterLoading &&
                !selectedSsoRegistration ? (
                  <Col xs={24}>
                    <Alert
                      showIcon
                      type="warning"
                      title="ยังไม่พบทะเบียนประกันสังคมของบริษัทที่เลือก"
                      description="กรุณาตรวจสอบเมนู ทะเบียนภาษีและประกันสังคมบริษัท เพื่อกำหนดเลขบัญชีนายจ้างและเลขสาขา SSO"
                    />
                  </Col>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </Row>
    </div>
  );
}
