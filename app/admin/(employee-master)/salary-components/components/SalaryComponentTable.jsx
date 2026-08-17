"use client";

import {
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
} from "antd";

import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function SalaryComponentTable({
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
      dataIndex: "component_code",
      key: "component_code",
      width: 140,
      sorter: true,
    },

    {
      title: "ชื่อรายการ",
      dataIndex: "component_name",
      key: "component_name",
      sorter: true,
    },

    {
      title: "ประเภท",
      dataIndex: "component_type",
      key: "component_type",
      width: 160,
      align: "center",

      render: (value) => {
        const map = {
          earning: {
            color: "green",
            text: "เงินได้",
          },

          deduction: {
            color: "red",
            text: "รายการหัก",
          },

          employer: {
            color: "blue",
            text: "นายจ้างสมทบ",
          },
        };

        const item = map[value];

        return (
          <Tag color={item?.color}>
            {item?.text || value}
          </Tag>
        );
      },
    },

    {
      title: "วิธีคำนวณ",
      dataIndex: "calculation_type",
      key: "calculation_type",
      width: 170,
      align: "center",

      render: (value) => {
        const map = {
          fixed: "จำนวนเงินคงที่",
          percentage: "เปอร์เซ็นต์",
          formula: "สูตรคำนวณ",
        };

        return map[value] || value;
      },
    },

    {
      title: "ภาษี",
      dataIndex: "taxable",
      key: "taxable",
      width: 90,
      align: "center",

      render: (value) => (
        <Tag
          color={
            value
              ? "green"
              : "default"
          }
        >
          {value ? "ใช่" : "ไม่"}
        </Tag>
      ),
    },

    {
      title: "ประกันสังคม",
      dataIndex: "social_security",
      key: "social_security",
      width: 120,
      align: "center",

      render: (value) => (
        <Tag
          color={
            value
              ? "blue"
              : "default"
          }
        >
          {value ? "ใช่" : "ไม่"}
        </Tag>
      ),
    },

    {
      title: "กองทุน",
      dataIndex: "provident_fund",
      key: "provident_fund",
      width: 110,
      align: "center",

      render: (value) => (
        <Tag
          color={
            value
              ? "purple"
              : "default"
          }
        >
          {value ? "ใช่" : "ไม่"}
        </Tag>
      ),
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 100,
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
      width: 160,
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
        x: 1500,
      }}
    />
  );
}