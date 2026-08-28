"use client";

import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

import LazySocialSecurityCompanySelect from "./LazySocialSecurityCompanySelect";

const {
  TextArea,
} = Input;

const SCHEME_OPTIONS = [
  {
    value:
      "section_33",
    label:
      "มาตรา 33",
  },
  {
    value:
      "section_39",
    label:
      "มาตรา 39",
  },
  {
    value:
      "section_40",
    label:
      "มาตรา 40",
  },
  {
    value:
      "custom",
    label:
      "Custom",
  },
];

const METHOD_OPTIONS = [
  {
    value:
      "percentage",
    label:
      "Percentage - คิดเป็นเปอร์เซ็นต์",
  },
  {
    value:
      "fixed",
    label:
      "Fixed - จำนวนเงินคงที่",
  },
];

const STATUS_OPTIONS = [
  {
    value:
      "active",
    label:
      "Active",
  },
  {
    value:
      "inactive",
    label:
      "Inactive",
  },
];

function MoneyInput({
  disabled,
}) {
  return (
    <InputNumber
      disabled={
        disabled
      }
      min={0}
      precision={2}
      style={{
        width: "100%",
      }}
      formatter={(
        value
      ) =>
        value ===
          null ||
        value ===
          undefined
          ? ""
          : String(
              value
            ).replace(
              /\B(?=(\d{3})+(?!\d))/g,
              ","
            )
      }
      parser={(
        value
      ) =>
        String(
          value || ""
        ).replace(
          /,/g,
          ""
        )
      }
    />
  );
}

