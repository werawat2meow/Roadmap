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

import LazyTaxRateCompanySelect from "./LazyTaxRateCompanySelect";
import TaxRateBracketEditor from "./TaxRateBracketEditor";

const {
  TextArea,
} = Input;

const METHOD_OPTIONS = [
  {
    value:
      "progressive",
    label:
      "Progressive - ขั้นบันได",
  },
  {
    value:
      "flat",
    label:
      "Flat Rate - อัตราเดียว",
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

export default function TaxRateForm({
  form,
  disabled = false,
  companyInitialOption = null,
  onFinish,
}) {
  const calculationMethod =
    Form.useWatch(
      "calculation_method",
      form
    );

  const status =
    Form.useWatch(
      "status",
      form
    );

  function handleMethodChange(
    value
  ) {
    if (
      value !==
      "flat"
    ) {
      return;
    }

    const rows =
      form.getFieldValue(
        "brackets"
      ) || [];

    const first =
      rows[0] || {
        income_min: 0,
        income_max: null,
        tax_rate_percent:
          0,
      };

    form.setFieldValue(
      "brackets",
      [
        {
          income_min:
            first.income_min ??
            0,

          income_max:
            first.income_max ??
            null,

          tax_rate_percent:
            first
              .tax_rate_percent ??
            0,
        },
      ]
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Alert
        type="info"
        showIcon
        title="ชุดอัตราภาษี (Tax Rate Set)"
        description="เก็บอัตราภาษีแบบมี Version ตามปีและช่วงวันที่มีผล โดย Progressive จะมีหลายขั้นรายได้ ส่วน Flat Rate ใช้อัตราเดียว การเปลี่ยนอัตราในปีใหม่ควรสร้างชุดใหม่แทนการทับประวัติเดิม"
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
            <LazyTaxRateCompanySelect
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
            label="ปีภาษี"
            name="tax_year"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุปีภาษี",
              },
            ]}
          >
            <InputNumber
              disabled={
                disabled
              }
              min={2000}
              max={2200}
              precision={0}
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
            label="รหัสชุดอัตราภาษี"
            name="tax_rate_code"
            extra="เช่น PIT-2026"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสชุดอัตราภาษี",
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
              placeholder="PIT-2026"
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
                  "tax_rate_code",
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
            label="ชื่อชุดอัตราภาษี"
            name="tax_rate_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อชุดอัตราภาษี",
              },
            ]}
          >
            <Input
              disabled={
                disabled
              }
              placeholder="อัตราภาษีเงินได้บุคคลธรรมดา ปี 2026"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="วิธีคำนวณ"
            name="calculation_method"
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
              onChange={
                handleMethodChange
              }
            />
          </Form.Item>
        </Col>

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
                width:
                  "100%",
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
                width:
                  "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Default ของปีนี้"
            name="is_default"
            valuePropName="checked"
            extra="เมื่อเปิด ระบบจะยกเลิก Default ชุดอื่นของบริษัท/ปีเดียวกัน"
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

        <Col
          xs={24}
        >
          <div
            style={{
              marginBottom: 20,
            }}
          >
            <TaxRateBracketEditor
              form={form}
              disabled={
                disabled
              }
            />
          </div>
        </Col>

        <Col
          xs={24}
        >
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
              placeholder="หมายเหตุเพิ่มเติม เช่น เลขที่ประกาศ / เงื่อนไขการใช้งาน"
            />
          </Form.Item>
        </Col>
      </Row>

      {calculationMethod ===
        "progressive" && (
        <Alert
          type="warning"
          showIcon
          title="ตรวจช่วงรายได้ก่อนบันทึก"
          description="ช่วงรายได้ต้องไม่ซ้อนกัน และขั้นที่ income_max เว้นว่างต้องเป็นขั้นสุดท้าย ระบบ Backend จะตรวจซ้ำอีกครั้งก่อนบันทึก"
        />
      )}
    </Form>
  );
}
