"use client";

import {
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
} from "antd";

const { TextArea } = Input;

const frequencyOptions = [
  {
    label: "รายเดือน",
    value: "monthly",
  },
  {
    label: "รายสัปดาห์",
    value: "weekly",
  },
  {
    label: "ทุก 2 สัปดาห์",
    value: "biweekly",
  },
  {
    label: "รายวัน",
    value: "daily",
  },
];

const statusOptions = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ยกเลิก",
    value: "inactive",
  },
];

export default function PayrollGroupForm({
  form,
  payrollCompanies = [],
  disabled = false,
  onFinish,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish} 
    >
      <Row gutter={16}>
        {/* =========================
            Payroll Group Code
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="รหัสกลุ่มเงินเดือน"
            name="payroll_group_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสกลุ่มเงินเดือน",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="PG001"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payroll Group Name
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="ชื่อกลุ่มเงินเดือน"
            name="payroll_group_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อกลุ่มเงินเดือน",
              },
            ]}
          >
            <Input
              placeholder="พนักงานประจำ"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payroll Company
        ========================= */}

        <Col xs={24}>
          <Form.Item
            label="บริษัทเงินเดือน"
            name="payroll_company_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัทเงินเดือน",
              },
            ]}
          >
            <Select
              showSearch
              placeholder="เลือกบริษัทเงินเดือน"
              optionFilterProp="label"
              options={payrollCompanies.map(
                (item) => ({
                  value: item.id,
                  label: `${item.payroll_company_code} - ${item.payroll_company_name}`,
                })
              )}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payment Day
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="วันที่จ่ายเงิน"
            name="payment_day"
          >
            <InputNumber
              min={1}
              max={31}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Cutoff
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="วันสิ้นสุดรอบ"
            name="cutoff_end_day"
          >
            <InputNumber
              min={1}
              max={31}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Frequency
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="รอบการจ่าย"
            name="payment_frequency"
            initialValue="monthly"
          >
            <Select
              options={frequencyOptions}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Offset Month
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="เลื่อนเดือน"
            name="payment_offset_month"
            initialValue={0}
          >
            <InputNumber
              min={-12}
              max={12}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Sort Order
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="ลำดับ"
            name="sort_order"
            initialValue={0}
          >
            <InputNumber
              min={0}
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select
              options={statusOptions}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Description
        ========================= */}

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={4}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}