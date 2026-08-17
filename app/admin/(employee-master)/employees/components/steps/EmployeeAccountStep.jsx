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
import { useAuth } from "@/contexts/AuthContext";

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
    return value.isValid()
      ? value
      : null;
  }

  const parsed =
    dayjs(value);

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

  const { user } = useAuth();

  const currentRoleCode = String(user?.role_code || (typeof user?.role === "string"? user.role : user?.role?.role_code) || "").trim().toUpperCase();
  const isSuperAdmin = currentRoleCode === "SUPER_ADMIN";

  /* =========================================================
     COMPANY

     company_id อยู่ใน Step:
     "องค์กรและกลุ่มงาน"

     EmployeeAccountStep อยู่คนละ Step

     เพราะฉะนั้นต้อง preserve ค่าไว้
     และ fallback ไปอ่านจาก Form Store
  ========================================================= */

  const watchedCompanyId =
    Form.useWatch(
      "company_id",
      {
        form,
        preserve: true,
      }
    );

  const companyId =
    watchedCompanyId ||
    form.getFieldValue(
      "company_id"
    ) ||
    selectedRecord
      ?.company_id ||
    null;

  /* =========================================================
     ACCOUNT WATCHERS
  ========================================================= */

  const createUserAccount =
    Form.useWatch(
      "create_user_account",
      {
        form,
        preserve: true,
      }
    );

  const updateUserAccount =
    Form.useWatch(
      "update_user_account",
      {
        form,
        preserve: true,
      }
    );

  /* =========================================================
     EMAIL

     work_email / personal_email
     อยู่ใน Step อื่น

     จึงต้อง preserve
  ========================================================= */

  const workEmail =
    Form.useWatch(
      "work_email",
      {
        form,
        preserve: true,
      }
    );

  const personalEmail =
    Form.useWatch(
      "personal_email",
      {
        form,
        preserve: true,
      }
    );

  /* =========================================================
     MASTER DATA
  ========================================================= */

  const settings =
    masterData
      .employeeCodeSettings ||
    [];

  const roles =
    masterData.roles || [];

  /* =========================================================
     EMPLOYEE CODE SETTINGS

     ต้องแสดงเฉพาะ Setting
     ของ Company ที่เลือกเท่านั้น
  ========================================================= */

  const filteredSettings =
    useMemo(() => {
      if (!companyId) {
        return [];
      }

      return settings.filter(
        (item) =>
          String(
            item.company_id
          ) ===
          String(
            companyId
          )
      );
    }, [
      settings,
      companyId,
    ]);

  /* =========================================================
     SETTING OPTIONS
  ========================================================= */

  const settingOptions =
    useMemo(
      () =>
        filteredSettings.map(
          (item) => ({
            value:
              item.id,

            label:
              `${item.code_name} (${item.code_pattern})${
                item.is_default
                  ? " - Default"
                  : ""
              }`,
          })
        ),
      [
        filteredSettings,
      ]
    );

  /* =========================================================
     SYNC EMPLOYEE CODE SETTING WITH COMPANY

     CREATE เท่านั้น

     กรณี:
     1. เลือก Company ใหม่
     2. Setting เดิมเป็นของ Company อื่น

     → ล้าง Setting เดิม

     ถ้า Company มี is_default = true
     → เลือก Default ให้อัตโนมัติ
  ========================================================= */

  useEffect(() => {
    if (
      mode !== "create"
    ) {
      return;
    }

    /* -----------------------------------------------------
       ยังไม่ได้เลือก Company
    ----------------------------------------------------- */

    if (!companyId) {
      form.setFieldValue(
        "employee_code_setting_id",
        undefined
      );

      return;
    }

    /* -----------------------------------------------------
       Setting ปัจจุบัน
    ----------------------------------------------------- */

    const currentSettingId =
      form.getFieldValue(
        "employee_code_setting_id"
      );

    /* -----------------------------------------------------
       Setting ปัจจุบัน
       ยังอยู่ใน Company นี้หรือไม่
    ----------------------------------------------------- */

    const currentIsValid =
      currentSettingId
        ? filteredSettings.some(
            (item) =>
              String(
                item.id
              ) ===
              String(
                currentSettingId
              )
          )
        : false;

    /*
     * ถ้าถูกต้องอยู่แล้ว
     * ไม่ต้องเปลี่ยน
     */
    if (currentIsValid) {
      return;
    }

    /* -----------------------------------------------------
       หา Default Setting
    ----------------------------------------------------- */

    const defaultSetting =
      filteredSettings.find(
        (item) =>
          item.is_default ===
          true
      );

    /*
     * ถ้ามี Default
     * → เลือกให้
     *
     * ถ้าไม่มี
     * → undefined
     * ให้ User เลือกเอง
     */
    form.setFieldValue(
      "employee_code_setting_id",
      defaultSetting?.id
    );
  }, [
    mode,
    companyId,
    filteredSettings,
    form,
  ]);

  /* =========================================================
     ROLE OPTIONS
  ========================================================= */

  const roleOptions = useMemo(() => {
    return roles.filter((item) => {
    
        if ( item?.is_active === false) {
          return false;
        }

        const roleCode =
          String(
            item?.role_code || ""
          )
            .trim()
            .toUpperCase();
        if (
          roleCode ===
            "SUPER_ADMIN" &&
          !isSuperAdmin
        ) {
          return false;
        }

        return true;
      })
      .map((item) => ({
        value:
          item.id,

        label:
          item.role_code
            ? `${item.role_code} - ${
                item.role_name ||
                "-"
              }`
            : item.role_name ||
              "-",
      }));
  }, [roles,isSuperAdmin,]);

  /* =========================================================
     AUTO EMAIL

     CREATE ACCOUNT:
     work_email
     ↓
     personal_email
     ↓
     auth_email
  ========================================================= */

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

    /*
     * ถ้า User กรอกเองแล้ว
     * ห้ามเขียนทับ
     */
    if (current) {
      return;
    }

    form.setFieldValue(
      "auth_email",
      workEmail ||
        personalEmail ||
        null
    );
  }, [
    mode,
    createUserAccount,
    workEmail,
    personalEmail,
    form,
  ]);

  /* =========================================================
     ACCOUNT ENABLED
  ========================================================= */

  const accountEnabled =
    mode === "create"
      ? Boolean(
          createUserAccount
        )
      : Boolean(
          updateUserAccount
        );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div>
      {/* =====================================================
          EMPLOYEE CODE
      ===================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SettingOutlined />

          การสร้างรหัสพนักงาน
        </Space>
      </Divider>

      {/* =====================================================
          EDIT / VIEW

          Employee Code
          ไม่ Generate ใหม่
      ===================================================== */}

      {(
        mode === "edit" ||
        mode === "view"
      ) &&
      selectedRecord
        ?.employee_code ? (
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
                  selectedRecord
                    .employee_code,
              }}
            >
              {
                selectedRecord
                  .employee_code
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
          {/* =================================================
              CREATE EMPLOYEE CODE
          ================================================= */}

          <Alert
            showIcon
            type="info"
            title="ระบบจะสร้างรหัสพนักงานอัตโนมัติ"
            description="ระบบจะใช้รูปแบบรหัสพนักงาน ประเภทพนักงาน วันที่ Running และ Running Number เพื่อสร้างรหัสแบบ Atomic"
            className="mb-5"
          />

          <Row
            gutter={[
              16,
              0,
            ]}
          >
            {/* =============================================
                EMPLOYEE CODE SETTING
            ============================================= */}

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
                    masterLoading ||
                    !companyId
                  }

                  placeholder={
                    !companyId
                      ? "กรุณาเลือกบริษัทก่อน"
                      : settingOptions.length ===
                          0
                        ? "ไม่พบรูปแบบรหัสของบริษัทนี้"
                        : "เลือกรูปแบบรหัส"
                  }

                  options={
                    settingOptions
                  }

                  optionFilterProp="label"

                  notFoundContent={
                    companyId
                      ? "ไม่พบรูปแบบรหัสพนักงานของบริษัทนี้"
                      : "กรุณาเลือกบริษัทก่อน"
                  }
                />
              </Form.Item>

              {/* ===========================================
                  HELPER
              =========================================== */}

              {companyId &&
                !masterLoading &&
                settingOptions.length ===
                  0 && (
                  <div className="-mt-4 mb-4 text-xs text-orange-500">
                    บริษัทที่เลือกยังไม่มี Employee Code Setting ที่เปิดใช้งาน
                  </div>
                )}
            </Col>

            {/* =============================================
                EMPLOYEE TYPE
            ============================================= */}

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
                  disabled={
                    disabled
                  }

                  options={
                    employeeTypeOptions
                  }

                  placeholder="เลือกประเภทพนักงาน"
                />
              </Form.Item>
            </Col>

            {/* =============================================
                RUNNING DATE
            ============================================= */}

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
                    toDayjs(
                      value
                    ),
                })}

                normalize={(
                  value
                ) =>
                  toDayjs(
                    value
                  )
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
                  disabled={
                    disabled
                  }

                  format="DD/MM/YYYY"

                  className="w-full"

                  placeholder="เลือกวันที่ Running"
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* =====================================================
          USER ACCOUNT
      ===================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SafetyCertificateOutlined />

          บัญชีผู้ใช้งานและสิทธิ์
        </Space>
      </Divider>

      <Row
        gutter={[
          16,
          0,
        ]}
      >
        {/* =================================================
            CREATE ACCOUNT SWITCH
        ================================================= */}

        {mode === "create" ? (
          <Col xs={24}>
            <Form.Item
              label="สร้างบัญชีผู้ใช้งาน"
              name="create_user_account"
              valuePropName="checked"
            >
              <Switch
                disabled={
                  disabled
                }

                checkedChildren="สร้างบัญชี"

                unCheckedChildren="ไม่สร้างบัญชี"
              />
            </Form.Item>
          </Col>
        ) : (
          /* =================================================
             UPDATE ACCOUNT SWITCH
          ================================================= */

          <Col xs={24}>
            <Form.Item
              label="แก้ไขบัญชีผู้ใช้งาน"
              name="update_user_account"
              valuePropName="checked"
            >
              <Switch
                disabled={
                  disabled
                }

                checkedChildren="อัปเดตบัญชี"

                unCheckedChildren="ไม่แก้บัญชี"
              />
            </Form.Item>
          </Col>
        )}

        {/* =================================================
            ACCOUNT DETAIL

            ห้ามเรียก Form.useWatch()
            ใน JSX Conditional

            ใช้ accountEnabled
            ที่ประกาศด้านบนแทน
        ================================================= */}

        {accountEnabled && (
          <>
            {/* =============================================
                ROLE
            ============================================= */}

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

                  disabled={
                    disabled ||
                    masterLoading
                  }

                  placeholder="เลือก Role"

                  options={
                    roleOptions
                  }

                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            {/* =============================================
                AUTH EMAIL
            ============================================= */}

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
                    type:
                      "email",

                    message:
                      "รูปแบบอีเมลไม่ถูกต้อง",
                  },
                ]}
              >
                <Input
                  disabled={
                    disabled
                  }

                  prefix={
                    <UserOutlined />
                  }

                  placeholder="user@company.com"
                />
              </Form.Item>
            </Col>

            {/* =============================================
                ACCOUNT STATUS
            ============================================= */}

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
                  disabled={
                    disabled
                  }

                  checkedChildren="ใช้งาน"

                  unCheckedChildren="ปิดใช้งาน"
                />
              </Form.Item>
            </Col>
          </>
        )}
      </Row>

      {/* =====================================================
          INITIAL LOGIN
      ===================================================== */}

      <Alert
        showIcon
        type="warning"

        icon={
          <KeyOutlined />
        }

        title="Username และรหัสผ่านเริ่มต้น"

        description="เมื่อสร้างพนักงานสำเร็จ ระบบจะใช้รหัสพนักงานเป็น Username และรหัสผ่านชั่วคราว จากนั้น Hash ด้วย bcrypt ก่อนบันทึกลง user_accounts.password_hash"
      />

      {/* =====================================================
          ROLE + PERMISSION INFO
      ===================================================== */}

      <div className="mt-4">
        <Alert
          showIcon
          type="info"

          icon={
            <LockOutlined />
          }

          title="Role และ Permission"

          description="บัญชีผู้ใช้งานเก็บ role_id เพียงหนึ่ง Role โดยแต่ละ Role สามารถมีหลาย Permission ผ่านตาราง role_permissions"
        />
      </div>
    </div>
  );
}