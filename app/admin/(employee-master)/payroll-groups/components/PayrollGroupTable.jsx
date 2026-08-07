"use client";

import { Table, Tag, Button, Space, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";

export default function PayrollGroupTable({
  loading = false,

  data = [],

  pagination,

  onChange,

  onView,

  onEdit,

  onDelete,

  canEdit = true,

  canDelete = true,
}) {
  const columns = [
    {
      title: "รหัส",
      dataIndex: "payroll_group_code",
      key: "payroll_group_code",
      width: 140,
      sorter: true,
    },

    {
      title: "ชื่อกลุ่มเงินเดือน",
      dataIndex: "payroll_group_name",
      key: "payroll_group_name",
      sorter: true,
    },

    {
      title: "บริษัทเงินเดือน",
      key: "payroll_company",
      width: 260,
      render: (_, record) =>
        record.payroll_company
          ? `${record.payroll_company.payroll_company_code} - ${record.payroll_company.payroll_company_name}`
          : "-",
    },

    {
      title: "วันที่จ่าย",
      dataIndex: "payment_day",
      key: "payment_day",
      width: 100,
      align: "center",
      render: (value) => value ?? "-",
    },

    {
      title: "รอบ",
      dataIndex: "payment_frequency",
      key: "payment_frequency",
      width: 120,
      align: "center",
      render: (value) => {
        const map = {
          monthly: "รายเดือน",
          weekly: "รายสัปดาห์",
          biweekly: "ทุก 2 สัปดาห์",
          daily: "รายวัน",
        };

        return map[value] || value;
      },
    },

    {
      title: "สถานะ",
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
            ? "ใช้งาน"
            : "ยกเลิก"}
        </Tag>
      ),
    },

    {
      title: "ลำดับ",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 90,
      align: "center",
    },

    {
      title: "จัดการ",
      key: "action",
      width: 150,
      align: "center",

      render: (_, record) => (
        <Space>
          <Tooltip title="ดูรายละเอียด">
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                onView?.(record)
              }
            />
          </Tooltip>

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit?.(record)
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  onDelete?.(record)
                }
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
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={pagination}
      onChange={onChange}
      bordered
      size="middle"
      scroll={{
        x: 1200,
      }}
    />
  );
}