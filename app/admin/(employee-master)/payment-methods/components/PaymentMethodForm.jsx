"use client";

import {
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";

const { TextArea } = Input;

export default function PaymentMethodForm({form,disabled = false,onFinish,}) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >

      <Divider titlePlacement="left">
        ข้อมูลทั่วไป
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={6}>
          <Form.Item
            label="รหัสวิธีการจ่ายเงิน"
            name="payment_method_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัสวิธีการจ่ายเงิน",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="BANK_TRANSFER"
              style={{
                textTransform:
                  "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="ชื่อวิธีการจ่ายเงิน"
            name="payment_method_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อวิธีการจ่ายเงิน",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="โอนเงินเข้าบัญชี"
            />
          </Form.Item>
        </Col>

        {/* =========================
            English Name
        ========================= */}

        <Col xs={24} md={9}>
          <Form.Item
            label="ชื่อภาษาอังกฤษ"
            name="payment_method_name_en"
          >
            <Input
              disabled={disabled}
              placeholder="Bank Transfer"
            />
          </Form.Item>
        </Col>

        {/* =========================
            Payment Type
        ========================= */}

        <Col xs={24} md={8}>
          <Form.Item
            label="ประเภทการจ่าย"
            name="payment_type"
            initialValue="bank_transfer"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  label: "Cash",
                  value: "cash",
                },
                {
                  label:
                    "Bank Transfer",
                  value:
                    "bank_transfer",
                },
                {
                  label: "PromptPay",
                  value: "promptpay",
                },
                {
                  label: "Cheque",
                  value: "cheque",
                },
                {
                  label:
                    "Digital Wallet",
                  value: "wallet",
                },
                {
                  label: "Crypto",
                  value: "crypto",
                },
                {
                  label: "Other",
                  value: "other",
                },
              ]}
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

        <Col xs={24} md={8}>
          <Form.Item
            label="สถานะ"
            name="status"
            initialValue="active"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  label: "ใช้งาน",
                  value: "active",
                },
                {
                  label:
                    "ไม่ใช้งาน",
                  value:
                    "inactive",
                },
              ]}
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
              rows={3}
              placeholder="รายละเอียดวิธีการจ่ายเงิน..."
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ต้องระบุธนาคาร"
            name="bank_required"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="รองรับ Payroll"
            name="supports_payroll"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="รองรับ Benefit"
            name="supports_benefit"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="รองรับ Expense"
            name="supports_expense"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="รองรับ Vendor"
            name="supports_vendor"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ต้องมีชื่อบัญชี"
            name="require_account_name"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ต้องมีเลขบัญชี"
            name="require_account_number"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ต้องมี PromptPay ID"
            name="require_promptpay_id"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>    
        
        <Divider titlePlacement="left">
          ความสามารถของระบบ
        </Divider>

         <Col xs={24} md={8}>
          <Form.Item
            label="รองรับหลายบัญชี"
            name="allow_multiple_accounts"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ QR Payment"
            name="qr_supported"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ API Integration"
            name="api_supported"
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

      </Row>
    </Form>
  );
}