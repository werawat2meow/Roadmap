"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Rate,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";

const importanceColor = {
  low: "default",
  medium: "blue",
  high: "orange",
  critical: "red",
};

const importanceLabel = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export default function PositionSkillTable({
  data = [],
  loading = false,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) {
  const columns = [
    {
      title: "ตำแหน่ง",
      dataIndex: "position_name",
      key: "position_name",
      width: 220,
      render: (_, record) => (
        <div>
          <div className="font-semibold">
            {record.position_name}
          </div>

          <div className="text-xs text-gray-500">
            {record.position_code}
          </div>
        </div>
      ),
    },

    {
      title: "ทักษะ",
      dataIndex: "skill_name",
      key: "skill_name",
      width: 240,
      render: (_, record) => (
        <div>
          <div className="font-semibold">
            {record.skill_name}
          </div>

          <div className="text-xs text-gray-500">
            {record.skill_code}
          </div>
        </div>
      ),
    },

    {
      title: "Required Level",
      dataIndex: "required_level",
      key: "required_level",
      width: 170,
      align: "center",
      render: (value) => (
        <Space orientation="vertical" size={0}>
          <Rate
            disabled
            count={5}
            value={value}
          />

          <span className="text-xs text-gray-500">
            {value} / 5
          </span>
        </Space>
      ),
    },

    {
      title: "Importance",
      dataIndex: "importance_level",
      key: "importance_level",
      width: 140,
      align: "center",
      render: (value) => (
        <Tag color={importanceColor[value]}>
          {importanceLabel[value]}
        </Tag>
      ),
    },

    {
      title: "Mandatory",
      dataIndex: "is_mandatory",
      key: "is_mandatory",
      width: 130,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="green">
            YES
          </Tag>
        ) : (
          <Tag>
            NO
          </Tag>
        ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (value) =>
        value === "active" ? (
          <Tag color="success">
            Active
          </Tag>
        ) : (
          <Tag color="default">
            Inactive
          </Tag>
        ),
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}

          {canDelete && (
            <Popconfirm
              title="ลบข้อมูลนี้ ?"
              okText="ลบ"
              cancelText="ยกเลิก"
              onConfirm={() => onDelete(record)}
            >
              <Tooltip title="ลบ">
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      bordered
      scroll={{
        x: 1200,
      }}
    />
  );
}