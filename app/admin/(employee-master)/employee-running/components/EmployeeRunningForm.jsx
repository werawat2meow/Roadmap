"use client";

import {
  Alert,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  CalendarOutlined,
  FieldNumberOutlined,
  FileTextOutlined,
  HistoryOutlined,
  IdcardOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import {
  useEffect,
  useMemo,
} from "react";

import dayjs from "dayjs";

const { TextArea } = Input;
const { Text } = Typography;

/* =========================================================
   Options
========================================================= */

const statusOptions = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

const monthOptions = [
  {
    label: "มกราคม",
    value: 1,
  },
  {
    label: "กุมภาพันธ์",
    value: 2,
  },
  {
    label: "มีนาคม",
    value: 3,
  },
  {
    label: "เมษายน",
    value: 4,
  },
  {
    label: "พฤษภาคม",
    value: 5,
  },
  {
    label: "มิถุนายน",
    value: 6,
  },
  {
    label: "กรกฎาคม",
    value: 7,
  },
  {
    label: "สิงหาคม",
    value: 8,
  },
  {
    label: "กันยายน",
    value: 9,
  },
  {
    label: "ตุลาคม",
    value: 10,
  },
  {
    label: "พฤศจิกายน",
    value: 11,
  },
  {
    label: "ธันวาคม",
    value: 12,
  },
];

/* =========================================================
   Helpers
========================================================= */

function getCompanyLabel(company) {
  const companyName =
    company?.company_name_th ||
    company?.company_name_en ||
    "-";

  if (company?.company_code) {
    return `${company.company_code} - ${companyName}`;
  }

  return companyName;
}

function getSettingLabel(setting) {
  const codeName =
    setting?.code_name || "-";

  const pattern =
    setting?.code_pattern || "";

  if (pattern) {
    return `${codeName} (${pattern})`;
  }

  return codeName;
}

function getResetPolicyLabel(value) {
  const labels = {
    never: "ไม่รีเซ็ต",
    yearly: "รีเซ็ตรายปี",
    monthly: "รีเซ็ตรายเดือน",
  };

  return labels[value] || "-";
}

function getResetPolicyColor(value) {
  const colors = {
    never: "default",
    yearly: "blue",
    monthly: "purple",
  };

  return colors[value] || "default";
}

function normalizeDateTimeValue(value) {
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

/* =========================================================
   Component
========================================================= */

export default function EmployeeRunningForm({
  form,

  mode = "create",

  companies = [],

  settings = [],

  companyLoading = false,

  settingLoading = false,

  disabled = false,

  selectedRecord = null,

  onFinish,
}) {
  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const settingId =
    Form.useWatch(
      "employee_code_setting_id",
      form
    );

  const runningYear =
    Form.useWatch(
      "running_year",
      form
    );

  const runningMonth =
    Form.useWatch(
      "running_month",
      form
    );

  const currentRunning =
    Form.useWatch(
      "current_running",
      form
    );

  const selectedSetting =
    useMemo(
      () =>
        settings.find(
          (setting) =>
            setting.id === settingId
        ) || null,
      [
        settings,
        settingId,
      ]
    );

  const filteredSettings =
    useMemo(() => {
      if (!companyId) {
        return settings;
      }

      return settings.filter(
        (setting) =>
          setting.company_id === companyId
      );
    }, [
      settings,
      companyId,
    ]);

  const companyOptions =
    useMemo(
      () =>
        companies.map(
          (company) => ({
            value: company.id,
            label:
              getCompanyLabel(company),
          })
        ),
      [companies]
    );

  const settingOptions =
    useMemo(
      () =>
        filteredSettings.map(
          (setting) => ({
            value: setting.id,
            label:
              getSettingLabel(setting),
          })
        ),
      [filteredSettings]
    );

  const resetPolicy =
    selectedSetting?.reset_policy ||
    selectedRecord
      ?.employee_code_settings
      ?.reset_policy ||
    null;

  const isMonthly =
    resetPolicy === "monthly";

  const isNever =
    resetPolicy === "never";

  const isYearly =
    resetPolicy === "yearly";

  /*
    เมื่อเลือกบริษัทใหม่
    หาก Setting เดิมไม่ใช่ของบริษัทนั้น
    ให้ล้าง Setting
  */

  useEffect(() => {
    if (
      !companyId ||
      !settingId
    ) {
      return;
    }

    const currentSetting =
      settings.find(
        (setting) =>
          setting.id === settingId
      );

    if (
      currentSetting &&
      currentSetting.company_id !==
        companyId
    ) {
      form.setFieldsValue({
        employee_code_setting_id:
          undefined,

        running_month: null,
      });
    }
  }, [
    companyId,
    settingId,
    settings,
    form,
  ]);

  /*
    เปลี่ยนค่า Year / Month
    ตาม Reset Policy
  */

  useEffect(() => {
    if (!selectedSetting) {
      return;
    }

    if (
      selectedSetting.reset_policy ===
      "never"
    ) {
      form.setFieldsValue({
        running_year: 0,
        running_month: null,
      });

      return;
    }

    if (
      selectedSetting.reset_policy ===
      "yearly"
    ) {
      form.setFieldsValue({
        running_year:
          Number(
            form.getFieldValue(
              "running_year"
            )
          ) || dayjs().year(),

        running_month: null,
      });

      return;
    }

    if (
      selectedSetting.reset_policy ===
      "monthly"
    ) {
      form.setFieldsValue({
        running_year:
          Number(
            form.getFieldValue(
              "running_year"
            )
          ) || dayjs().year(),

        running_month:
          Number(
            form.getFieldValue(
              "running_month"
            )
          ) || dayjs().month() + 1,
      });
    }
  }, [
    selectedSetting,
    form,
  ]);

  const periodDescription =
    useMemo(() => {
      if (!resetPolicy) {
        return "กรุณาเลือกรูปแบบรหัสพนักงาน";
      }

      if (isNever) {
        return "Running ต่อเนื่อง ไม่แยกปีและเดือน";
      }

      if (isMonthly) {
        const monthLabel =
          monthOptions.find(
            (item) =>
              item.value ===
              Number(runningMonth)
          )?.label || "-";

        return `${monthLabel} ปี ${
          runningYear || "-"
        }`;
      }

      return `ปี ${
        runningYear || "-"
      }`;
    }, [
      resetPolicy,
      isNever,
      isMonthly,
      runningMonth,
      runningYear,
    ]);

  const nextRunning =
    Number(currentRunning || 0) + 1;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        company_id: undefined,

        employee_code_setting_id:
          undefined,

        running_year:
          dayjs().year(),

        running_month: null,

        current_running: 0,

        last_employee_code: null,

        last_employee_id: null,

        last_generated_at: null,

        status: "active",

        remark: "",
      }}
    >
      {/* ===================================================
          Company and Setting
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <SettingOutlined />

          รูปแบบ Running Number
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={companyLoading}
              disabled={
                disabled ||
                (mode === "edit" &&
                  Number(
                    selectedRecord
                      ?.current_running ||
                      0
                  ) > 0)
              }
              placeholder="เลือกบริษัท"
              options={companyOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="รูปแบบรหัสพนักงาน"
            name="employee_code_setting_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกรูปแบบรหัสพนักงาน",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={settingLoading}
              disabled={
                disabled ||
                !companyId ||
                (mode === "edit" &&
                  Number(
                    selectedRecord
                      ?.current_running ||
                      0
                  ) > 0)
              }
              placeholder={
                companyId
                  ? "เลือกรูปแบบรหัสพนักงาน"
                  : "กรุณาเลือกบริษัทก่อน"
              }
              options={settingOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
      </Row>

      {selectedSetting && (
        <Card
          size="small"
          className="mb-5 bg-slate-50"
        >
          <Row gutter={[16, 8]}>
            <Col
              xs={24}
              md={8}
            >
              <Text type="secondary">
                ชื่อรูปแบบ
              </Text>

              <div className="mt-1">
                <Text strong>
                  {selectedSetting.code_name ||
                    "-"}
                </Text>
              </div>
            </Col>

            <Col
              xs={24}
              md={8}
            >
              <Text type="secondary">
                Pattern
              </Text>

              <div className="mt-1">
                <Text code>
                  {selectedSetting.code_pattern ||
                    "-"}
                </Text>
              </div>
            </Col>

            <Col
              xs={24}
              md={8}
            >
              <Text type="secondary">
                นโยบาย Reset
              </Text>

              <div className="mt-1">
                <Tag
                  color={getResetPolicyColor(
                    selectedSetting.reset_policy
                  )}
                >
                  {getResetPolicyLabel(
                    selectedSetting.reset_policy
                  )}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* ===================================================
          Running Period
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <CalendarOutlined />

          รอบการใช้งาน Running
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ปี Running"
            name="running_year"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกปี Running",
              },
              {
                type: "number",
                min: isNever ? 0 : 1900,
                max: 9999,
                message:
                  "ปี Running ไม่ถูกต้อง",
              },
            ]}
          >
            <InputNumber
              min={isNever ? 0 : 1900}
              max={9999}
              precision={0}
              disabled={
                disabled ||
                isNever ||
                !selectedSetting ||
                (mode === "edit" &&
                  Number(
                    selectedRecord
                      ?.current_running ||
                      0
                  ) > 0)
              }
              className="w-full"
              placeholder="เช่น 2026"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="เดือน Running"
            name="running_month"
            rules={[
              {
                required: isMonthly,
                message:
                  "กรุณาเลือกเดือน Running",
              },
            ]}
          >
            <Select
              allowClear
              disabled={
                disabled ||
                !isMonthly ||
                (mode === "edit" &&
                  Number(
                    selectedRecord
                      ?.current_running ||
                      0
                  ) > 0)
              }
              placeholder={
                isMonthly
                  ? "เลือกเดือน"
                  : "ไม่ใช้เดือน"
              }
              options={monthOptions}
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
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสถานะ",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={statusOptions}
              placeholder="เลือกสถานะ"
            />
          </Form.Item>
        </Col>
      </Row>

      <Alert
        showIcon
        type="info"
        title="รอบ Running Number"
        description={periodDescription}
        className="mb-5"
      />

      {/* ===================================================
          Current Running
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <FieldNumberOutlined />

          เลข Running ปัจจุบัน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={12}
        >
          <Form.Item
            label="เลข Running ปัจจุบัน"
            name="current_running"
            extra="เลขล่าสุดที่ถูกใช้งานแล้ว ระบบจะใช้เลขถัดไปในการสร้างรหัสพนักงาน"
            rules={[
              {
                required: true,
                message:
                  "กรุณากรอกเลข Running ปัจจุบัน",
              },
              {
                type: "number",
                min: 0,
                message:
                  "เลข Running ต้องไม่น้อยกว่า 0",
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              disabled={disabled}
              className="w-full"
              prefix={
                <FieldNumberOutlined />
              }
              placeholder="0"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={12}
        >
          <Card
            size="small"
            className="mt-[30px] bg-blue-50"
          >
            <Text type="secondary">
              เลขที่จะใช้ครั้งถัดไป
            </Text>

            <div className="mt-1 text-2xl font-bold text-blue-600">
              {nextRunning.toLocaleString(
                "th-TH"
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ===================================================
          Last Generated Information
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <HistoryOutlined />

          ข้อมูลการสร้างล่าสุด
        </Space>
      </Divider>

      <Alert
        showIcon
        type="warning"
        title="ข้อมูลส่วนนี้ควรถูกอัปเดตโดยระบบ"
        description="รหัสพนักงานล่าสุด พนักงานล่าสุด และวันเวลาที่สร้างล่าสุด ควรถูกบันทึกอัตโนมัติเมื่อระบบ Generate รหัสพนักงาน"
        className="mb-5"
      />

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสพนักงานล่าสุด"
            name="last_employee_code"
          >
            <Input
              disabled
              prefix={<IdcardOutlined />}
              placeholder="ยังไม่มีการใช้งาน"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="รหัสอ้างอิงพนักงานล่าสุด"
            name="last_employee_id"
          >
            <Input
              disabled
              placeholder="ยังไม่มีพนักงานล่าสุด"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สร้างล่าสุดเมื่อ"
            name="last_generated_at"
            getValueProps={(value) => ({
              value:
                normalizeDateTimeValue(
                  value
                ),
            })}
            normalize={(value) =>
              normalizeDateTimeValue(value)
            }
          >
            <DatePicker
              showTime
              disabled
              format="DD/MM/YYYY HH:mm"
              className="w-full"
              placeholder="ยังไม่มีการสร้างรหัส"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          Remark
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <FileTextOutlined />

          หมายเหตุ
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24}>
          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <TextArea
              disabled={disabled}
              rows={4}
              maxLength={500}
              showCount={!disabled}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับ Running Number"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}