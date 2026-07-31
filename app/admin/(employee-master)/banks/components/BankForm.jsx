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

export default function BankForm({
  form,
  disabled = false,
  onFinish
}) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Row gutter={16}>
        <Col xs={24} md={6}>
          <Form.Item
            label="รหัสธนาคาร"
            name="bank_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสธนาคาร",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="KBANK"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ชื่อย่อ"
            name="bank_short_name"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อย่อ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="KBank"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="SWIFT Code"
            name="swift_code"
          >
            <Input
              disabled={disabled}
              placeholder="KASITHBK"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ชื่อธนาคาร (ไทย)"
            name="bank_name_th"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อธนาคาร",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="ธนาคารกสิกรไทย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ชื่อธนาคาร (English)"
            name="bank_name_en"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อภาษาอังกฤษ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Kasikornbank"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="Payroll File Format"
            name="bank_file_format"
            initialValue="txt"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  label: "TXT",
                  value: "txt",
                },
                {
                  label: "CSV",
                  value: "csv",
                },
                {
                  label: "XLSX",
                  value: "xlsx",
                },
                {
                  label: "XML",
                  value: "xml",
                },
                {
                  label: "JSON",
                  value: "json",
                },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="Transfer Type"
            name="bank_transfer_type"
            initialValue="batch"
          >
            <Select
              disabled={disabled}
              options={[
                {
                  label: "Batch File",
                  value: "batch",
                },
                {
                  label: "API",
                  value: "api",
                },
                {
                  label: "Manual",
                  value: "manual",
                },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="จำนวนหลักเลขบัญชี"
            name="account_number_length"
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={1}
              max={20}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="ต้องระบุรหัสสาขา"
            name="branch_code_required"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ Payroll"
            name="supports_payroll"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ Bulk Transfer"
            name="supports_bulk_transfer"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ API"
            name="supports_api"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ PromptPay"
            name="promptpay_supported"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="รองรับ PromptPay QR"
            name="supports_promptpay_qr"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="API Endpoint"
            name="api_endpoint"
          >
            <Input
              disabled={disabled}
              placeholder="https://api.bank.com/payroll"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="API Version"
            name="api_version"
          >
            <Input
              disabled={disabled}
              placeholder="v1"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="ลำดับ"
            name="sort_order"
            initialValue={0}
          >
            <InputNumber
              disabled={disabled}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
        </Col>

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
                  label: "ไม่ใช้งาน",
                  value: "inactive",
                },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remarks"
          >
            <TextArea
              disabled={disabled}
              rows={4}
              placeholder="Remark..."
            />
          </Form.Item>
        </Col>

      </Row>
    </Form>
  );
}