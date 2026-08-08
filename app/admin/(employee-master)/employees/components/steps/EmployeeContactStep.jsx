"use client";

import {
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
} from "antd";

import {
  ContactsOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

export default function EmployeeContactStep({
  disabled = false,
}) {
  return (
    <div>
      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <PhoneOutlined />
          ข้อมูลโทรศัพท์
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="โทรศัพท์มือถือ"
            name="mobile_phone"
            rules={[
              {
                pattern:
                  /^[0-9+\-\s()]{8,20}$/,
                message:
                  "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="เช่น 0812345678"
              prefix={
                <PhoneOutlined />
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="โทรศัพท์บ้าน"
            name="home_phone"
          >
            <Input
              disabled={disabled}
              placeholder="โทรศัพท์บ้าน"
              prefix={
                <PhoneOutlined />
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="โทรศัพท์ที่ทำงาน"
            name="work_phone"
          >
            <Input
              disabled={disabled}
              placeholder="โทรศัพท์ที่ทำงาน"
              prefix={
                <PhoneOutlined />
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <MailOutlined />
          อีเมลและช่องทางติดต่อ
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="อีเมลส่วนตัว"
            name="personal_email"
            rules={[
              {
                type: "email",
                message:
                  "รูปแบบอีเมลส่วนตัวไม่ถูกต้อง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="personal@example.com"
              prefix={
                <MailOutlined />
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="อีเมลบริษัท"
            name="work_email"
            rules={[
              {
                type: "email",
                message:
                  "รูปแบบอีเมลบริษัทไม่ถูกต้อง",
              },
            ]}
          >
            <Input
              disabled={disabled}
              placeholder="employee@company.com"
              prefix={
                <MailOutlined />
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="LINE ID"
            name="line_id"
          >
            <Input
              disabled={disabled}
              placeholder="LINE ID"
              prefix={
                <ContactsOutlined />
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SafetyCertificateOutlined />
          ข้อมูลภาษีและประกันสังคม
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="เลขประจำตัวผู้เสียภาษี"
            name="tax_id"
          >
            <Input
              disabled={disabled}
              maxLength={20}
              placeholder="เลขประจำตัวผู้เสียภาษี"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="เลขประกันสังคม"
            name="social_security_no"
          >
            <Input
              disabled={disabled}
              maxLength={20}
              placeholder="เลขประกันสังคม"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}