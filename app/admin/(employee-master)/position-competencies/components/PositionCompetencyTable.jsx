"use client";

import { Button, Space, Table, Tag } from "antd";

import {
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";

export default function PositionCompetencyTable({
  loading,
  data,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  const getImportanceColor = (
    level
  ) => {
    switch (level) {
      case "critical":
        return "red";

      case "high":
        return "volcano";

      case "medium":
        return "gold";

      case "low":
        return "green";

      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Position",
      dataIndex: "position_name",
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
      title: "Competency",
      dataIndex: "competency_name",
      width: 260,
      render: (_, record) => (
        <div>
          <div className="font-semibold">
            {record.competency_name}
          </div>

          <div className="text-xs text-gray-500">
            {record.competency_code}
          </div>

          {record.competency_type && (
            <Tag className="mt-1">
              {
                record.competency_type
              }
            </Tag>
          )}
        </div>
      ),
    },

    {
      title: "Required Level",
      dataIndex:
        "required_level_name",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Tag color="blue">
          {
            record.required_level_code
          }{" "}
          -
          {" "}
          {
            record.required_level_name
          }
        </Tag>
      ),
    },

    {
      title: "Importance",
      dataIndex:
        "importance_level",
      width: 150,
      align: "center",
      render: (value) => (
        <Tag
          color={getImportanceColor(
            value
          )}
        >
          {String(
            value || ""
          ).toUpperCase()}
        </Tag>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "success"
              : "default"
          }
        >
          {value}
        </Tag>
      ),
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Action",
      width: 140,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space>
          {canEdit && (
            <Button
              type="text"
              icon={
                <EditOutlined />
              }
              onClick={() =>
                onEdit(record)
              }
            />
          )}

          {canDelete && (
            <Button
              danger
              type="text"
              icon={
                <DeleteOutlined />
              }
              onClick={() =>
                onDelete(record)
              }
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      scroll={{
        x: 1200,
      }}
    />
  );
}