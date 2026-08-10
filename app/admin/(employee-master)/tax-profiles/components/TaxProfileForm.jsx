"use client";

import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";

const { TextArea } = Input;

export default function TaxProfileForm({
  form,
  companies = [],
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
            Tax Profile Code
        ========================= */}
        <Col xs={24} md={8}>
          <Form.Item
            label="รหัสโปรไฟล์ภาษี"
            name="tax_profile_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสโปรไฟล์ภาษี",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="เช่น TAX2026"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Tax Profile Name
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="ชื่อโปรไฟล์ภาษี"
            name="tax_profile_name"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อโปรไฟล์ภาษี",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="ชื่อโปรไฟล์ภาษี"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Company
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="บริษัท"
            name="company_id"
          >
            <Select
              allowClear
              disabled={disabled}
              placeholder="เลือกบริษัท"
              options={companies.map((item) => ({
                value: item.id,
                label: `${item.company_code} - ${item.company_name_th}`,
              }))}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Tax Year
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="ปีภาษี"
            name="tax_year"
            rules={[
              {
                required: true,
                message: "กรุณาระบุปีภาษี",
              },
            ]}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              placeholder="2569"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Calculation Method
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="วิธีคำนวณภาษี"
            name="calculation_method"
            initialValue="progressive"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  value: "progressive",
                  label: "อัตราก้าวหน้า",
                },
                {
                  value: "fixed",
                  label: "อัตราคงที่",
                },
              ]}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  value: "active",
                  label: "ใช้งาน",
                },
                {
                  value: "inactive",
                  label: "ไม่ใช้งาน",
                },
              ]}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Personal Allowance
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="ค่าลดหย่อนส่วนตัว"
            name="personal_allowance"
            initialValue={60000}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Spouse Allowance
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="ค่าลดหย่อนคู่สมรส"
            name="spouse_allowance"
            initialValue={0}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Child Allowance
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="ค่าลดหย่อนบุตร"
            name="child_allowance"
            initialValue={0}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Parent Allowance
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="ค่าลดหย่อนบิดามารดา"
            name="parent_allowance"
            initialValue={0}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Social Security Max
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="เพดานประกันสังคม"
            name="social_security_max"
            initialValue={9000}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Provident Fund Max
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="เพดานกองทุนสำรองฯ"
            name="provident_fund_max"
            initialValue={500000}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Effective From
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="วันที่เริ่มใช้"
            name="effective_from"
          >
            <DatePicker
              disabled={disabled}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Effective To
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="วันที่สิ้นสุด"
            name="effective_to"
          >
            <DatePicker
              disabled={disabled}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
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
              disabled={disabled}
              rows={4}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </Form.Item>
        </Col>

      </Row>
    </Form>
  );
}