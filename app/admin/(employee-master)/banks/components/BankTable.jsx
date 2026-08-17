"use client";

import {
  Button,
  Popconfirm,
  Space,
  Tag,
} from "antd";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";

export default function BankTable({
  data = [],
  loading = false,

  page = 1,
  pageSize = 20,
  total = 0,

  onChange,

  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "#",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (page - 1) * pageSize + index + 1,
    },

    {
      title: "Code",
      dataIndex: "bank_code",
      width: 120,
      sorter: true,
    },

    {
      title: "Short Name",
      dataIndex: "bank_short_name",
      width: 140,
    },

    {
      title: "ชื่อธนาคาร",
      dataIndex: "bank_name_th",
      width: 250,
    },

    {
      title: "English Name",
      dataIndex: "bank_name_en",
      width: 250,
    },

    {
      title: "SWIFT",
      dataIndex: "swift_code",
      width: 130,
      render: (value) => value || "-",
    },

    {
      title: "Payroll",
      dataIndex: "supports_payroll",
      width: 120,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="green">
            <CheckCircleOutlined /> Yes
          </Tag>
        ) : (
          <Tag color="default">
            <CloseCircleOutlined /> No
          </Tag>
        ),
    },

    {
      title: "PromptPay",
      dataIndex: "promptpay_supported",
      width: 130,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="blue">
            <CheckCircleOutlined /> Yes
          </Tag>
        ) : (
          <Tag color="default">
            <CloseCircleOutlined /> No
          </Tag>
        ),
    },

    {
      title: "API",
      dataIndex: "supports_api",
      width: 100,
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="purple">
            <CheckCircleOutlined /> Yes
          </Tag>
        ) : (
          <Tag color="default">
            <CloseCircleOutlined /> No
          </Tag>
        ),
    },

    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      align: "center",
      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "success"
              : "default"
          }
        >
          {value === "active"
            ? "Active"
            : "Inactive"}
        </Tag>
      ),
    },

    {
      title: "Action",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {onView && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          )}

          {onEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          )}

          {onDelete && (
            <Popconfirm
              title="ยืนยันการลบ"
              description={`ต้องการลบ "${record.bank_name_th}" ใช่หรือไม่?`}
              okText="ลบ"
              cancelText="ยกเลิก"
              onConfirm={() => onDelete(record)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
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
    />
  );
}