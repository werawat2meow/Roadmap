"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function UserAccountTable({
  data = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,

  canView = false,
  canEdit = false,
  canDelete = false,
  canResetPassword = false,

  currentUserAccountId = null,

  onChange,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
}) {
  const columns = [
    {
      title: "#",
      key: "no",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: 190,
      render: (value, record) => (
        <Space size={6}>
          <span style={{ fontWeight: 600 }}>
            {value || "-"}
          </span>

          {String(record?.id || "") ===
            String(currentUserAccountId || "") && (
            <Tag>บัญชีปัจจุบัน</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "พนักงาน",
      key: "employee",
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {record.employee_code || "-"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record.employee_name || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      width: 240,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {record.role_code || "-"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {record.role_name || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      align: "center",
      render: (value) => (
        <StatusTag
          value={value ? "active" : "inactive"}
        />
      ),
    },
    {
      title: "Login ล่าสุด",
      dataIndex: "last_login_at",
      key: "last_login_at",
      width: 180,
      render: formatDateTime,
    },
    {
      title: "สร้างเมื่อ",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: formatDateTime,
    },
    {
      title: "จัดการ",
      key: "action",
      width: 190,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        const isAdmin =
          record?.username?.toLowerCase() ===
          "admin";

        const isCurrentUser =
          String(record?.id || "") ===
          String(currentUserAccountId || "");

        return (
          <Space size={4}>
            {canView && (
              <Tooltip title="ดูข้อมูล">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => onView?.(record)}
                />
              </Tooltip>
            )}

            {canEdit && !isAdmin && (
              <Tooltip title="แก้ไข">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => onEdit?.(record)}
                />
              </Tooltip>
            )}

            {canResetPassword && !isAdmin && (
              <Tooltip title="Reset Password">
                <Button
                  type="text"
                  icon={<KeyOutlined />}
                  onClick={() =>
                    onResetPassword?.(record)
                  }
                />
              </Tooltip>
            )}

            {canDelete &&
              !isAdmin &&
              !isCurrentUser && (
                <DeleteConfirm
                  title="ลบผู้ใช้งาน"
                  description={`ต้องการลบผู้ใช้งาน "${
                    record.username || "-"
                  }" ใช่หรือไม่`}
                  onConfirm={() =>
                    onDelete?.(record)
                  }
                />
              )}
          </Space>
        );
      },
    },
  ];

  return (
    <MasterTable
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      page={page}
      pageSize={pageSize}
      total={total}
      onChange={onChange}
      scroll={{
        x: 1450,
      }}
    />
  );
}
