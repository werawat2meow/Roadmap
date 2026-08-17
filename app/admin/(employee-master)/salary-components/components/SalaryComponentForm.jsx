"use client";

import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

const { TextArea } = Input;

export default function SalaryComponentForm({
  form,
  disabled = false,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={16}>
        {/* =========================
            Component Code
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="รหัสรายการ"
            name="component_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสรายการ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="SALARY"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Component Name
        ========================= */}

        <Col xs={24} md={16}>
          <Form.Item
            label="ชื่อรายการเงินเดือน"
            name="component_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อรายการเงินเดือน",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="เงินเดือน"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Component Type
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="ประเภทรายการ"
            name="component_type"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภทรายการ",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={[
                {
                  value: "earning",
                  label: "เงินได้",
                },
                {
                  value: "deduction",
                  label: "รายการหัก",
                },
                {
                  value: "employer",
                  label: "นายจ้างสมทบ",
                },
              ]}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Calculation Type
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="วิธีการคำนวณ"
            name="calculation_type"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวิธีการคำนวณ",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={[
                {
                  value: "fixed",
                  label: "จำนวนเงินคงที่",
                },
                {
                  value: "percentage",
                  label: "เปอร์เซ็นต์",
                },
                {
                  value: "formula",
                  label: "สูตรคำนวณ",
                },
              ]}
            />
          </Form.Item>
        </Col>

        {/* =========================
            GL Code
        ========================= */}

        <Col xs={24} md={12}>
          <Form.Item
            label="รหัสบัญชี (GL Code)"
            name="accounting_code"
          >
            <Input
              disabled={disabled}
              placeholder="510001"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Sort Order
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="ลำดับ"
            name="sort_order"
          >
            <InputNumber
              disabled={disabled}
              style={{
                width: "100%",
              }}
              min={0}
            />
          </Form.Item>
        </Col>

        {/* =========================
            Status
        ========================= */}

        <Col xs={24} md={6}>
          <Form.Item
            label="สถานะ"
            name="status"
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
                  label: "ยกเลิก",
                },
              ]}
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
              disabled={disabled}
              rows={4}
              placeholder="รายละเอียดเพิ่มเติม..."
            />
          </Form.Item>
        </Col>

        {/* =========================
            Taxable
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="นำไปคำนวณภาษี"
            name="taxable"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ใช่"
              unCheckedChildren="ไม่"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Social Security
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="นำไปคิดประกันสังคม"
            name="social_security"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ใช่"
              unCheckedChildren="ไม่"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Provident Fund
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="นำไปคิดกองทุนสำรองเลี้ยงชีพ"
            name="provident_fund"
            valuePropName="checked"
          >
            <Switch
              disabled={disabled}
              checkedChildren="ใช่"
              unCheckedChildren="ไม่"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}