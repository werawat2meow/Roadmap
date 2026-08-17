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

export default function GenderForm({
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
        ข้อมูลเพศ
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={6}>
          <Form.Item
            label="Gender Code"
            name="gender_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสเพศ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="MALE"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="ชื่อเพศ (ไทย)"
            name="gender_name_th"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อเพศ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="ชาย"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="Gender (English)"
            name="gender_name_en"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อเพศภาษาอังกฤษ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Male"
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
              placeholder="ช"
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
              placeholder="M"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              disabled={disabled}
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม"
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
            label="Default Gender"
            name="is_default"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch
              disabled={disabled}
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