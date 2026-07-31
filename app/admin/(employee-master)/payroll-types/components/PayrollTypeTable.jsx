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
} from "@ant-design/icons";

const frequencyLabels = {
  monthly: "รายเดือน",
  weekly: "รายสัปดาห์",
  biweekly: "ทุก 2 สัปดาห์",
  daily: "รายวัน",
};

const offsetLabels = {
  0: "เดือนเดียวกัน",
  1: "เดือนถัดไป",
};

export default function PayrollTypeTable({
  loading = false,

  payrollTypes = [],

  canEdit = false,
  canDelete = false,

  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "รหัส",
      dataIndex: "payroll_type_code",
      width: 150,
      fixed: "left",

      render: (value) => (
        <span className="font-semibold text-slate-700">
          {value}
        </span>
      ),
    },

    {
      title: "Payroll Cycle",
      dataIndex: "payroll_type_name",
      width: 260,

      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-800">
            {record.payroll_type_name}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {record.description || "-"}
          </div>
        </div>
      ),
    },

    {
      title: "ความถี่",
      dataIndex: "payment_frequency",
      width: 150,
      align: "center",

      render: (value) =>
        frequencyLabels[value] ||
        value ||
        "-",
    },

    {
      title: "วันตัดรอบ",
      dataIndex: "cutoff_end_day",
      width: 130,
      align: "center",

      render: (value) =>
        value
          ? `วันที่ ${value}`
          : "-",
    },

    {
      title: "วันจ่าย",
      dataIndex: "default_payment_day",
      width: 130,
      align: "center",

      render: (value) =>
        value
          ? `วันที่ ${value}`
          : "-",
    },

    {
      title: "รอบการจ่าย",
      dataIndex: "payment_offset_month",
      width: 150,
      align: "center",

      render: (value) =>
        offsetLabels[
          Number(value)
        ] || "-",
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      align: "center",

      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "green"
              : "red"
          }
        >
          {value === "active"
            ? "ใช้งาน"
            : "ไม่ใช้งาน"}
        </Tag>
      ),
    },

    {
      title: "ลำดับ",
      dataIndex: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "จัดการ",
      width: 130,
      fixed: "right",
      align: "center",

      render: (_, record) => (
        <Space>

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={
                  <EditOutlined />
                }
                onClick={() =>
                  onEdit?.(record)
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <Popconfirm
                title="ลบ Payroll Cycle"
                description={`ต้องการลบ ${record.payroll_type_name} ใช่หรือไม่ ?`}
                okText="ลบ"
                cancelText="ยกเลิก"
                okButtonProps={{
                  danger: true,
                }}
                onConfirm={() =>
                  onDelete?.(record)
                }
              >
                <Button
                  danger
                  type="text"
                  icon={
                    <DeleteOutlined />
                  }
                />
              </Popconfirm>
            </Tooltip>
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
      dataSource={payrollTypes}
      pagination={{
        pageSize: 20,
        showSizeChanger: false,
        showTotal: (total) =>
          `ทั้งหมด ${total} รายการ`,
      }}
      scroll={{
        x: 1300,
      }}
    />
  );
}