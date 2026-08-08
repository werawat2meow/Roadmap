"use client";

import {
  Alert,
  Button,
  Col,
  Form,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  BankOutlined,
  BranchesOutlined,
  DeleteOutlined,
  GlobalOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

/* =========================================================
   Constants
========================================================= */

const SCOPE_TYPE_OPTIONS = [
  {
    label: "ทุกสังกัด",
    value: "all",
    icon: <GlobalOutlined />,
  },
  {
    label: "บริษัท",
    value: "company",
    icon: <BankOutlined />,
  },
  {
    label: "กรุ๊ปสังกัด",
    value: "branch_group",
    icon: <BranchesOutlined />,
  },
  {
    label: "สังกัด",
    value: "branch",
    icon: <ApartmentOutlined />,
  },
  {
    label: "แผนก",
    value: "department",
    icon: <TeamOutlined />,
  },
  {
    label: "ฝ่าย",
    value: "division",
    icon: <BranchesOutlined />,
  },
  {
    label: "หน่วยงาน",
    value: "unit",
    icon: <TeamOutlined />,
  },
];

/* =========================================================
   Helpers
========================================================= */

function makeOptions(
  items = [],
  codeKey,
  nameKey
) {
  return items.map((item) => {
    const code = item?.[codeKey];
    const name =
      item?.[nameKey] || "-";

    return {
      value: item.id,
      label: code
        ? `${code} - ${name}`
        : name,
      disabled:
        item.status === "inactive",
    };
  });
}

function getScopeTypeLabel(scopeType) {
  return (
    SCOPE_TYPE_OPTIONS.find(
      (item) =>
        item.value === scopeType
    )?.label || scopeType
  );
}

function getTargetName(scope) {
  if (scope?.target_name) {
    return scope.target_code
      ? `${scope.target_code} - ${scope.target_name}`
      : scope.target_name;
  }

  if (scope?.scope_type === "all") {
    return "ทุกสังกัด";
  }

  return null;
}

/* =========================================================
   Component
========================================================= */

export default function UserAccessScopeItem({
  form,

  field,

  index,

  scope = {},

  totalFields = 1,

  disabled = false,

  masterLoading = false,

  companies = [],

  branchGroups = [],

  branches = [],

  departments = [],

  divisions = [],

  units = [],

  onRemove,
}) {
  const scopeType =
    scope?.scope_type || "branch";

  const companyOptions =
    makeOptions(
      companies,
      "company_code",
      "company_name_th"
    );

  const branchGroupOptions =
    makeOptions(
      branchGroups,
      "group_code",
      "group_name"
    );

  const branchOptions =
    makeOptions(
      branches,
      "branch_code",
      "branch_name"
    );

  const departmentOptions =
    makeOptions(
      departments,
      "department_code",
      "department_name"
    );

  const divisionOptions =
    makeOptions(
      divisions,
      "division_code",
      "division_name"
    );

  const unitOptions =
    makeOptions(
      units,
      "unit_code",
      "unit_name"
    );

  const selectProps = {
    showSearch: true,
    allowClear: true,
    optionFilterProp: "label",
    loading: masterLoading,
    disabled:
      disabled || masterLoading,
  };

  /* =======================================================
     Reset Target when Scope Type changes
  ======================================================= */

  const handleScopeTypeChange = (
    nextScopeType
  ) => {
    const scopes =
      form.getFieldValue(
        "scopes"
      ) || [];

    const current =
      scopes[index] || {};

    scopes[index] = {
      ...current,

      scope_type:
        nextScopeType,

      company_id: null,

      branch_group_id: null,

      branch_id: null,

      department_id: null,

      division_id: null,

      unit_id: null,
    };

    form.setFieldValue(
      "scopes",
      scopes
    );
  };

  /* =======================================================
     Render Target Select
  ======================================================= */

  const renderTargetField = () => {
    switch (scopeType) {
      case "all":
        return (
          <Alert
            type="info"
            showIcon
            title="เข้าถึงข้อมูลทุกสังกัด"
            description="เมื่อเลือกทุกสังกัด จะไม่สามารถเพิ่มขอบเขตประเภทอื่นร่วมกันได้"
          />
        );

      case "company":
        return (
          <Form.Item
            name={[
              field.name,
              "company_id",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
            className="mb-0"
          >
            <Select
              {...selectProps}
              placeholder="เลือกบริษัท"
              options={
                companyOptions
              }
            />
          </Form.Item>
        );

      case "branch_group":
        return (
          <Form.Item
            name={[
              field.name,
              "branch_group_id",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกกรุ๊ปสังกัด",
              },
            ]}
            className="mb-0"
          >
            <Select
              {...selectProps}
              placeholder="เลือกกรุ๊ปสังกัด"
              options={
                branchGroupOptions
              }
            />
          </Form.Item>
        );

      case "branch":
        return (
          <Form.Item
            name={[
              field.name,
              "branch_id",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสังกัด",
              },
            ]}
            className="mb-0"
          >
            <Select
              {...selectProps}
              placeholder="เลือกสังกัด"
              options={
                branchOptions
              }
            />
          </Form.Item>
        );

      case "department":
        return (
          <Form.Item
            name={[
              field.name,
              "department_id",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกแผนก",
              },
            ]}
            className="mb-0"
          >
            <Select
              {...selectProps}
              placeholder="เลือกแผนก"
              options={
                departmentOptions
              }
            />
          </Form.Item>
        );

      case "division":
        return (
          <Form.Item
            name={[
              field.name,
              "division_id",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกฝ่าย",
              },
            ]}
            className="mb-0"
          >
            <Select
              {...selectProps}
              placeholder="เลือกฝ่าย"
              options={
                divisionOptions
              }
            />
          </Form.Item>
        );

      case "unit":
        return (
          <Form.Item
            name={[
              field.name,
              "unit_id",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกหน่วยงาน",
              },
            ]}
            className="mb-0"
          >
            <Select
              {...selectProps}
              placeholder="เลือกหน่วยงาน"
              options={unitOptions}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {/* =====================================================
          Header
      ===================================================== */}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            {index + 1}
          </div>

          <div>
            <div className="font-semibold text-slate-800">
              ขอบเขตที่{" "}
              {index + 1}
            </div>

            <Text
              type="secondary"
              className="text-xs"
            >
              {getScopeTypeLabel(
                scopeType
              )}
            </Text>
          </div>
        </Space>

        {!disabled &&
          totalFields > 1 && (
            <Button
              danger
              type="text"
              icon={
                <DeleteOutlined />
              }
              onClick={() =>
                onRemove?.(
                  field.name
                )
              }
            >
              ลบ
            </Button>
          )}
      </div>

      {/* =====================================================
          Scope Fields
      ===================================================== */}

      <Row
        gutter={[16, 16]}
        align="top"
      >
        <Col
          xs={24}
          md={7}
        >
          <Form.Item
            label="ประเภทขอบเขต"
            name={[
              field.name,
              "scope_type",
            ]}
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกประเภทขอบเขต",
              },
            ]}
          >
            <Select
              disabled={disabled}
              options={SCOPE_TYPE_OPTIONS.map(
                (item) => ({
                  value:
                    item.value,

                  label: (
                    <Space>
                      {item.icon}
                      {item.label}
                    </Space>
                  ),
                })
              )}
              onChange={
                handleScopeTypeChange
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={13}
        >
          <div className="mb-2 text-sm font-medium text-slate-700">
            เลือก
            {getScopeTypeLabel(
              scopeType
            )}
          </div>

          {renderTargetField()}

          {disabled &&
            getTargetName(scope) && (
              <div className="mt-2 text-sm text-slate-500">
                ขอบเขต:{" "}
                <Text strong>
                  {getTargetName(
                    scope
                  )}
                </Text>
              </div>
            )}
        </Col>

        <Col
          xs={24}
          md={4}
        >
          <Form.Item
            label="ใช้งาน"
            name={[
              field.name,
              "status",
            ]}
            getValueProps={(value) => ({
              checked:
                value === "active",
            })}
            getValueFromEvent={(
              checked
            ) =>
              checked
                ? "active"
                : "inactive"
            }
          >
            <Switch
              disabled={disabled}
              checkedChildren="เปิด"
              unCheckedChildren="ปิด"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}