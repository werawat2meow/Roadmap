"use client";

import { Table, Tag, Space, Button, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function PositionLevelBandTable({
  data = [],
  loading,
  pagination,
  page,
  pageSize,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
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
      title: "Band Code",
      dataIndex: "band_code",
      key: "band_code",
      width: 130,
      sorter: (a, b) =>
        (a.band_code || "").localeCompare(
          b.band_code || ""
        ),
    },

    {
      title: "Band Name",
      dataIndex: "band_name",
      key: "band_name",
      ellipsis: true,
      sorter: (a, b) =>
        (a.band_name || "").localeCompare(
          b.band_name || ""
        ),
    },

    {
      title: "Step",
      dataIndex: "step_no",
      key: "step_no",
      width: 90,
      align: "center",
      sorter: (a, b) =>
        (a.step_no || 0) - (b.step_no || 0),
    },

    {
      title: "Min Salary",
      dataIndex: "salary_min",
      key: "salary_min",
      width: 150,
      align: "right",
      render: (value) =>
        Number(value || 0).toLocaleString(),
      sorter: (a, b) =>
        (a.salary_min || 0) -
        (b.salary_min || 0),
    },

    {
      title: "Max Salary",
      dataIndex: "salary_max",
      key: "salary_max",
      width: 150,
      align: "right",
      render: (value) =>
        Number(value || 0).toLocaleString(),
      sorter: (a, b) =>
        (a.salary_max || 0) -
        (b.salary_max || 0),
    },

    {
      title: "Midpoint",
      dataIndex: "midpoint",
      key: "midpoint",
      width: 150,
      align: "right",
      render: (value) =>
        Number(value || 0).toLocaleString(),
    },

    {
      title: "Effective",
      dataIndex: "effective_date",
      key: "effective_date",
      width: 130,
      align: "center",
      render: (value) =>
        value || "-",
    },

    {
      title: "Expire",
      dataIndex: "expire_date",
      key: "expire_date",
      width: 130,
      align: "center",
      render: (value) =>
        value || "-",
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
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
        x: 1400,
      }}
    />
  );
}