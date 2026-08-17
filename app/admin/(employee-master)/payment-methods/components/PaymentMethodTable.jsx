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
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

export default function PaymentMethodTable({
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
  const paymentTypeColors = {
    cash: "green",
    bank_transfer: "blue",
    promptpay: "purple",
    cheque: "gold",
    wallet: "cyan",
    crypto: "volcano",
    other: "default",
  };

  const paymentTypeLabels = {
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    promptpay: "PromptPay",
    cheque: "Cheque",
    wallet: "Wallet",
    crypto: "Crypto",
    other: "Other",
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "payment_method_code",
      key: "payment_method_code",
      width: 170,
      ellipsis: true,
    },

    {
      title: "ชื่อวิธีการจ่าย",
      dataIndex: "payment_method_name",
      key: "payment_method_name",
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: 600,
            }}
          >
            {record.payment_method_name}
          </div>

          {record.payment_method_name_en && (
            <div
              style={{
                fontSize: 12,
                color: "#888",
              }}
            >
              {record.payment_method_name_en}
            </div>
          )}
        </div>
      ),
    },

    {
      title: "ประเภท",
      dataIndex: "payment_type",
      key: "payment_type",
      width: 170,
      render: value => (
        <Tag
          color={
            paymentTypeColors[value] ||
            "default"
          }
        >
          {paymentTypeLabels[value] ||
            value}
        </Tag>
      ),
    },

    {
      title: "Features",
      key: "features",
      width: 240,
      render: (_, record) => (
        <Space
          size={[4, 4]}
          wrap
        >
          {record.supports_payroll && (
            <Tag color="blue">
              Payroll
            </Tag>
          )}

          {record.supports_benefit && (
            <Tag color="green">
              Benefit
            </Tag>
          )}

          {record.supports_expense && (
            <Tag color="orange">
              Expense
            </Tag>
          )}

          {record.supports_vendor && (
            <Tag color="purple">
              Vendor
            </Tag>
          )}
        </Space>
      ),
    },
        {
      title: "Bank",
      dataIndex: "bank_required",
      key: "bank_required",
      width: 110,
      align: "center",
      render: value => (
        <Tag color={value ? "blue" : "default"}>
          {value ? "Required" : "-"}
        </Tag>
      ),
    },

    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: value => (
        <StatusTag value={value} />
      ),
    },

    {
      title: "จัดการ",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={4}>

          <Tooltip title="ดูข้อมูล">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView?.(record)}
            />
          </Tooltip>

          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>

          <DeleteConfirm
            title="ลบวิธีการจ่ายเงิน"
            description={`ต้องการลบ "${record.payment_method_name}" ใช่หรือไม่`}
            onConfirm={() => onDelete?.(record)}
          />

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
      scroll={{
        x: 1400,
      }}
    />
  );
}