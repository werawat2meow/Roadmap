"use client";

import { useEffect, useMemo } from "react";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import EmployeeBusinessStructureEmployeeSelect from "./EmployeeBusinessStructureEmployeeSelect";

const { Text } = Typography;

const MANAGEMENT_LEVEL_OPTIONS = ["P12", "P11", "P10", "P9"].map(
  (value) => ({ value, label: value })
);

const SUPERVISOR_LEVEL_BY_LEVEL = {
  P12: "",
  P11: "P12",
  P10: "P11",
  P9: "P10",
};

const ALLOWED_SCOPE_TYPES = {
  P12: ["all"],
  P11: ["company"],
  P10: ["branch_group", "department"],
  P9: ["department", "division", "unit"],
};

const SCOPE_LABELS = {
  all: "ทั้งองค์กร",
  company: "บริษัท",
  branch_group: "กรุ๊ปสังกัด",
  branch: "สังกัด",
  department: "แผนก",
  division: "ฝ่าย",
  unit: "หน่วยงาน",
};

const SCOPE_FIELD_BY_TYPE = {
  all: null,
  company: "company_id",
  branch_group: "branch_group_id",
  branch: "branch_id",
  department: "department_id",
  division: "division_id",
  unit: "unit_id",
};

function makeScope(scopeType = "", index = 0) {
  const result = {
    scope_type: scopeType,
    company_id: undefined,
    branch_group_id: undefined,
    branch_id: undefined,
    department_id: undefined,
    division_id: undefined,
    unit_id: undefined,
    is_primary: index === 0,
    status: "active",
    sort_order: index,
  };

  return result;
}

function defaultScopeForLevel(level = "") {
  if (level === "P12") return makeScope("all", 0);
  if (level === "P11") return makeScope("company", 0);
  if (level === "P10") return makeScope("branch_group", 0);
  if (level === "P9") return makeScope("department", 0);
  return makeScope("", 0);
}

function optionLabel(code, name) {
  return code ? `${code} - ${name || "-"}` : name || "-";
}

function optionsForScope(scopeType, masterData = {}) {
  switch (scopeType) {
    case "company":
      return (masterData.companies || []).map((item) => ({
        value: item.id,
        label: optionLabel(
          item.company_code,
          item.company_name_th || item.company_name_en
        ),
      }));

    case "branch_group":
      return (masterData.branchGroups || []).map((item) => ({
        value: item.id,
        label: optionLabel(item.group_code, item.group_name),
      }));

    case "branch":
      return (masterData.branches || []).map((item) => ({
        value: item.id,
        label: optionLabel(item.branch_code, item.branch_name),
      }));

    case "department":
      return (masterData.departments || []).map((item) => ({
        value: item.id,
        label: optionLabel(item.department_code, item.department_name),
      }));

    case "division":
      return (masterData.divisions || []).map((item) => ({
        value: item.id,
        label: optionLabel(item.division_code, item.division_name),
      }));

    case "unit":
      return (masterData.units || []).map((item) => ({
        value: item.id,
        label: optionLabel(item.unit_code, item.unit_name),
      }));

    default:
      return [];
  }
}

function clearScopeTarget(scope = {}) {
  return {
    ...scope,
    company_id: undefined,
    branch_group_id: undefined,
    branch_id: undefined,
    department_id: undefined,
    division_id: undefined,
    unit_id: undefined,
  };
}

