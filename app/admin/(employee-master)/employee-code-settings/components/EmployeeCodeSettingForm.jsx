"use client";

import {
  Alert,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  CalendarOutlined,
  CodeOutlined,
  CrownOutlined,
  FieldTimeOutlined,
  NumberOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import {
  useMemo,
} from "react";

import dayjs from "dayjs";

const { TextArea } = Input;
const { Text } = Typography;

/* =========================================================
   Options
========================================================= */

const yearDigitOptions = [
  {
    label: "2 หลัก เช่น 26",
    value: 2,
  },
  {
    label: "4 หลัก เช่น 2026",
    value: 4,
  },
];

const resetPolicyOptions = [
  {
    label: "ไม่รีเซ็ตเลข Running",
    value: "never",
  },
  {
    label: "รีเซ็ตทุกปี",
    value: "yearly",
  },
  {
    label: "รีเซ็ตทุกเดือน",
    value: "monthly",
  },
];

const statusOptions = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

/* =========================================================
   Helpers
========================================================= */

function buildPreview(values = {}) {
  const pattern =
    values.code_pattern ||
    "{TYPE}{YY}{RUNNING}";

  const runningDigits =
    Number(values.running_digits) || 4;

  const runningStart =
    Number(values.running_start) || 1;

  const runningText = String(
    runningStart
  ).padStart(
    runningDigits,
    "0"
  );

  const effectiveDate =
    values.effective_date &&
    dayjs(values.effective_date).isValid()
      ? dayjs(values.effective_date)
      : dayjs();

  const typeDigit =
    values.thai_digit || "1";

  const companyCode = "COMPANY";

  return pattern
    .replaceAll(
      "{TYPE}",
      typeDigit
    )
    .replaceAll(
      "{YYYY}",
      effectiveDate.format("YYYY")
    )
    .replaceAll(
      "{YY}",
      effectiveDate.format("YY")
    )
    .replaceAll(
      "{MM}",
      effectiveDate.format("MM")
    )
    .replaceAll(
      "{RUNNING}",
      runningText
    )
    .replaceAll(
      "{COMPANY}",
      companyCode
    );
}

/* =========================================================
   Component
========================================================= */

export default function EmployeeCodeSettingForm({
  form,

  companies = [],

  companyLoading = false,

  disabled = false,

  onFinish,
}) {

  const watchedValues =
    Form.useWatch([], form) || {};

  const preview = useMemo(
    () =>
      buildPreview(
        watchedValues
      ),
    [watchedValues]
  );

  const companyOptions =
    companies.map((company) => ({
      value: company.id,

      label: company.company_code
        ? `${company.company_code} - ${
            company.company_name_th ||
            company.company_name_en ||
            "-"
          }`
        : company.company_name_th ||
          company.company_name_en ||
          "-",
    }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        code_name: "DEFAULT",

        code_pattern:
          "{TYPE}{YY}{RUNNING}",

        running_digits: 4,

        year_digits: 2,

        executive_digit: "9",

        thai_digit: "1",

        non_b_digit: "2",

        myanmar_digit: "3",

        parttime_digit: "4",

        running_start: 1,

        reset_policy: "yearly",

        is_default: false,

        effective_date: dayjs(),

        expire_date: null,

        status: "active",

        remark: "",
      }}
    >
      {/* ===================================================
          General
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ApartmentOutlined />

          ข้อมูลรูปแบบรหัส
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={companyLoading}
              disabled={disabled}
              placeholder="เลือกบริษัท"
              options={companyOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ชื่อรูปแบบรหัส"
            name="code_name"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกชื่อรูปแบบรหัส",
              },
              {
                max: 100,
                message:
                  "ชื่อรูปแบบต้องไม่เกิน 100 ตัวอักษร",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="เช่น DEFAULT หรือ HEAD_OFFICE"
              maxLength={100}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รูปแบบรหัสพนักงาน"
            name="code_pattern"
            extra="รองรับ {TYPE}, {YY}, {YYYY}, {MM}, {RUNNING} และ {COMPANY}"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกรูปแบบรหัสพนักงาน",
              },
              {
                validator: (_, value) => {
                  const pattern =
                    String(
                      value || ""
                    );

                  if (
                    !pattern.includes(
                      "{RUNNING}"
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "Pattern ต้องมี {RUNNING}"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              disabled={disabled}
              prefix={<CodeOutlined />}
              placeholder="{TYPE}{YY}{RUNNING}"
            />
          </Form.Item>
        </Col>
      </Row>

      <Alert
        showIcon
        type="info"
        title="ตัวอย่างรหัสพนักงาน"
        description={
          <Space wrap>
            <Text>
              Pattern:
            </Text>

            <Tag>
              {watchedValues.code_pattern ||
                "{TYPE}{YY}{RUNNING}"}
            </Tag>

            <Text>
              ผลลัพธ์ตัวอย่าง:
            </Text>

            <Tag color="blue">
              {preview}
            </Tag>
          </Space>
        }
        className="mb-5"
      />

      {/* ===================================================
          Running
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <NumberOutlined />

          การกำหนดเลข Running
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="จำนวนหลัก Running"
            name="running_digits"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกจำนวนหลัก Running",
              },
              {
                type: "number",
                min: 1,
                max: 12,
                message:
                  "จำนวนหลักต้องอยู่ระหว่าง 1 ถึง 12",
              },
            ]}
          >
            <InputNumber
              min={1}
              max={12}
              precision={0}
              disabled={disabled}
              className="w-full"
              prefix={<NumberOutlined />}
              placeholder="4"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="เลขเริ่มต้น"
            name="running_start"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกเลขเริ่มต้น",
              },
              {
                type: "number",
                min: 1,
                message:
                  "เลขเริ่มต้นต้องไม่น้อยกว่า 1",
              },
            ]}
          >
            <InputNumber
              min={1}
              precision={0}
              disabled={disabled}
              className="w-full"
              placeholder="1"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="จำนวนหลักของปี"
            name="year_digits"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกจำนวนหลักของปี",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={yearDigitOptions}
              placeholder="เลือกจำนวนหลักของปี"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="นโยบายรีเซ็ต Running"
            name="reset_policy"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกนโยบายรีเซ็ต Running",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={
                resetPolicyOptions
              }
              placeholder="เลือกนโยบาย Reset"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="กำหนดเป็นรูปแบบหลัก"
            name="is_default"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="รูปแบบหลัก"
              unCheckedChildren="รูปแบบทั่วไป"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          Employee Types
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <TeamOutlined />

          รหัสประเภทพนักงาน
        </Space>
      </Divider>

      <Alert
        showIcon
        type="warning"
        title="รหัสประเภทพนักงานต้องไม่ซ้ำกัน"
        description="ค่าของผู้บริหาร พนักงานไทย Non-B เมียนมา และ Part-time ต้องเป็นคนละค่า"
        className="mb-5"
      />

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          sm={12}
          lg={8}
        >
          <Form.Item
            label="ผู้บริหาร"
            name="executive_digit"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกรหัสผู้บริหาร",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="9"
              maxLength={10}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
        >
          <Form.Item
            label="พนักงานไทย"
            name="thai_digit"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกรหัสพนักงานไทย",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="1"
              maxLength={10}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
        >
          <Form.Item
            label="พนักงาน Non-B"
            name="non_b_digit"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกรหัส Non-B",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="2"
              maxLength={10}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
        >
          <Form.Item
            label="พนักงานเมียนมา"
            name="myanmar_digit"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกรหัสพนักงานเมียนมา",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="3"
              maxLength={10}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
        >
          <Form.Item
            label="พนักงาน Part-time"
            name="parttime_digit"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  "กรุณากรอกรหัส Part-time",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="4"
              maxLength={10}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          Effective Period
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <CalendarOutlined />

          ช่วงเวลาการใช้งาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="วันที่เริ่มใช้งาน"
            name="effective_date"
            dependencies={["expire_date"]}
            getValueProps={(value) => ({
              value: value
                ? dayjs.isDayjs(value)
                  ? value
                  : dayjs(value)
                : null,
            })}
            normalize={(value) => {
              if (!value) {
                return null;
              }

              return dayjs.isDayjs(value)
                ? value
                : dayjs(value);
            }}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่เริ่มใช้งาน",
              },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const dateValue =
                    dayjs.isDayjs(value)
                      ? value
                      : dayjs(value);

                  if (!dateValue.isValid()) {
                    return Promise.reject(
                      new Error(
                        "วันที่เริ่มใช้งานไม่ถูกต้อง"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="เลือกวันที่เริ่มใช้งาน"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={["effective_date"]}
            getValueProps={(value) => ({
              value: value
                ? dayjs.isDayjs(value)
                  ? value
                  : dayjs(value)
                : null,
            })}
            normalize={(value) => {
              if (!value) {
                return null;
              }

              return dayjs.isDayjs(value)
                ? value
                : dayjs(value);
            }}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const expireDate =
                    dayjs.isDayjs(value)
                      ? value
                      : dayjs(value);

                  if (!expireDate.isValid()) {
                    return Promise.reject(
                      new Error(
                        "วันที่สิ้นสุดไม่ถูกต้อง"
                      )
                    );
                  }

                  const effectiveValue =
                    getFieldValue(
                      "effective_date"
                    );

                  if (!effectiveValue) {
                    return Promise.resolve();
                  }

                  const effectiveDate =
                    dayjs.isDayjs(
                      effectiveValue
                    )
                      ? effectiveValue
                      : dayjs(
                          effectiveValue
                        );

                  if (
                    !effectiveDate.isValid()
                  ) {
                    return Promise.resolve();
                  }

                  if (
                    expireDate.isBefore(
                      effectiveDate,
                      "day"
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้งาน"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              allowClear
              disabled={disabled}
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="ไม่กำหนดวันสิ้นสุด"
              disabledDate={(current) => {
                if (!current) {
                  return false;
                }

                const effectiveValue =
                  form.getFieldValue(
                    "effective_date"
                  );

                if (!effectiveValue) {
                  return false;
                }

                const effectiveDate =
                  dayjs.isDayjs(
                    effectiveValue
                  )
                    ? effectiveValue
                    : dayjs(
                        effectiveValue
                      );

                if (
                  !effectiveDate.isValid()
                ) {
                  return false;
                }

                return current.isBefore(
                  effectiveDate,
                  "day"
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
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
              disabled={disabled}
              options={statusOptions}
              placeholder="เลือกสถานะ"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          Remark
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <FieldTimeOutlined />

          หมายเหตุ
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              disabled={disabled}
              rows={4}
              maxLength={500}
              showCount={!disabled}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับรูปแบบรหัสพนักงาน"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}