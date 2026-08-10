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

const STATUS_OPTIONS = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

/* =========================================================
   Initial Values
========================================================= */

export function getInitialPortalMenuGroupValues() {
  return {
    system_id: undefined,
    group_code: "",
    group_name: "",
    group_subtitle: "",
    icon_code: "",
    sort_order: 0,
    is_expanded_default: false,
    status: "active",
  };
}

/* =========================================================
   Component
========================================================= */

export default function PortalMenuGroupForm({
  form,
  systems = [],
  disabled = false,
  saving = false,
  onFinish,
}) {
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled || saving}
      initialValues={
        getInitialPortalMenuGroupValues()
      }
      onFinish={onFinish}
    >
      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="ระบบ"
            name="system_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกระบบ",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              placeholder="เลือกระบบ"
              options={systems}
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="รหัส Group"
            name="group_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัส Group",
              },
              {
                pattern:
                  /^[A-Za-z0-9_]+$/,
                message:
                  "ใช้ได้เฉพาะ A-Z, 0-9 และ _",
              },
            ]}
          >
            <Input
              placeholder="เช่น EMPLOYEE"
              onChange={(event) => {
                const value =
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_]/g,
                      ""
                    );

                form.setFieldValue(
                  "group_code",
                  value
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="ชื่อ Group"
            name="group_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อ Group",
              },
            ]}
          >
            <Input
              placeholder="เช่น Employee Management"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="คำอธิบาย"
            name="group_subtitle"
          >
            <Input
              placeholder="เช่น ระบบข้อมูลพนักงาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Icon Code"
            name="icon_code"
          >
            <Input
              placeholder="เช่น team"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ลำดับ"
            name="sort_order"
          >
            <InputNumber
              min={0}
              precision={0}
              className="!w-full"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สถานะ"
            name="status"
          >
            <Select
              options={
                STATUS_OPTIONS
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="เปิด Group อัตโนมัติ"
            name="is_expanded_default"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="เปิด"
              unCheckedChildren="ปิด"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}