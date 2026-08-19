"use client";

import { Button, Space, Table, Tooltip, Typography } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

function formatThaiDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SalaryStructureTable({
  rows = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  deletingId = null,
}) {
  const columns = [
    {
      title: "ลำดับ",
      width: 90,
      align: "center",
      render: (_, __, index) =>
        (Number(page) - 1) * Number(pageSize) + index + 1,
    },
    {
      title: "ชื่อโครงสร้างเงินเดือน",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <div className="min-w-[260px]">
          <Text strong className="text-slate-800">
            {value || "-"}
          </Text>
          <div className="mt-1 text-xs text-slate-400">
            Salary Structure Master
          </div>
        </div>
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      key: "created_at",
      width: 220,
      render: (value) => formatThaiDateTime(value),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 160,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView?.(record)}
            />
          </Tooltip>

          {canEdit ? (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          ) : null}

          {canDelete ? (
            <Tooltip title="ลบ">
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
                onClick={() => onDelete?.(record)}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      scroll={{ x: 820 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (value) => `ทั้งหมด ${value.toLocaleString()} รายการ`,
        onChange: (nextPage, nextPageSize) =>
          onPageChange?.(nextPage, nextPageSize),
      }}
    />
  );
}
