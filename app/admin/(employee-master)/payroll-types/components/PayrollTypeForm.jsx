"use client";

import { Col, Form, Input, Row, Select } from "antd";

import {
  SortOrderField,
  StatusSelect,
} from "@/app/components/forms";

const frequencyOptions = [
  {
    value: "monthly",
    label: "รายเดือน",
  },
  {
    value: "weekly",
    label: "รายสัปดาห์",
  },
  {
    value: "biweekly",
    label: "ทุก 2 สัปดาห์",
  },
  {
    value: "daily",
    label: "รายวัน",
  },
];

const paymentOffsetOptions = [
  {
    value: 0,
    label: "เดือนเดียวกัน",
  },
  {
    value: 1,
    label: "เดือนถัดไป",
  },
];

const { TextArea } = Input;

export default function PayrollTypeForm({
  form,
  disabled = false,
  onFinish,
}) {
  const frequency =
    Form.useWatch(
      "payment_frequency",
      form
    ) || "monthly";

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Row gutter={16}>
        {/* =========================
            Payroll Code
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="รหัส Payroll"
            name="payroll_type_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัส Payroll",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="MONTHLY"
              style={{
                textTransform:
                  "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payroll Name
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="ชื่อ Payroll"
            name="payroll_type_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อ Payroll",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Monthly Salary"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Description
        ========================= */}

        <Col span={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              disabled={disabled}
              placeholder="รายละเอียด Payroll"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payment Frequency
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="ความถี่การจ่าย"
            name="payment_frequency"
            initialValue="monthly"
          >
            <Select
              disabled={disabled}
              options={
                frequencyOptions
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payment Day
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="วันจ่าย"
            name="default_payment_day"
          >
            <Input
              type="number"
              min={1}
              max={31}
              disabled={
                disabled ||
                frequency !==
                  "monthly"
              }
              placeholder="30"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Cutoff End Day
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="วันสิ้นสุดรอบ"
            name="cutoff_end_day"
          >
            <Input
              type="number"
              min={1}
              max={31}
              disabled={
                disabled ||
                frequency !==
                  "monthly"
              }
              placeholder="25"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payment Offset
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="เดือนที่จ่าย"
            name="payment_offset_month"
            initialValue={0}
          >
            <Select
              disabled={disabled}
              options={
                paymentOffsetOptions
              }
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={6}>
          <StatusSelect
            name="status"
            initialValue="active"
          />
        </Col>

        {/* =========================
            Sort Order
        ========================= */}

        <Col xs={24} md={6}>
          <SortOrderField
            name="sort_order"
            initialValue={0}
          />
        </Col>
      </Row>
    </Form>
  );
}