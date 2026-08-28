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
  Typography,
} from "antd";

import LazyPayrollPeriodCompanySelect from "./LazyPayrollPeriodCompanySelect";
import LazyPayrollPeriodGroupSelect from "./LazyPayrollPeriodGroupSelect";

const {
  Text,
} = Typography;

const {
  TextArea,
} = Input;

const STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Draft - ยังไม่เปิดงวด",
  },
  {
    value: "open",
    label: "Open - เปิดงวด",
  },
  {
    value: "closed",
    label: "Closed - ปิดงวด",
  },
  {
    value: "processed",
    label: "Processed - ประมวลผลแล้ว",
    disabled: true,
  },
];

export default function PayrollPeriodForm({
  form,
  disabled = false,
  locked = false,
  companyInitialOption = null,
  groupInitialOption = null,
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
      {locked && (
        <Alert
          type="warning"
          showIcon
          title="งวดเงินเดือนนี้ถูก Lock"
          description="ข้อมูลนี้เปิดดูได้ แต่ไม่อนุญาตให้แก้ไขจนกว่า Payroll Process จะปลด Lock ตาม Workflow"
          style={{
            marginBottom: 16,
          }}
        />
      )}

      <Alert
        type="info"
        showIcon
        title="งวดเงินเดือน (Payroll Period)"
        description="ใช้กำหนดช่วงเวลาที่นำข้อมูลมาคำนวณเงินเดือน เช่น งวดเดือน สิงหาคม 2026, วัน Cut-off และวันที่จ่ายจริง จากนั้น Payroll Run จะเลือกงวดนี้ไปประมวลผล"
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
            <LazyPayrollPeriodCompanySelect
              disabled={
                disabled
              }
              initialOption={
                companyInitialOption
              }
              onChange={() => {
                form.setFieldValue(
                  "payroll_group_id",
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
            label="กลุ่มเงินเดือน"
            name="payroll_group_id"
            extra={
              companyId
                ? "แสดงเฉพาะกลุ่มเงินเดือนที่อยู่ในบริษัทที่เลือก"
                : "เลือกบริษัทก่อนเพื่อเลือกกลุ่มเงินเดือน"
            }
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกกลุ่มเงินเดือน",
              },
            ]}
          >
            <LazyPayrollPeriodGroupSelect
              companyId={
                companyId
              }
              disabled={
                disabled ||
                !companyId
              }
              initialOption={
                groupInitialOption
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสงวด"
            name="period_code"
            extra="ตัวอย่าง 2026-08-MONTHLY หรือ 2026-W35"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสงวด",
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
              placeholder="2026-08-MONTHLY"
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
                  "period_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={16}
        >
          <Form.Item
            label="ชื่องวดเงินเดือน"
            name="period_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่องวดเงินเดือน",
              },
            ]}
          >
            <Input
              disabled={
                disabled
              }
              placeholder="เงินเดือนประจำเดือน สิงหาคม 2026"
            />
          </Form.Item>
        </Col>

        <Col
          xs={12}
          md={6}
        >
          <Form.Item
            label="ปีงวด"
            name="period_year"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุปีงวด",
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
          xs={12}
          md={6}
        >
          <Form.Item
            label="ลำดับงวด"
            name="period_no"
            extra="รายเดือนมักใช้ 1-12 / รายสัปดาห์อาจใช้ 1-53"
            rules={[
              {
                required: true,
                message:
                  "กรุณาระบุลำดับงวด",
              },
            ]}
          >
            <InputNumber
              disabled={
                disabled
              }
              min={1}
              max={99}
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
          md={12}
        >
          <Form.Item
            label="สถานะงวด"
            name="status"
            extra="Processed ให้ Payroll Run เป็นผู้เปลี่ยนเมื่อประมวลผลเสร็จ"
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
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="วันที่เริ่มงวด"
            name="period_start_date"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่เริ่มงวด",
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
          md={12}
        >
          <Form.Item
            label="วันที่สิ้นสุดงวด"
            name="period_end_date"
            dependencies={[
              "period_start_date",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่สิ้นสุดงวด",
              },
              ({ getFieldValue }) => ({
                validator(
                  _,
                  value
                ) {
                  const start =
                    getFieldValue(
                      "period_start_date"
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
                      "วันที่สิ้นสุดงวดต้องไม่น้อยกว่าวันที่เริ่มงวด"
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
          md={12}
        >
          <Form.Item
            label="วันที่เริ่ม Cut-off"
            name="cutoff_start_date"
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
          md={12}
        >
          <Form.Item
            label="วันที่สิ้นสุด Cut-off"
            name="cutoff_end_date"
            dependencies={[
              "cutoff_start_date",
            ]}
            rules={[
              ({ getFieldValue }) => ({
                validator(
                  _,
                  value
                ) {
                  const start =
                    getFieldValue(
                      "cutoff_start_date"
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
                      "วันที่สิ้นสุด Cut-off ต้องไม่น้อยกว่าวันที่เริ่ม Cut-off"
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
          md={12}
        >
          <Form.Item
            label="วันที่จ่ายเงิน"
            name="payment_date"
            extra="วันที่พนักงานได้รับเงินเดือนจริง"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันที่จ่ายเงิน",
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
              placeholder="หมายเหตุเพิ่มเติม"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Text
        type="secondary"
      >
        หมายเหตุ: งวดที่ถูก Lock หรือประมวลผลไปแล้วไม่ควรแก้ช่วงวันที่ย้อนหลัง
        เพื่อรักษาความถูกต้องของ Payroll Audit
      </Text>
    </Form>
  );
}
