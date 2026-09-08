"use client";

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
    label: "ผู้มีถิ่นที่อยู่ทางภาษี",
  },
  {
    value: "non_resident",
    label: "ผู้ไม่มีถิ่นที่อยู่ทางภาษี",
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
    ) || "citizen_id";

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

  const identityPreview =
    identityType === "citizen_id"
      ? citizenId
      : identityType === "passport"
        ? passportNo
        : "";

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
        title="เลขบัตรประชาชน / Passport ใช้จากข้อมูลส่วนตัวโดยตรง"
        description="ไม่ต้องกรอกเลขซ้ำในส่วนภาษี ให้เลือกว่าการยื่นภาษีจะอ้างอิงเลขบัตรประชาชน, Passport หรือ Tax ID อื่น ระบบจะเก็บเลขบัตรประชาชนและ Passport ที่ Employee Master เป็น Source of Truth"
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
            rules={
              mode === "create"
                ? [
                    {
                      required: true,
                      message:
                        "กรุณาเลือกเลขประจำตัวสำหรับภาษี",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          value === "citizen_id" &&
                          !String(
                            getFieldValue(
                              "citizen_id"
                            ) || ""
                          ).trim()
                        ) {
                          return Promise.reject(
                            new Error(
                              "กรุณากรอกเลขบัตรประชาชนในข้อมูลส่วนตัวก่อน"
                            )
                          );
                        }

                        if (
                          value === "passport" &&
                          !String(
                            getFieldValue(
                              "passport_no"
                            ) || ""
                          ).trim()
                        ) {
                          return Promise.reject(
                            new Error(
                              "กรุณากรอกเลขหนังสือเดินทางในข้อมูลส่วนตัวก่อน"
                            )
                          );
                        }

                        return Promise.resolve();
                      },
                    }),
                  ]
                : []
            }
          >
            <Select
              disabled={statutoryDisabled}
              options={
                TAX_IDENTITY_OPTIONS
              }
              placeholder="เลือก Tax Identity"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          {identityType === "tax_id" ? (
            <Form.Item
              label="เลขประจำตัวผู้เสียภาษี"
              name="tax_identification_no"
              rules={
                mode === "create"
                  ? [
                      {
                        required: true,
                        message:
                          "กรุณากรอกเลขประจำตัวผู้เสียภาษี",
                      },
                    ]
                  : []
              }
            >
              <Input
                disabled={statutoryDisabled}
                maxLength={30}
                placeholder="Tax Identification Number"
              />
            </Form.Item>
          ) : (
            <Form.Item
              label={
                identityType === "passport"
                  ? "เลข Passport ที่ใช้อ้างอิง"
                  : "เลขบัตรประชาชนที่ใช้อ้างอิง"
              }
              validateStatus={
                mode === "create" &&
                !identityPreview
                  ? "error"
                  : undefined
              }
              help={
                mode === "create" &&
                !identityPreview
                  ? "กรุณากลับไปกรอกข้อมูลในขั้นข้อมูลส่วนตัว"
                  : "ดึงจาก Employee Master อัตโนมัติ"
              }
            >
              <Input
                value={
                  identityPreview || ""
                }
                readOnly
                placeholder="ยังไม่มีข้อมูล"
              />
            </Form.Item>
          )}
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="แบบภาษี / การยื่น ภ.ง.ด."
            name="tax_filing_form_code"
            rules={
              mode === "create"
                ? [
                    {
                      required: true,
                      message:
                        "กรุณาระบุแบบภาษี / ภ.ง.ด.",
                    },
                  ]
                : []
            }
          >
            <AutoComplete
              disabled={statutoryDisabled}
              options={TAX_FORM_OPTIONS}
              placeholder="เช่น PND91 / ภ.ง.ด.91 หรือระบุรหัสอื่น"
              filterOption={(input, option) =>
                String(
                  option?.label || ""
                )
                  .toLowerCase()
                  .includes(
                    String(input || "").toLowerCase()
                  )
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="สถานะผู้มีถิ่นที่อยู่ทางภาษี"
            name="tax_resident_status"
            rules={
              mode === "create"
                ? [
                    {
                      required: true,
                      message:
                        "กรุณาเลือกสถานะทางภาษี",
                    },
                  ]
                : []
            }
          >
            <Select
              disabled={statutoryDisabled}
              options={
                TAX_RESIDENT_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Form.Item
            label="บริษัทผู้จ่ายเงินได้ / บริษัทนำส่งภาษี"
            name="tax_withholding_company_id"
            tooltip="เลือก Legal Entity ที่ใช้หักและนำส่งภาษีของพนักงานรายนี้ ซึ่งสามารถต่างจากบริษัทที่ทำงานและบริษัทเงินเดือนได้"
            rules={
              mode === "create"
                ? [
                    {
                      required: true,
                      message:
                        "กรุณาเลือกบริษัทนำส่งภาษี",
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

        <Col xs={24} md={8}>
          <Form.Item
            label="วันที่เริ่มมีผล"
            name="statutory_effective_from"
            rules={
              mode === "create"
                ? [
                    {
                      required: true,
                      message:
                        "กรุณาเลือกวันที่เริ่มมีผล",
                    },
                  ]
                : []
            }
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabled={statutoryDisabled}
            />
          </Form.Item>
        </Col>
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
              disabled={statutoryDisabled}
              checkedChildren="ขึ้นทะเบียน"
              unCheckedChildren="ไม่ขึ้นทะเบียน"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Text type="secondary">
            บริษัทประกันสังคมสามารถเป็นคนละนิติบุคคลกับบริษัทเงินเดือนหรือบริษัทนำส่งภาษีได้
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