export default function SocialSecurityForm({
  form,
  disabled = false,
  companyInitialOption = null,
  onFinish,
}) {
  const method =
    Form.useWatch(
      "contribution_method",
      form
    );

  const status =
    Form.useWatch(
      "status",
      form
    );

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Alert
        type="info"
        showIcon
        title="การตั้งค่าประกันสังคม"
        description="เก็บอัตราเงินสมทบและฐานค่าจ้างแบบ Version ตาม Effective Date เพื่อให้ Payroll Engine ย้อนกลับไปคำนวณตามกฎที่มีผลในแต่ละช่วงเวลาได้ โดยไม่ทับประวัติเดิม"
        style={{
          marginBottom: 16,
        }}
      />

      <Row
        gutter={[
          16,
          0,
        ]}
      >
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            extra="แสดงตาม Company Scope ของผู้ใช้งาน"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <LazySocialSecurityCompanySelect
              disabled={
                disabled
              }
              initialOption={
                companyInitialOption
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ประเภทผู้ประกันตน"
            name="scheme_type"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภท",
              },
            ]}
          >
            <Select
              disabled={
                disabled
              }
              options={
                SCHEME_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="สถานะ"
            name="status"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะ",
              },
            ]}
          >
            <Select
              disabled={
                disabled
              }
              options={
                STATUS_OPTIONS
              }
              onChange={(
                value
              ) => {
                if (
                  value !==
                  "active"
                ) {
                  form.setFieldValue(
                    "is_default",
                    false
                  );
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสการตั้งค่า"
            name="setting_code"
            extra="เช่น SSO33-2026"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสการตั้งค่า",
              },
              {
                pattern:
                  /^[A-Z0-9][A-Z0-9_-]*$/,
                message:
                  "ใช้เฉพาะ A-Z, 0-9, _ และ -",
              },
            ]}
          >
            <Input
              disabled={
                disabled
              }
              placeholder="SSO33-2026"
              onChange={(
                event
              ) => {
                const value =
                  String(
                    event
                      ?.target
                      ?.value ||
                    ""
                  )
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_-]/g,
                      "_"
                    )
                    .replace(
                      /_+/g,
                      "_"
                    );

                form.setFieldValue(
                  "setting_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={10}
        >
          <Form.Item
            label="ชื่อการตั้งค่า"
            name="setting_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อการตั้งค่า",
              },
            ]}
          >
            <Input
              disabled={
                disabled
              }
              placeholder="ประกันสังคม มาตรา 33 ปี 2026"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="วิธีคำนวณ"
            name="contribution_method"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวิธีคำนวณ",
              },
            ]}
          >
            <Select
              disabled={
                disabled
              }
              options={
                METHOD_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ฐานค่าจ้างขั้นต่ำ"
            name="wage_base_min"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุฐานขั้นต่ำ",
              },
            ]}
          >
            <MoneyInput
              disabled={
                disabled
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ฐานค่าจ้างสูงสุด"
            name="wage_base_max"
            dependencies={[
              "wage_base_min",
            ]}
            extra="เว้นว่าง = ไม่มีเพดาน"
            rules={[
              ({ getFieldValue }) => ({
                validator(
                  _,
                  value
                ) {
                  const min =
                    Number(
                      getFieldValue(
                        "wage_base_min"
                      ) || 0
                    );

                  if (
                    value ===
                      null ||
                    value ===
                      undefined ||
                    value ===
                      "" ||
                    Number(value) >=
                      min
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "ฐานค่าจ้างสูงสุดต้องไม่น้อยกว่าฐานขั้นต่ำ"
                    )
                  );
                },
              }),
            ]}
          >
            <MoneyInput
              disabled={
                disabled
              }
            />
          </Form.Item>
        </Col>

        {method ===
          "percentage" && (
          <>
            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="อัตราพนักงาน (%)"
                name="employee_rate_percent"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุอัตราพนักงาน",
                  },
                ]}
              >
                <InputNumber
                  disabled={
                    disabled
                  }
                  min={0}
                  max={100}
                  precision={4}
                  suffix="%"
                  style={{
                    width:
                      "100%",
                  }}
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="อัตรานายจ้าง (%)"
                name="employer_rate_percent"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุอัตรานายจ้าง",
                  },
                ]}
              >
                <InputNumber
                  disabled={
                    disabled
                  }
                  min={0}
                  max={100}
                  precision={4}
                  suffix="%"
                  style={{
                    width:
                      "100%",
                  }}
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="เงินสมทบพนักงานขั้นต่ำ"
                name="employee_contribution_min"
              >
                <MoneyInput
                  disabled={
                    disabled
                  }
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="เงินสมทบพนักงานสูงสุด"
                name="employee_contribution_max"
              >
                <MoneyInput
                  disabled={
                    disabled
                  }
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="เงินสมทบนายจ้างขั้นต่ำ"
                name="employer_contribution_min"
              >
                <MoneyInput
                  disabled={
                    disabled
                  }
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="เงินสมทบนายจ้างสูงสุด"
                name="employer_contribution_max"
              >
                <MoneyInput
                  disabled={
                    disabled
                  }
                />
              </Form.Item>
            </Col>
          </>
        )}

        {method ===
          "fixed" && (
          <>
            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="เงินสมทบพนักงานคงที่"
                name="fixed_employee_amount"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุจำนวนเงิน",
                  },
                ]}
              >
                <MoneyInput
                  disabled={
                    disabled
                  }
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={6}
            >
              <Form.Item
                label="เงินสมทบนายจ้างคงที่"
                name="fixed_employer_amount"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาระบุจำนวนเงิน",
                  },
                ]}
              >
                <MoneyInput
                  disabled={
                    disabled
                  }
                />
              </Form.Item>
            </Col>
          </>
        )}

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่มีผล"
            name="effective_date"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่มีผล",
              },
            ]}
          >
            <DatePicker
              disabled={
                disabled
              }
              format="DD/MM/YYYY"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={[
              "effective_date",
            ]}
            extra="เว้นว่าง = ยังไม่มีวันสิ้นสุด"
            rules={[
              ({ getFieldValue }) => ({
                validator(
                  _,
                  value
                ) {
                  const start =
                    getFieldValue(
                      "effective_date"
                    );

                  if (
                    !start ||
                    !value ||
                    !value.isBefore(
                      start,
                      "day"
                    )
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่มีผล"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker
              disabled={
                disabled
              }
              format="DD/MM/YYYY"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Default ของประเภทนี้"
            name="is_default"
            valuePropName="checked"
            extra="1 บริษัท + 1 ประเภทผู้ประกันตน มี Active Default ได้ 1 ชุด"
          >
            <Switch
              disabled={
                disabled ||
                status !==
                  "active"
              }
              checkedChildren="Default"
              unCheckedChildren="ไม่ใช่"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              disabled={
                disabled
              }
              rows={3}
              maxLength={1000}
              showCount
              placeholder="หมายเหตุ เช่น เอกสารอ้างอิง / ประกาศ / เงื่อนไข"
            />
          </Form.Item>
        </Col>
      </Row>

      <Alert
        type="warning"
        showIcon
        title="ไม่ควรแก้อัตราเก่าทับย้อนหลัง"
        description="เมื่ออัตรา/ฐานค่าจ้างเปลี่ยน ให้สร้าง Version ใหม่พร้อม Effective Date เพื่อให้ Payroll Audit และการคำนวณย้อนหลังถูกต้อง"
      />
    </Form>
  );
}
