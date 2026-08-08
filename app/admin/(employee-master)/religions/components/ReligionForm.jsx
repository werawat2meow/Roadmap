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

export default function ReligionForm({
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
        ข้อมูลศาสนา
      </Divider>

      <Row gutter={16}>

        <Col xs={24} md={6}>
          <Form.Item
            label="Religion Code"
            name="religion_code"
            rules={[
              {
                required: true,
                message: "กรุณากรอกรหัสศาสนา",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="BUDDHISM"
              style={{
                textTransform: "uppercase",
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="ชื่อศาสนา (ไทย)"
            name="religion_name_th"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อศาสนา",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="พุทธ"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={9}>
          <Form.Item
            label="Religion (English)"
            name="religion_name_en"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่อศาสนาภาษาอังกฤษ",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="Buddhism"
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
              placeholder="พุทธ"
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
              placeholder="Buddhism"
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
            label="Default Religion"
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