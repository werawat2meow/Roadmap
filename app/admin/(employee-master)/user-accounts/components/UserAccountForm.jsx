"use client";

import {
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
} from "antd";

export default function UserAccountForm({
  form,
  mode = "create",
  disabled = false,

  employeeOptions = [],
  employeeLoading = false,
  onEmployeeSearch,
  onEmployeePopupScroll,

  roleOptions = [],
  roleLoading = false,
  onRoleSearch,

  onFinish,
}) {
  const isCreate = mode === "create";

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      onFinish={onFinish}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="พนักงาน"
            name="employee_id"
            tooltip="รายการพนักงานถูกจำกัดตาม Scope ของผู้ใช้งานที่กำลัง Login"
          >
            <Select
              allowClear
              showSearch
              filterOption={false}
              placeholder="เลือกพนักงาน"
              options={employeeOptions}
              loading={employeeLoading}
              onSearch={onEmployeeSearch}
              onPopupScroll={onEmployeePopupScroll}
              notFoundContent={
                employeeLoading
                  ? "กำลังโหลด..."
                  : "ไม่พบพนักงานใน Scope"
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="Role"
            name="role_id"
          >
            <Select
              allowClear
              showSearch
              filterOption={false}
              placeholder="เลือก Role"
              options={roleOptions}
              loading={roleLoading}
              onSearch={onRoleSearch}
              notFoundContent={
                roleLoading
                  ? "กำลังโหลด..."
                  : "ไม่พบ Role"
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="Username"
            name="username"
            rules={[
              {
                required: true,
                message: "กรุณากรอก Username",
              },
              {
                whitespace: true,
                message: "กรุณากรอก Username",
              },
            ]}
          >
            <Input
              autoComplete="off"
              placeholder="Username"
            />
          </Form.Item>
        </Col>

        {isCreate && (
          <Col xs={24} md={12}>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: "กรุณากรอกรหัสผ่าน",
                },
                {
                  min: 6,
                  message:
                    "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                },
              ]}
            >
              <Input.Password
                autoComplete="new-password"
                placeholder="Password"
              />
            </Form.Item>
          </Col>
        )}

        <Col xs={24} md={12}>
          <Form.Item
            label="สถานะ"
            name="is_active"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="ใช้งาน"
              unCheckedChildren="ไม่ใช้งาน"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
