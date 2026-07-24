"use client";

import { Table, Button, Space } from "antd";
import { EditOutlined } from "@ant-design/icons";

import SkillStatusTag from "./SkillStatusTag";
import SkillDeleteButton from "./SkillDeleteButton";

export default function SkillTable({
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
      dataIndex: "skill_code",
      key: "skill_code",
      width: 140,
      sorter: (a, b) =>
        (a.skill_code || "").localeCompare(
          b.skill_code || ""
        ),
    },

    {
      title: "Skill Name",
      dataIndex: "skill_name",
      key: "skill_name",
      ellipsis: true,
    },

    {
      title: "Category",
      dataIndex: "skill_category",
      key: "skill_category",
      width: 220,
      render: (value) => value || "-",
    },

    {
      title: "Sort",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 90,
      align: "center",
      sorter: (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (_, record) => (
        <SkillStatusTag
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
              onClick={() =>
                onEdit(record)
              }
            />
          )}

          {canDelete && (
            <SkillDeleteButton
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