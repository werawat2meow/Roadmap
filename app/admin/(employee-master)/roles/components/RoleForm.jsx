"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Switch,
} from "antd";

import RolePermissionMatrix from "./RolePermissionMatrix";

const { TextArea } = Input;

/* =========================================================
   Initial Values
========================================================= */

export function getInitialRoleValues() {
  return {
    role_code: "",

    role_name: "",

    description: "",

    is_active: true,

    is_system: false,

    permission_ids: [],
  };
}

/* =========================================================
   Permission Field Adapter
========================================================= */

function RolePermissionField({
  value = [],

  onChange,

  permissions = [],

  disabled = false,

  loading = false,
}) {
  const selectedPermissionIds =
    Array.isArray(value)
      ? value
      : [];

  return (
    <RolePermissionMatrix
      permissions={permissions}
      selectedPermissionIds={
        selectedPermissionIds
      }
      disabled={disabled}
      loading={loading}
      onChange={(nextIds) => {
        onChange?.(
          Array.isArray(nextIds)
            ? nextIds
            : []
        );
      }}
    />
  );
}

/* =========================================================
   Component
========================================================= */

export default function RoleForm({
  form,

  mode = "create",

  disabled = false,

  saving = false,

  permissionLoading = false,

  permissions = [],

  onFinish,
}) {
  const isSystem =
    Form.useWatch(
      "is_system",
      form
    );

  const isEdit =
    mode === "edit";

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={
        disabled ||
        saving
      }
      initialValues={
        getInitialRoleValues()
      }
      onFinish={onFinish}
    >
      <Alert
        type="info"
        showIcon
        title="ข้อมูล Role"
        description="กำหนดข้อมูล Role และเลือก Permissions ที่ Role นี้สามารถใช้งานได้"
        className="mb-4"
      />

      <Row gutter={16}>
        <Col
          xs={24}
          md={10}
        >
          <Form.Item
            label="รหัส Role"
            name="role_code"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกรหัส Role",
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
              maxLength={100}
              showCount
              placeholder="เช่น HR_ADMIN"
              disabled={
                disabled ||
                saving ||
                (
                  isEdit &&
                  isSystem
                )
              }
              onChange={(event) => {
                const nextValue =
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9_]/g,
                      ""
                    );

                form.setFieldValue(
                  "role_code",
                  nextValue
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={14}
        >
          <Form.Item
            label="ชื่อ Role"
            name="role_name"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกชื่อ Role",
              },
            ]}
          >
            <Input
              maxLength={200}
              showCount
              placeholder="เช่น HR Administrator"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="รายละเอียด"
            name="description"
          >
            <TextArea
              rows={3}
              maxLength={1000}
              showCount
              placeholder="อธิบายหน้าที่และขอบเขตของ Role"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="สถานะใช้งาน"
            name="is_active"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="ใช้งาน"
              unCheckedChildren="ไม่ใช้งาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="System Role"
            name="is_system"
            valuePropName="checked"
          >
            <Switch
              disabled={
                disabled ||
                saving ||
                (
                  isEdit &&
                  isSystem
                )
              }
              checkedChildren="System"
              unCheckedChildren="Custom"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="left">
        กำหนด Permissions
      </Divider>

      <Form.Item
        name="permission_ids"
        valuePropName="value"
        trigger="onChange"
      >
        <RolePermissionField
          permissions={permissions}
          disabled={
            disabled ||
            saving
          }
          loading={
            permissionLoading
          }
        />
      </Form.Item>
    </Form>
  );
}