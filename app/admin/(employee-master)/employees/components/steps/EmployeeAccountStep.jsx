"use client";

import {
  Alert,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";

import {
  IdcardOutlined,
  KeyOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  useEffect,
  useMemo,
} from "react";

import dayjs from "dayjs";

const { Text } = Typography;

const employeeTypeOptions = [
  {
    label: "ผู้บริหาร",
    value: "executive",
  },
  {
    label: "พนักงานไทย",
    value: "thai",
  },
  {
    label: "พนักงาน Non-B",
    value: "non_b",
  },
  {
    label: "พนักงานเมียนมา",
    value: "myanmar",
  },
  {
    label: "พนักงาน Part-time",
    value: "parttime",
  },
];

function toDayjs(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value;
  }

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed
    : null;
}

export default function EmployeeAccountStep({
  form,
  mode = "create",
  disabled = false,
  selectedRecord = null,
  masterData = {},
  masterLoading = false,
}) {
  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const createUserAccount =
    Form.useWatch(
      "create_user_account",
      form
    );

  const workEmail =
    Form.useWatch(
      "work_email",
      form
    );

  const personalEmail =
    Form.useWatch(
      "personal_email",
      form
    );

  const settings =
    masterData.employeeCodeSettings ||
    [];

  const roles =
    masterData.roles || [];

  const filteredSettings =
    useMemo(
      () =>
        settings.filter(
          (item) =>
            !companyId ||
            item.company_id ===
              companyId
        ),
      [
        settings,
        companyId,
      ]
    );

  const settingOptions =
    filteredSettings.map(
      (item) => ({
        value: item.id,
        label: `${item.code_name} (${item.code_pattern})${
          item.is_default
            ? " - Default"
            : ""
        }`,
      })
    );

  const roleOptions =
    roles
      .filter(
        (item) =>
          item.is_active !== false
      )
      .map((item) => ({
        value: item.id,
        label: item.role_code
          ? `${item.role_code} - ${
              item.role_name || "-"
            }`
          : item.role_name || "-",
      }));

  useEffect(() => {
    if (
      mode !== "create" ||
      !createUserAccount
    ) {
      return;
    }

    const current =
      form.getFieldValue(
        "auth_email"
      );

    if (!current) {
      form.setFieldValue(
        "auth_email",
        workEmail ||
          personalEmail ||
          null
      );
    }
  }, [
    mode,
    createUserAccount,
    workEmail,
    personalEmail,
    form,
  ]);

  return (
    <div>
      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SettingOutlined />
          การสร้างรหัสพนักงาน
        </Space>
      </Divider>

      {mode === "edit" &&
      selectedRecord?.employee_code ? (
        <Card
          size="small"
          className="mb-5 bg-slate-50"
        >
          <Text type="secondary">
            รหัสพนักงาน
          </Text>

          <div className="mt-1">
            <Text
              code
              copyable={{
                text:
                  selectedRecord.employee_code,
              }}
            >
              {
                selectedRecord.employee_code
              }
            </Text>
          </div>

          <div className="mt-2">
            <Tag color="blue">
              รหัสพนักงานไม่สามารถแก้ไขผ่านหน้าพนักงาน
            </Tag>
          </div>
        </Card>
      ) : (
        <>
          <Alert
            showIcon
            type="info"
            title="ระบบจะสร้างรหัสพนักงานอัตโนมัติ"
            description="ระบบจะใช้รูปแบบรหัสพนักงาน ประเภทพนักงาน วันที่ Running และ Running Number เพื่อสร้างรหัสแบบ Atomic"
            className="mb-5"
          />

          <Row gutter={[16, 0]}>
            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="รูปแบบรหัสพนักงาน"
                name="employee_code_setting_id"
                rules={[
                  {
                    required:
                      mode ===
                      "create",
                    message:
                      "กรุณาเลือกรูปแบบรหัสพนักงาน",
                  },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  loading={
                    masterLoading
                  }
                  disabled={
                    disabled ||
                    !companyId
                  }
                  placeholder="เลือกรูปแบบรหัส"
                  options={
                    settingOptions
                  }
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="ประเภทสำหรับสร้างรหัส"
                name="employee_type"
                rules={[
                  {
                    required:
                      mode ===
                      "create",
                    message:
                      "กรุณาเลือกประเภทพนักงาน",
                  },
                ]}
              >
                <Select
                  disabled={disabled}
                  options={
                    employeeTypeOptions
                  }
                  placeholder="เลือกประเภทพนักงาน"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="วันที่ Running"
                name="running_date"
                getValueProps={(
                  value
                ) => ({
                  value:
                    toDayjs(value),
                })}
                normalize={(value) =>
                  toDayjs(value)
                }
                rules={[
                  {
                    required:
                      mode ===
                      "create",
                    message:
                      "กรุณาเลือกวันที่ Running",
                  },
                ]}
              >
                <DatePicker
                  disabled={disabled}
                  format="DD/MM/YYYY"
                  className="w-full"
                  placeholder="เลือกวันที่ Running"
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SafetyCertificateOutlined />
          บัญชีผู้ใช้งานและสิทธิ์
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        {mode === "create" ? (
          <Col xs={24}>
            <Form.Item
              label="สร้างบัญชีผู้ใช้งาน"
              name="create_user_account"
              valuePropName="checked"
            >
              <Switch
                disabled={disabled}
                checkedChildren="สร้างบัญชี"
                unCheckedChildren="ไม่สร้างบัญชี"
              />
            </Form.Item>
          </Col>
        ) : (
          <Col xs={24}>
            <Form.Item
              label="แก้ไขบัญชีผู้ใช้งาน"
              name="update_user_account"
              valuePropName="checked"
            >
              <Switch
                disabled={disabled}
                checkedChildren="อัปเดตบัญชี"
                unCheckedChildren="ไม่แก้บัญชี"
              />
            </Form.Item>
          </Col>
        )}

        {(mode === "create"
          ? createUserAccount
          : Form.useWatch(
              "update_user_account",
              form
            )) && (
          <>
            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="Role"
                name="role_id"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือก Role",
                  },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  loading={
                    masterLoading
                  }
                  disabled={disabled}
                  placeholder="เลือก Role"
                  options={
                    roleOptions
                  }
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="อีเมลสำหรับเข้าสู่ระบบ"
                name="auth_email"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ",
                  },
                  {
                    type: "email",
                    message:
                      "รูปแบบอีเมลไม่ถูกต้อง",
                  },
                ]}
              >
                <Input
                  disabled={disabled}
                  prefix={
                    <UserOutlined />
                  }
                  placeholder="user@company.com"
                />
              </Form.Item>
            </Col>

            <Col
              xs={24}
              md={8}
            >
              <Form.Item
                label="สถานะบัญชี"
                name="account_is_active"
                valuePropName="checked"
              >
                <Switch
                  disabled={disabled}
                  checkedChildren="ใช้งาน"
                  unCheckedChildren="ปิดใช้งาน"
                />
              </Form.Item>
            </Col>
          </>
        )}
      </Row>

      <Alert
        showIcon
        type="warning"
        icon={<KeyOutlined />}
        title="Username และรหัสผ่านเริ่มต้น"
        description="เมื่อสร้างพนักงานสำเร็จ ระบบจะใช้รหัสพนักงานเป็น Username และรหัสผ่านชั่วคราว จากนั้น Hash ด้วย bcrypt ก่อนบันทึกลง user_accounts.password_hash"
      />

      <div className="mt-4">
        <Alert
          showIcon
          type="info"
          icon={<LockOutlined />}
          title="Role และ Permission"
          description="บัญชีผู้ใช้งานเก็บ role_id เพียงหนึ่ง Role โดยแต่ละ Role สามารถมีหลาย Permission ผ่านตาราง role_permissions"
        />
      </div>
    </div>
  );
}