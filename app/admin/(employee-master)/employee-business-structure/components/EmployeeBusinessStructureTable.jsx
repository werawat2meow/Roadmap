"use client";

import { Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const SCOPE_LABELS = {
  all: "ทั้งองค์กร",
  company: "บริษัท",
  branch_group: "กรุ๊ปสังกัด",
  branch: "สังกัด",
  department: "แผนก",
  division: "ฝ่าย",
  unit: "หน่วยงาน",
};

function getScopeTargetName(scope = {}) {
  switch (scope.scope_type) {
    case "all":
      return "ทั้งองค์กร";
    case "company":
      return scope.company_name || "-";
    case "branch_group":
      return scope.branch_group_name || "-";
    case "branch":
      return scope.branch_name || "-";
    case "department":
      return scope.department_name || "-";
    case "division":
      return scope.division_name || "-";
    case "unit":
      return scope.unit_name || "-";
    default:
      return "-";
  }
}

function getScopes(record = {}) {
  if (Array.isArray(record.scopes) && record.scopes.length) {
    return record.scopes;
  }

  if (!record.scope_type) return [];

  return [
    {
      scope_type: record.scope_type,
      company_name: record.company_name,
      branch_group_name: record.branch_group_name,
      branch_name: record.branch_name,
      department_name: record.department_name,
      division_name: record.division_name,
      unit_name: record.unit_name,
      is_primary: true,
      status: record.status,
    },
  ];
}

export default function EmployeeBusinessStructureTable({
  data = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  deletingId = "",
  canEditRecord = () => false,
  canDeleteRecord = () => false,
  onView,
  onEdit,
  onDelete,
  onChange,
}) {
  const columns = [
    {
      title: "พนักงาน",
      key: "employee",
      width: 220,
      fixed: "left",
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{record.employee_name || "-"}</Text>
          <Text type="secondary">{record.employee_code || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "ตำแหน่ง / Job",
      key: "position",
      width: 220,
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text>{record.position_name || "-"}</Text>
          <Text type="secondary">{record.job_name || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "ระดับบริหาร",
      dataIndex: "management_level",
      key: "management_level",
      width: 110,
      render: (value) => <Tag color="blue">{value || "-"}</Tag>,
    },
    {
      title: "ผู้บังคับบัญชา / Reports To",
      key: "supervisor",
      width: 220,
      render: (_, record) =>
        record.management_level === "P12" ? (
          <Tag>สูงสุดของสายบริหาร</Tag>
        ) : (
          <Space orientation="vertical" size={0}>
            <Text>{record.supervisor_name || "-"}</Text>
            <Text type="secondary">
              {[record.supervisor_position_name, record.supervisor_management_level]
                .filter(Boolean)
                .join(" • ") || "-"}
            </Text>
          </Space>
        ),
    },
    {
      title: "ขอบเขตที่รับผิดชอบ",
      key: "scopes",
      width: 320,
      render: (_, record) => {
        const scopes = getScopes(record);

        if (!scopes.length) return "-";

        return (
          <Space wrap size={[4, 4]}>
            {scopes.map((scope, index) => (
              <Tag
                key={scope.id || `${scope.scope_type}-${index}`}
                color={scope.is_primary ? "geekblue" : undefined}
              >
                {SCOPE_LABELS[scope.scope_type] || scope.scope_type}: {getScopeTargetName(scope)}
                {scope.is_primary ? " • Primary" : ""}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (value) => (
        <Tag color={value === "active" ? "green" : "default"}>
          {value === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 132,
      fixed: "right",
      render: (_, record) => {
        const canEdit = Boolean(canEditRecord?.(record));
        const canDelete = Boolean(canDeleteRecord?.(record));

        return (
          <Space size={4}>
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView?.(record)}
              />
            </Tooltip>

            {canEdit && (
              <Tooltip title="แก้ไข">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => onEdit?.(record)}
                />
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="ยกเลิกโครงสร้างบริหาร">
                <Button
                  type="text"
                  danger
                  loading={String(deletingId) === String(record.id)}
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete?.(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 1400 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (value) => `ทั้งหมด ${Number(value || 0).toLocaleString()} รายการ`,
      }}
      onChange={onChange}
    />
  );
}
