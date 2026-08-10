"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";

import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";

import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

/* =========================================================
   Helpers
========================================================= */

function getPermissionCount(record) {
  const count = Number(
    record?.permission_count
  );

  if (Number.isFinite(count)) {
    return count;
  }

  if (
    Array.isArray(
      record?.permission_ids
    )
  ) {
    return record.permission_ids.length;
  }

  if (
    Array.isArray(record?.permissions)
  ) {
    return record.permissions.length;
  }

  return 0;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    }
  ).format(date);
}

/* =========================================================
   Component
========================================================= */

export default function RoleTable({
  rows = [],

  loading = false,

  page = 1,

  pageSize = 20,

  total = 0,

  canEdit = false,

  canDelete = false,

  deletingId = null,

  onView,

  onEdit,

  onDelete,

  onTableChange,
}) {
  const columns = [
    {
      title: "รหัส Role",
      dataIndex: "role_code",
      key: "role_code",
      width: 210,

      render: (value, record) => (
        <Space>
          <div
            className={
              record?.is_system
                ? "flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600"
                : "flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
            }
          >
            {record?.is_system ? (
              <LockOutlined />
            ) : (
              <SafetyOutlined />
            )}
          </div>

          <div>
            <Text strong>
              {value || "-"}
            </Text>

            <div className="mt-1">
              {record?.is_system ? (
                <Tag color="purple">
                  System
                </Tag>
              ) : (
                <Tag color="blue">
                  Custom
                </Tag>
              )}
            </div>
          </div>
        </Space>
      ),
    },

    {
      title: "ชื่อ Role",
      dataIndex: "role_name",
      key: "role_name",
      width: 240,

      render: (value) => (
        <Text strong>
          {value || "-"}
        </Text>
      ),
    },

    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
      width: 320,

      ellipsis: true,

      render: (value) => (
        <Text type="secondary">
          {value || "-"}
        </Text>
      ),
    },

    {
      title: "Permissions",
      key: "permissions",
      width: 140,
      align: "center",

      render: (_, record) => (
        <Tag
          color={
            getPermissionCount(record) > 0
              ? "geekblue"
              : "default"
          }
        >
          {getPermissionCount(record)} สิทธิ์
        </Tag>
      ),
    },

    {
      title: "สถานะ",
      dataIndex: "is_active",
      key: "is_active",
      width: 110,
      align: "center",

      render: (value) => (
        <StatusTag
          value={
            value
              ? "active"
              : "inactive"
          }
        />
      ),
    },

    {
      title: "แก้ไขล่าสุด",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 190,

      render: (value) => (
        <Text
          type="secondary"
          className="text-xs"
        >
          {formatDateTime(value)}
        </Text>
      ),
    },

    {
      title: "จัดการ",
      key: "actions",
      width: 150,
      fixed: "right",
      align: "center",

      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                onView?.(record)
              }
            />
          </Tooltip>

          {canEdit && (
            <Tooltip title="แก้ไข Role และ Permissions">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit?.(record)
                }
              />
            </Tooltip>
          )}

          {canDelete &&
            !record?.is_system && (
              <DeleteConfirm
                title="ลบ Role"
                description={`ยืนยันการลบ Role "${record.role_code} - ${record.role_name}" ใช่หรือไม่`}
                loading={
                  deletingId ===
                  record.id
                }
                onConfirm={() =>
                  onDelete?.(record)
                }
              />
            )}
        </Space>
      ),
    },
  ];

  return (
    <MasterTable
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      scroll={{
        x: 1380,
      }}
      onChange={onTableChange}
    />
  );
}