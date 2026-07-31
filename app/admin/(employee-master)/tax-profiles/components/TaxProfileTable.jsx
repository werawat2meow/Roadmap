"use client";

import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";

export default function TaxProfileTable({
  loading = false,

  data = [],

  pagination,

  canEdit = false,

  canDelete = false,

  onView,

  onEdit,

  onDelete,

  onChange,
}) {
  const columns = [
    {
      title: "รหัส",

      dataIndex: "tax_profile_code",

      key: "tax_profile_code",

      width: 150,

      sorter: true,
    },

    {
      title: "ชื่อโปรไฟล์ภาษี",

      dataIndex: "tax_profile_name",

      key: "tax_profile_name",

      ellipsis: true,

      sorter: true,
    },

    {
      title: "บริษัท",

      key: "company",

      width: 220,

      render: (_, record) => {
        if (!record.companies) {
          return "-";
        }

        return (
          <>
            {record.companies.company_code}
            <br />
            <span
              style={{
                color: "#888",
                fontSize: 12,
              }}
            >
              {
                record.companies
                  .company_name_th
              }
            </span>
          </>
        );
      },
    },

    {
      title: "ปีภาษี",

      dataIndex: "tax_year",

      key: "tax_year",

      width: 100,

      align: "center",

      sorter: true,
    },

    {
      title: "วิธีคำนวณ",

      dataIndex:
        "calculation_method",

      key: "calculation_method",

      width: 140,

      render: (value) => {
        if (
          value === "progressive"
        ) {
          return (
            <Tag color="blue">
              อัตราก้าวหน้า
            </Tag>
          );
        }

        return (
          <Tag color="purple">
            อัตราคงที่
          </Tag>
        );
      },
    },

    {
      title: "ค่าลดหย่อน",

      key: "allowance",

      width: 160,

      align: "right",

      render: (_, record) =>
        Number(
          record.personal_allowance || 0
        ).toLocaleString(),
    },

    {
      title: "เริ่มใช้",

      dataIndex: "effective_from",

      key: "effective_from",

      width: 120,

      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "สิ้นสุด",

      dataIndex: "effective_to",

      key: "effective_to",

      width: 120,

      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "สถานะ",

      dataIndex: "status",

      key: "status",

      width: 120,

      align: "center",

      render: (value) => (
        <StatusTag
          status={value}
        />
      ),
    },

    {
      title: "จัดการ",

      key: "action",

      width: 150,

      fixed: "right",

      align: "center",

      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() =>
              onView?.(record)
            }
          />

          {canEdit && (
            <Button
              type="primary"
              icon={
                <EditOutlined />
              }
              onClick={() =>
                onEdit?.(record)
              }
            />
          )}

          {canDelete && (
            <Popconfirm
              title="ยืนยันการลบ"

              description="คุณต้องการลบข้อมูลนี้ใช่หรือไม่"

              okText="ลบ"

              cancelText="ยกเลิก"

              onConfirm={() =>
                onDelete?.(
                  record.id
                )
              }
            >
              <Button
                danger
                icon={
                  <DeleteOutlined />
                }
              />
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
      dataSource={data}
      pagination={pagination}
      scroll={{
        x: 1500,
      }}
      onChange={onChange}
    />
  );
}