export default function EmployeeBusinessStructureModal({
  open,
  mode = "create",
  form,
  masterData = {},
  selectedRecord = null,
  saving = false,
  onCancel,
  onSubmit,
}) {
  const disabled = mode === "view";
  const isCreate = mode === "create";

  const managementLevel = Form.useWatch("management_level", form) || "";
  const employeeId = Form.useWatch("employee_id", form) || "";
  const scopes = Form.useWatch("scopes", form) || [];

  const supervisorLevel = SUPERVISOR_LEVEL_BY_LEVEL[managementLevel] || "";

  const employeeInitialOption = useMemo(() => {
    if (!selectedRecord?.employee_id) return null;

    return {
      id: selectedRecord.employee_id,
      employee_code: selectedRecord.employee_code,
      employee_name: selectedRecord.employee_name,
      position_name: selectedRecord.position_name,
      job_name: selectedRecord.job_name,
      management_level: selectedRecord.management_level,
    };
  }, [selectedRecord]);

  const supervisorInitialOption = useMemo(() => {
    if (!selectedRecord?.supervisor_employee_id) return null;

    return {
      id: selectedRecord.supervisor_employee_id,
      employee_code: selectedRecord.supervisor_code,
      employee_name: selectedRecord.supervisor_name,
      position_name: selectedRecord.supervisor_position_name,
      management_level: selectedRecord.supervisor_management_level,
    };
  }, [selectedRecord]);

  useEffect(() => {
    if (!open || !managementLevel) return;

    const currentScopes = form.getFieldValue("scopes") || [];

    if (managementLevel === "P12") {
      const onlyAll =
        currentScopes.length === 1 && currentScopes[0]?.scope_type === "all";

      if (!onlyAll) {
        form.setFieldValue("scopes", [defaultScopeForLevel("P12")]);
      }

      form.setFieldValue("supervisor_employee_id", undefined);
      return;
    }

    if (!currentScopes.length) {
      form.setFieldValue("scopes", [defaultScopeForLevel(managementLevel)]);
    }
  }, [form, managementLevel, open]);

  const modalTitle =
    mode === "view"
      ? "รายละเอียดโครงสร้างบริหารพนักงาน"
      : mode === "edit"
        ? "แก้ไขโครงสร้างบริหารพนักงาน"
        : "เพิ่มโครงสร้างบริหารพนักงาน";

  const setPrimaryScope = (index) => {
    const current = form.getFieldValue("scopes") || [];

    form.setFieldValue(
      "scopes",
      current.map((scope, currentIndex) => ({
        ...scope,
        is_primary: currentIndex === index,
      }))
    );
  };

  return (
    <Modal
      open={open}
      width={1040}
      title={modalTitle}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>{disabled ? "ปิด" : "ยกเลิก"}</Button>
          {!disabled && (
            <Button type="primary" loading={saving} onClick={onSubmit}>
              บันทึก
            </Button>
          )}
        </Space>
      }
    >
      <Alert
        showIcon
        type="info"
        icon={<SafetyCertificateOutlined />}
        title="Role + Permission + Scope"
        description="การเพิ่มและแก้ไขจะตรวจ Permission ของ ems.employee_business_structure และตรวจ Scope ของพนักงานรวมถึงขอบเขตองค์กรที่กำหนดซ้ำที่ Backend"
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" disabled={disabled}>
        <Row gutter={16}>
          <Col xs={24} lg={14}>
            <Form.Item
              label="พนักงาน"
              name="employee_id"
              rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}
            >
              <EmployeeBusinessStructureEmployeeSelect
                action={isCreate ? "create" : mode === "edit" ? "edit" : "view"}
                availableOnly={isCreate}
                disabled={!isCreate || disabled}
                initialOption={employeeInitialOption}
                onChange={(value, row) => {
                  form.setFieldValue("employee_id", value || undefined);

                  if (isCreate) {
                    const level = row?.management_level || "";
                    form.setFieldValue("management_level", level || undefined);
                    form.setFieldValue(
                      "scopes",
                      level ? [defaultScopeForLevel(level)] : []
                    );
                    form.setFieldValue("supervisor_employee_id", undefined);
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={5}>
            <Form.Item
              label="Management Level"
              name="management_level"
              rules={[{ required: true, message: "กรุณาระบุ Management Level" }]}
            >
              <Select
                options={MANAGEMENT_LEVEL_OPTIONS}
                disabled={disabled || Boolean(employeeId)}
                placeholder="P9 - P12"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={5}>
            <Form.Item label="สถานะ" name="status" initialValue="active">
              <Select
                options={[
                  { value: "active", label: "ใช้งาน" },
                  { value: "inactive", label: "ไม่ใช้งาน" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={14}>
            <Form.Item
              label="ผู้บังคับบัญชา / Reports To"
              name="supervisor_employee_id"
              rules={[
                {
                  required: Boolean(managementLevel && managementLevel !== "P12"),
                  message: "กรุณาเลือกผู้บังคับบัญชา",
                },
              ]}
              extra={
                managementLevel === "P12"
                  ? "P12 เป็นระดับสูงสุด จึงไม่มีผู้บังคับบัญชา"
                  : supervisorLevel
                    ? `ผู้บังคับบัญชาต้องเป็นระดับ ${supervisorLevel}`
                    : "เลือกพนักงานก่อน"
              }
            >
              <EmployeeBusinessStructureEmployeeSelect
                action={mode === "create" ? "create" : mode === "edit" ? "edit" : "view"}
                managementLevel={supervisorLevel}
                excludeEmployeeId={employeeId}
                disabled={disabled || !managementLevel || managementLevel === "P12"}
                initialOption={supervisorInitialOption}
                placeholder={
                  supervisorLevel
                    ? `ค้นหาผู้บังคับบัญชาระดับ ${supervisorLevel}`
                    : "เลือกพนักงานก่อน"
                }
              />
            </Form.Item>
          </Col>

          <Col xs={12} lg={5}>
            <Form.Item
              label="Primary Assignment"
              name="is_primary"
              valuePropName="checked"
              initialValue
            >
              <Switch checkedChildren="ใช่" unCheckedChildren="ไม่" />
            </Form.Item>
          </Col>

          <Col xs={12} lg={5}>
            <Form.Item label="ลำดับ" name="sort_order" initialValue={0}>
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left">ขอบเขตที่รับผิดชอบ</Divider>

        {managementLevel ? (
          <Text type="secondary">
            ระดับ {managementLevel} รองรับ: {(ALLOWED_SCOPE_TYPES[managementLevel] || [])
              .map((type) => SCOPE_LABELS[type] || type)
              .join(", ") || "-"}
          </Text>
        ) : (
          <Text type="secondary">เลือกพนักงานเพื่อกำหนดขอบเขตที่รับผิดชอบ</Text>
        )}

        <div style={{ marginTop: 12 }}>
          <Form.List
            name="scopes"
            rules={[
              {
                validator: async (_, value) => {
                  if (!Array.isArray(value) || value.length < 1) {
                    throw new Error("กรุณากำหนดขอบเขตอย่างน้อย 1 รายการ");
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                {fields.map((field, index) => {
                  const { key: fieldKey, ...fieldProps } = field;
                  const scope = scopes?.[index] || {};
                  const scopeType = scope.scope_type || "";
                  const targetField = SCOPE_FIELD_BY_TYPE[scopeType];
                  const allowedTypes = ALLOWED_SCOPE_TYPES[managementLevel] || [];

                  return (
                    <div
                      key={fieldKey}
                      style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} md={6}>
                          <Form.Item
                            {...fieldProps}
                            label={index === 0 ? "ประเภทขอบเขต" : undefined}
                            name={[field.name, "scope_type"]}
                            rules={[{ required: true, message: "เลือกประเภทขอบเขต" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Scope Type"
                              options={allowedTypes.map((type) => ({
                                value: type,
                                label: SCOPE_LABELS[type] || type,
                              }))}
                              onChange={(value) => {
                                const current = form.getFieldValue("scopes") || [];
                                const next = [...current];
                                next[index] = {
                                  ...clearScopeTarget(next[index]),
                                  scope_type: value,
                                  is_primary: next[index]?.is_primary ?? index === 0,
                                  status: next[index]?.status || "active",
                                  sort_order: Number(next[index]?.sort_order ?? index),
                                };
                                form.setFieldValue("scopes", next);
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={9}>
                          {scopeType === "all" ? (
                            <div>
                              {index === 0 && <Text type="secondary">ขอบเขต</Text>}
                              <div style={{ marginTop: index === 0 ? 8 : 0 }}>
                                <Tag color="green">ทั้งองค์กร</Tag>
                              </div>
                            </div>
                          ) : targetField ? (
                            <Form.Item
                              {...fieldProps}
                              label={index === 0 ? "หน่วยงาน/ส่วนงานที่รับผิดชอบ" : undefined}
                              name={[field.name, targetField]}
                              rules={[{ required: true, message: "กรุณาเลือกขอบเขต" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder={`เลือก${SCOPE_LABELS[scopeType] || "ขอบเขต"}`}
                                options={optionsForScope(scopeType, masterData)}
                              />
                            </Form.Item>
                          ) : (
                            <Text type="secondary">เลือกประเภทขอบเขต</Text>
                          )}
                        </Col>

                        <Col xs={8} md={3}>
                          <Form.Item
                            {...fieldProps}
                            label={index === 0 ? "Primary" : undefined}
                            name={[field.name, "is_primary"]}
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Switch
                              onChange={(checked) => {
                                if (checked) setPrimaryScope(index);
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={8} md={3}>
                          <Form.Item
                            {...fieldProps}
                            label={index === 0 ? "สถานะ" : undefined}
                            name={[field.name, "status"]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              options={[
                                { value: "active", label: "ใช้งาน" },
                                { value: "inactive", label: "ไม่ใช้งาน" },
                              ]}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={8} md={3}>
                          {!disabled && managementLevel !== "P12" && fields.length > 1 && (
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            >
                              ลบ
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </div>
                  );
                })}

                {!disabled && managementLevel && managementLevel !== "P12" && (
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => add(makeScope("", fields.length))}
                  >
                    เพิ่มขอบเขตที่รับผิดชอบ
                  </Button>
                )}

                <Form.ErrorList errors={errors} />
              </Space>
            )}
          </Form.List>
        </div>
      </Form>
    </Modal>
  );
}
