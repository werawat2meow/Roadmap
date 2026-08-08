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

export default function PortalMenuGroupTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "ลำดับ",
      dataIndex:
        "sort_order",
      width: 80,
      align: "center",
    },

    {
      title: "Group Code",
      dataIndex:
        "group_code",
      width: 180,
      render: (value) => (
        <Tag color="blue">
          {value || "-"}
        </Tag>
      ),
    },

    {
      title: "ชื่อ Group",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.group_name ||
              "-"}
          </div>

          <div className="text-xs text-slate-400">
            {record.group_subtitle ||
              "-"}
          </div>
        </div>
      ),
    },

    {
      title: "ระบบ",
      width: 200,
      render: (_, record) =>
        record.portal_systems
          ?.system_name ||
        record.portal_systems
          ?.system_code ||
        "-",
    },

    {
      title:
        "เปิดอัตโนมัติ",
      dataIndex:
        "is_expanded_default",
      width: 130,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="green">
            เปิด
          </Tag>
        ) : (
          <Tag>
            ปิด
          </Tag>
        ),
    },

    {
      title: "สถานะ",
      dataIndex:
        "status",
      width: 110,
      align: "center",
      render: (value) =>
        value === "active" ? (
          <Tag color="green">
            ใช้งาน
          </Tag>
        ) : (
          <Tag>
            ไม่ใช้งาน
          </Tag>
        ),
    },

    {
      title: "จัดการ",
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
            title="ลบ Menu Group?"
            description="Menu Item ภายใน Group อาจถูกลบตาม Foreign Key"
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
            <Button
              type="text"
              danger
              icon={
                <DeleteOutlined />
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={data}
      columns={columns}
      pagination={false}
      scroll={{
        x: 1000,
      }}
    />
  );
}