"use client";

import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

import LazyDeductionTypeCompanySelect from "./LazyDeductionTypeCompanySelect";

const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { value: "tax", label: "ภาษี" },
  { value: "social_security", label: "ประกันสังคม" },
  { value: "provident_fund", label: "กองทุนสำรองเลี้ยงชีพ" },
  { value: "loan", label: "เงินกู้ / เงินยืม" },
  { value: "absence", label: "ขาดงาน / ลางาน / มาสาย" },
  { value: "other", label: "รายการหักอื่น ๆ" },
];

const CALCULATION_OPTIONS = [
  { value: "fixed", label: "จำนวนคงที่" },
  { value: "variable", label: "จำนวนเปลี่ยนแปลง" },
  { value: "formula", label: "คำนวณจากสูตร" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
];

export default function DeductionTypeForm({
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

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <LazyDeductionTypeCompanySelect
              disabled={disabled}
              initialOption={
                companyInitialOption
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="รหัสประเภทรายการหัก"
            name="deduction_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสประเภทรายการหัก",
              },
              {
                max: 50,
                message:
                  "รหัสต้องไม่เกิน 50 ตัวอักษร",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="TAX"
              onChange={(event) => {
                const value = String(
                  event?.target?.value || ""
                ).toUpperCase();

                form.setFieldValue(
                  "deduction_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ลำดับ"
            name="sort_order"
          >
            <InputNumber
              disabled={disabled}
              min={0}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ชื่อประเภทรายการหัก"
            name="deduction_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อประเภทรายการหัก",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="ภาษีเงินได้หัก ณ ที่จ่าย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="หมวดรายการหัก"
            name="deduction_category"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกหมวดรายการหัก",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={CATEGORY_OPTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="สถานะ"
            name="status"
            rules={[
              { required: true },
            ]}
          >
            <Select
              disabled={disabled}
              options={STATUS_OPTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
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
              disabled={disabled}
              options={CALCULATION_OPTIONS}
              onChange={(value) => {
                if (value !== "fixed") {
                  form.setFieldValue(
                    "default_amount",
                    null
                  );
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="จำนวนเงินเริ่มต้น"
            name="default_amount"
            rules={[
              {
                validator: (_, value) => {
                  if (
                    calculationMethod !==
                    "fixed"
                  ) {
                    return Promise.resolve();
                  }

                  if (
                    value === null ||
                    value === undefined ||
                    value === ""
                  ) {
                    return Promise.reject(
                      new Error(
                        "กรุณาระบุจำนวนเงินเริ่มต้น"
                      )
                    );
                  }

                  if (Number(value) < 0) {
                    return Promise.reject(
                      new Error(
                        "จำนวนเงินต้องไม่น้อยกว่า 0"
                      )
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              disabled={
                disabled ||
                calculationMethod !== "fixed"
              }
              min={0}
              precision={2}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="สถานะการจ่าย"
            name="is_recurring"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ประจำ"
              unCheckedChildren="ครั้งคราว"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="วันที่เริ่มใช้"
            name="effective_date"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่เริ่มใช้",
              },
            ]}
          >
            <DatePicker
              disabled={disabled}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="วันที่สิ้นสุด"
            name="expire_date"
            dependencies={[
              "effective_date",
            ]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start =
                    getFieldValue(
                      "effective_date"
                    );

                  if (
                    !value ||
                    !start ||
                    !value.isBefore(
                      start,
                      "day"
                    )
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้"
                    )
                  );
                },
              }),
            ]}
          >
            <DatePicker
              disabled={disabled}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            label="รายการหักตามกฎหมาย"
            name="is_statutory"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            label="ลดฐานภาษี"
            name="reduce_taxable_income"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            label="หักจาก Net Pay"
            name="include_in_net_pay"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              disabled={disabled}
              rows={3}
              placeholder="รายละเอียดประเภทรายการหัก"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              disabled={disabled}
              rows={2}
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
