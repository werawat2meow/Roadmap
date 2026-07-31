"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
} from "antd";

import StatusTag from "./StatusTag";

export default function UnitPositionTable({
  loading = false,

  rows = [],

  page = 1,
  pageSize = 20,
  total = 0,

  canEdit = false,
  canDelete = false,

  deletingId = "",

  onEdit,
  onDelete,

  onPageChange,
}) {
  const columns = [
    {
      title: "#",
      width: 70,
      render: (_, __, index) =>
        (page - 1) * pageSize + index + 1,
    },

    {
      title: "หน่วยงาน",
      dataIndex: "unit_name",
      width: 220,
    },

    {
      title: "ฝ่าย",
      dataIndex: "division_name",
      width: 180,
    },

    {
      title: "แผนก",
      dataIndex: "department_name",
      width: 180,
    },

    {
      title: "ตำแหน่ง",
      dataIndex: "position_name",
      width: 220,
    },

    {
      title: "ระดับ",
      dataIndex: "position_level",
      width: 120,
      align: "center",
    },

    {
      title: "จำนวนอัตรา",
      dataIndex: "headcount_target",
      width: 120,
      align: "center",
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: (_, row) => (
        <StatusTag
          status={row.status}
        />
      ),
    },

    {
      title: "จัดการ",
      width: 180,
      align: "center",

      render: (_, row) => (
        <Space>

          {canEdit && (
            <Button
              onClick={() =>
                onEdit?.(row)
              }
            >
              Edit
            </Button>
          )}

          {canDelete && (
            <Popconfirm
              title="ลบข้อมูลนี้ ?"
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() =>
                onDelete?.(row)
              }
            >
              <Button
                danger
                loading={
                  deletingId === row.id
                }
              >
                Delete
              </Button>
            </Popconfirm>
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
      dataSource={rows}
      scroll={{
        x: 1200,
      }}
      pagination={{
        current: page,
        pageSize,
        total,

        showSizeChanger: false,

        showTotal: (total) =>
          `ทั้งหมด ${total} รายการ`,

        onChange: onPageChange,
      }}
    />
  );
}