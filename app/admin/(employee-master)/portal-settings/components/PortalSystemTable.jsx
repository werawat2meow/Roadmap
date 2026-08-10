"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

function getStatusTag(
  status
) {
  if (
    status === "active"
  ) {
    return (
      <Tag color="green">
        ใช้งาน
      </Tag>
    );
  }

  return (
    <Tag>
      ไม่ใช้งาน
    </Tag>
  );
}

export default function PortalSystemTable({
  data = [],

  loading = false,

  page = 1,

  pageSize = 20,

  total = 0,

  onPageChange,

  onView,

  onEdit,

  onDelete,
}) {
  const columns = [
    {
      title: "ลำดับ",

      dataIndex:
        "sort_order",

      key:
        "sort_order",

      width: 80,

      align: "center",
    },

    {
      title: "รหัสระบบ",

      dataIndex:
        "system_code",

      key:
        "system_code",

      width: 150,

      render: (value) => (
        <Tag color="blue">
          {value || "-"}
        </Tag>
      ),
    },

    {
      title: "Module",

      dataIndex:
        "module_code",

      key:
        "module_code",

      width: 120,

      render: (value) => (
        <code className="text-xs text-indigo-700">
          {value || "-"}
        </code>
      ),
    },

    {
      title: "ระบบ",

      key: "system",

      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.system_name ||
              "-"}
          </div>

          {record.system_subtitle && (
            <div className="mt-1 text-xs text-slate-500">
              {
                record.system_subtitle
              }
            </div>
          )}
        </div>
      ),
    },

    {
      title: "Base Path",

      dataIndex:
        "base_path",

      key:
        "base_path",

      width: 220,

      render: (value) => (
        <code className="text-xs text-slate-600">
          {value || "-"}
        </code>
      ),
    },

    {
      title: "Permission",

      dataIndex:
        "permission_code",

      key:
        "permission_code",

      width: 220,

      render: (value) => (
        <code className="text-xs text-violet-700">
          {value || "-"}
        </code>
      ),
    },

    {
      title: "สถานะ",

      dataIndex:
        "status",

      key:
        "status",

      width: 110,

      align: "center",

      render:
        getStatusTag,
    },

    {
      title: "จัดการ",

      key: "actions",

      width: 140,

      fixed: "right",

      align: "center",

      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="ดู">
            <Button
              type="text"
              icon={
                <EyeOutlined />
              }
              onClick={() =>
                onView?.(
                  record
                )
              }
            />
          </Tooltip>

          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={
                <EditOutlined />
              }
              onClick={() =>
                onEdit?.(
                  record
                )
              }
            />
          </Tooltip>

          <Popconfirm
            title="ลบระบบ Portal?"
            description="Group และ Menu ภายในระบบนี้จะถูกลบตาม Foreign Key"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              onDelete?.(
                record
              )
            }
          >
            <Tooltip title="ลบ">
              <Button
                type="text"
                danger
                icon={
                  <DeleteOutlined />
                }
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        scroll={{
          x: 1100,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (
            value
          ) =>
            `ทั้งหมด ${value} รายการ`,
          onChange:
            onPageChange,
        }}
      />
    </div>
  );
}