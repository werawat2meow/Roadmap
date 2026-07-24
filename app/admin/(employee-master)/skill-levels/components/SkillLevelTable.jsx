"use client";

import {
  Button,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";

export default function SkillLevelTable({
  data = [],
  loading = false,

  onEdit,
  onDelete,

  canEdit = true,
  canDelete = true,
}) {
  const columns = [
    {
      title: "Code",
      dataIndex: "level_code",
      key: "level_code",
      width: 150,
      render: (value) => (
        <Tag color="blue">
          {value}
        </Tag>
      ),
    },

    {
      title: "Level Name",
      dataIndex: "level_name",
      key: "level_name",
      width: 220,
    },

    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      width: 100,
      align: "center",
      render: (value) => (
        <Tag color="geekblue">
          {value}
        </Tag>
      ),
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value) =>
        value ? (
          value
        ) : (
          <span className="text-gray-400">
            -
          </span>
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
        <Space size="small">
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
            <Tooltip title="ลบ">
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
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
      dataSource={data}
      pagination={false}
      scroll={{
        x: 1000,
      }}
    />
  );
}