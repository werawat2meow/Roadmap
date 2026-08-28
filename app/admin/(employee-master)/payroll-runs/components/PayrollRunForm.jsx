"use client";

import {
  Alert,
  Col,
  Form,
  Input,
  Row,
  Select,
} from "antd";

import LazyPayrollRunCompanySelect from "./LazyPayrollRunCompanySelect";
import LazyPayrollRunPeriodSelect from "./LazyPayrollRunPeriodSelect";

const {
  TextArea,
} = Input;

const RUN_TYPE_OPTIONS = [
  {
    value: "regular",
    label: "Regular - เงินเดือนปกติ",
  },
  {
    value: "adjustment",
    label: "Adjustment - ปรับย้อนหลัง/แก้ไข",
  },
  {
    value: "bonus",
    label: "Bonus - โบนัส",
  },
  {
    value: "final",
    label: "Final - งวดสุดท้าย/Final Pay",
  },
];

export default function PayrollRunForm({
  form,
  disabled = false,
  companyInitialOption = null,
  periodInitialOption = null,
  onFinish,
}) {
  const companyId =
    Form.useWatch(
      "company_id",
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
        title="Payroll Run"
        description="เลือก Company และ Payroll Period ที่ต้องการประมวลผล ระบบจะดึง Payroll Group จากงวดอัตโนมัติ จากนั้นใช้ Prepare เพื่อ Snapshot พนักงาน และ Process เพื่อคำนวณผล"
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
            <LazyPayrollRunCompanySelect
              disabled={
                disabled
              }
              initialOption={
                companyInitialOption
              }
              onChange={() => {
                form.setFieldValue(
                  "payroll_period_id",
                  undefined
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="งวดเงินเดือน"
            name="payroll_period_id"
            extra={
              companyId
                ? "เลือกได้เฉพาะงวด Draft / Open ของบริษัทนี้"
                : "เลือกบริษัทก่อน"
            }
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกงวดเงินเดือน",
              },
            ]}
          >
            <LazyPayrollRunPeriodSelect
              companyId={
                companyId
              }
              disabled={
                disabled ||
                !companyId
              }
              initialOption={
                periodInitialOption
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัส Payroll Run"
            name="run_code"
            extra="เช่น PR-2026-08-REG"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัส Payroll Run",
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
              placeholder="PR-2026-08-REG"
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
                  "run_code",
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
            label="ชื่อ Payroll Run"
            name="run_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อ Payroll Run",
              },
            ]}
          >
            <Input
              disabled={
                disabled
              }
              placeholder="ประมวลผลเงินเดือน สิงหาคม 2026"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={6}
        >
          <Form.Item
            label="ประเภท Run"
            name="run_type"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภท Run",
              },
            ]}
          >
            <Select
              disabled={
                disabled
              }
              options={
                RUN_TYPE_OPTIONS
              }
            />
          </Form.Item>
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
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
