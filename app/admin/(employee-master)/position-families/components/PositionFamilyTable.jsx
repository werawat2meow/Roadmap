"use client";

import { Table, Tag, Space, Button, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function PositionFamilyTable({
  loading,
  families,
  page,
  pageSize,
  canEdit,
  canDelete,
  deletingId,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "#",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: "Family Code",
      dataIndex: "family_code",
      width: 180,
      render: (value) => (
        <span className="font-semibold">
          {value}
        </span>
      ),
    },
    {
      title: "Family Name",
      dataIndex: "family_name",
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (value) =>
        value || "-",
    },
    {
      title: "Sort",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : "red"
          }
        >
          {status === "active"
            ? "Active"
            : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Action",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space>

          {canEdit && (
            <Tooltip title="Edit">

              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit(record)
                }
              />

            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="Delete">

              <Button
                danger
                type="text"
                loading={
                  deletingId === record.id
                }
                icon={<DeleteOutlined />}
                onClick={() =>
                  onDelete(record)
                }
              />

            </Tooltip>
          )}

        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      bordered
      loading={loading}
      columns={columns}
      dataSource={families}
      pagination={false}
      scroll={{ x: 900 }}
    />
  );
}