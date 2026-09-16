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

const TAX_RESIDENT_OPTIONS = [
  {
    value: "resident",
    label: "ผู้มีถิ่นที่อยู่ในประเทศไทย (Tax Resident)",
  },
  {
    value: "non_resident",
    label: "ผู้ที่ไม่มีถิ่นที่อยู่ในประเทศไทย (Non-Tax Resident)",
  },
];

const INSURED_TYPE_OPTIONS = [
  {
    value: "section_33",
    label: "มาตรา 33",
  },
  {
    value: "section_39",
    label: "มาตรา 39",
  },
  {
    value: "section_40",
    label: "มาตรา 40",
  },
  {
    value: "custom",
    label: "อื่น ๆ",
  },
];

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

  const companyOptions =
    buildCompanyOptions(
      masterData?.companies
    );

  const statutoryDisabled =
    disabled || mode !== "create";

  /*
   * Tax Identity ใช้ข้อมูลจาก Employee Master เป็นหลัก
   * - ถ้ามี Citizen ID ให้ใช้ Citizen ID ก่อน
   * - ถ้าไม่มี Citizen ID แต่มี Passport ให้ใช้ Passport
   * - ถ้าไม่มีทั้งสองอย่าง สามารถเว้นว่าง หรือเลือก Tax ID อื่นได้
   */
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
    /*
     * Personal Identity เป็น Source of Truth
     *
     * Create:
     *   ใช้เติม Tax Identity ก่อนสร้างพนักงาน
     *
     * Edit / View:
     *   ใช้แสดงค่าอ้างอิงจากข้อมูลส่วนตัวอัตโนมัติ
     *   แต่ยังคง Disable การแก้ Statutory History ตาม Logic เดิม
     */
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

  /*
   * ถ้ายังไม่มี Citizen ID / Passport
   * ยังไม่อนุญาตให้ขึ้นทะเบียนประกันสังคม
   * และล้างค่าที่อาจค้างจากการกรอกก่อนหน้า
   */
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

  /*
   * ถ้า HR เลือก "ไม่นำส่งภาษี"
   * ให้ล้างบริษัทนำส่งภาษีออก
   * เพื่อไม่ให้ค่าเดิมค้างอยู่ใน Form/Payload
   */
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
                pattern:
                  /^[0-9+\-\s()]{8,20}$/,
                message:
                  "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="เช่น 0812345678"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="โทรศัพท์บ้าน"
            name="home_phone"
          >
            <Input
              disabled={disabled}
              placeholder="โทรศัพท์บ้าน"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="โทรศัพท์ที่ทำงาน"
            name="work_phone"
          >
            <Input
              disabled={disabled}
              placeholder="โทรศัพท์ที่ทำงาน"
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
                  options={
                    TAX_RESIDENT_OPTIONS
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
                    companyOptions
                  }
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>

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
            <Col xs={24} md={8}>
              <Form.Item
                label="เลขประกันสังคม"
                name="social_security_no"
                rules={
                  mode === "create"
                    ? [
                        {
                          required: true,
                          message:
                            "กรุณากรอกเลขประกันสังคม",
                        },
                      ]
                    : []
                }
              >
                <Input
                  disabled={statutoryDisabled}
                  maxLength={20}
                  placeholder="เลขประกันสังคม"
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
                  options={
                    INSURED_TYPE_OPTIONS
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
                  options={companyOptions}
                  placeholder="เลือก Company Master"
                />
              </Form.Item>
            </Col>
          </>
        ) : null}
      </Row>
    </div>
  );
}
