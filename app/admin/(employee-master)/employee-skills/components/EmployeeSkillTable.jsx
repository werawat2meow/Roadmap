"use client";

import { Table, Tag, Space, Button, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

export default function EmployeeSkillTable({
  data,
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) {
  const showActionColumn = canEdit || canDelete;

  const columns = [
    {
      title: "Employee",
      width: 220,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.employee_name}</div>
          <div style={{ color: "#888", fontSize: 12 }}>{row.employee_code}</div>
        </div>
      ),
    },
    {
      title: "Skill",
      width: 220,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.skill_name}</div>
          <div style={{ color: "#888", fontSize: 12 }}>{row.skill_code}</div>
        </div>
      ),
    },
    { title: "Category", width: 180, dataIndex: "skill_category_name" },
    {
      title: "Current",
      width: 90,
      align: "center",
      render: (_, row) => <Tag color="blue">Lv.{row.current_level}</Tag>,
    },
    {
      title: "Target",
      width: 90,
      align: "center",
      render: (_, row) =>
        row.target_level ? <Tag color="purple">Lv.{row.target_level}</Tag> : "-",
    },
    {
      title: "Importance",
      width: 120,
      align: "center",
      render: (_, row) => {
        const color = { low: "default", medium: "blue", high: "orange", critical: "red" };
        return <Tag color={color[row.importance_level]}>{row.importance_level}</Tag>;
      },
    },
    {
      title: "Verified",
      width: 120,
      align: "center",
      render: (_, row) =>
        row.is_verified ? (
          <Tag color="green"><CheckCircleOutlined /> Verified</Tag>
        ) : (
          <Tag color="default"><CloseCircleOutlined /> No</Tag>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      align: "center",
      render: (value) => <Tag color={value === "active" ? "green" : "red"}>{value}</Tag>,
    },
    {
      title: "Updated",
      width: 170,
      render: (_, row) =>
        row.updated_at ? new Date(row.updated_at).toLocaleString("th-TH") : "-",
    },
  ];

  if (showActionColumn) {
    columns.push({
      title: "Action",
      key: "action",
      width: 120,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <Space>
          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(row)} />
            </Tooltip>
          )}

          {canDelete && (
            <Popconfirm
              title="ยืนยันการลบ"
              description="ต้องการลบรายการนี้ใช่หรือไม่?"
              okText="ลบ"
              cancelText="ยกเลิก"
              onConfirm={() => onDelete(row)}
            >
              <Tooltip title="ลบ">
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: showActionColumn ? 1500 : 1400 }}
      bordered
      size="middle"
    />
  );
}