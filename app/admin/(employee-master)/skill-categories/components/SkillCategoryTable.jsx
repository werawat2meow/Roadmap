"use client";

import { Table, Button, Space } from "antd";
import { EditOutlined } from "@ant-design/icons";

import SkillCategoryStatusTag from "./SkillCategoryStatusTag";
import SkillCategoryDeleteButton from "./SkillCategoryDeleteButton";

export default function SkillCategoryTable({
  loading,
  data,
  canEdit,
  canDelete,
  onEdit,
  onDeleteSuccess,
}) {
  const columns = [
    {
      title: "Code",
      dataIndex: "category_code",
      key: "category_code",
      width: 140,
      sorter: (a, b) =>
        a.category_code.localeCompare(b.category_code),
    },

    {
      title: "Category Name",
      dataIndex: "category_name",
      key: "category_name",
      ellipsis: true,
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value) => value || "-",
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (_, record) => (
        <SkillCategoryStatusTag
          status={record.status}
        />
      ),
    },

    {
      title: "Action",
      key: "action",
      width: 170,
      align: "center",

      render: (_, record) => (
        <Space>
          {canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          )}

          {canDelete && (
            <SkillCategoryDeleteButton
              record={record}
              onSuccess={onDeleteSuccess}
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
        x: 900,
      }}
    />
  );
}