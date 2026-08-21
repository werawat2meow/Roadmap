"use client";

import { Alert, Col, Divider, Form, Input, InputNumber, Row, Select, Switch } from "antd";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "./EarningTypeSearch";

const { TextArea } = Input;

export const INITIAL_EARNING_TYPE_VALUES = {
  earning_type_code: "",
  earning_type_name_th: "",
  earning_type_name_en: "",
  description: "",
  earning_category: "other",
  is_taxable: true,
  is_social_security_base: false,
  is_provident_fund_base: false,
  is_recurring: false,
  is_proratable: false,
  sort_order: 0,
  status: "active",
};

export default function EarningTypeForm({ form, mode = "create", disabled = false }) {
  const readOnly = mode === "view";
  return (
    <>
      <Alert
        type="info"
        showIcon
        title="ประเภทเงินได้เป็น Master สำหรับจัดหมวดรายการรายได้ใน Payroll"
        description="สูตรคำนวณและรายการเงินจริงควรจัดการใน Salary Components / Payroll Formulas"
        className="mb-4"
      />
      <Form form={form} layout="vertical" disabled={disabled || readOnly} initialValues={INITIAL_EARNING_TYPE_VALUES}>
        <Divider titlePlacement="left">ข้อมูลประเภทเงินได้</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="รหัสประเภทเงินได้" name="earning_type_code" rules={[{ required: true, message: "กรุณากรอกรหัสประเภทเงินได้" }]}>
              <Input maxLength={50} placeholder="เช่น SALARY" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="ชื่อภาษาไทย" name="earning_type_name_th" rules={[{ required: true, message: "กรุณากรอกชื่อประเภทเงินได้" }]}>
              <Input maxLength={150} placeholder="เช่น เงินเดือน" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="ชื่อภาษาอังกฤษ" name="earning_type_name_en"><Input maxLength={150} placeholder="เช่น Salary" /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="หมวดรายได้" name="earning_category" rules={[{ required: true, message: "กรุณาเลือกหมวดรายได้" }]}>
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="ลำดับ" name="sort_order"><InputNumber min={0} precision={0} className="w-full" /></Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="สถานะ" name="status"><Select options={STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="รายละเอียด" name="description"><TextArea rows={3} maxLength={500} showCount /></Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">Payroll / Statutory</Divider>
        <Row gutter={[16, 4]}>
          <Col xs={24} md={8}><Form.Item label="อยู่ในฐานภาษี" name="is_taxable" valuePropName="checked"><Switch checkedChildren="ใช่" unCheckedChildren="ไม่" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label="ฐานประกันสังคม" name="is_social_security_base" valuePropName="checked"><Switch checkedChildren="ใช่" unCheckedChildren="ไม่" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label="ฐานกองทุนสำรองเลี้ยงชีพ" name="is_provident_fund_base" valuePropName="checked"><Switch checkedChildren="ใช่" unCheckedChildren="ไม่" /></Form.Item></Col>
        </Row>

        <Divider titlePlacement="left">พฤติกรรมการคำนวณ</Divider>
        <Row gutter={[16, 4]}>
          <Col xs={24} md={12}><Form.Item label="รายการประจำ" name="is_recurring" valuePropName="checked"><Switch checkedChildren="ประจำ" unCheckedChildren="ไม่ประจำ" /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="รองรับ Prorate" name="is_proratable" valuePropName="checked"><Switch checkedChildren="รองรับ" unCheckedChildren="ไม่รองรับ" /></Form.Item></Col>
        </Row>
      </Form>
    </>
  );
}
