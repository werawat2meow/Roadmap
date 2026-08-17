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

export default function TitleForm({
  form,
  disabled = false,
  onFinish,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Divider titlePlacement="left">
        ข้อมูลคำนำหน้า
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={6}>
          <Form.Item
            label="Title Code"
            name="title_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสคำนำหน้า",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="MR"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="ชื่อคำนำหน้า (ไทย)"
            name="title_name_th"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อคำนำหน้า",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="นาย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="Title (English)"
            name="title_name_en"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อภาษาอังกฤษ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Mr."
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="ชื่อย่อ (ไทย)"
            name="short_name_th"
          >
            <Input
              disabled={disabled}
              placeholder="นาย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="Short Name (EN)"
            name="short_name_en"
          >
            <Input
              disabled={disabled}
              placeholder="Mr."
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="เพศ"
            name="gender"
          >
            <Select
              disabled={disabled}
              allowClear
              placeholder="เลือกเพศ"
              options={[
                {
                  label: "ชาย",
                  value: "male",
                },
                {
                  label: "หญิง",
                  value: "female",
                },
                {
                  label: "อื่นๆ",
                  value: "other",
                },
              ]}
            />
          </Form.Item>
        </Col>

      </Row>
            <Divider titlePlacement="left">
        การตั้งค่าระบบ
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={8}>
          <Form.Item
            label="Default Title"
            name="is_default"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch disabled={disabled} />
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
              min={0}
              style={{
                width: "100%",
              }}
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

      </Row>

    </Form>
  );
}