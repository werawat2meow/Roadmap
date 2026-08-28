"use client";

import { Button, Space, Tag, Tooltip, Typography } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

function getEmployeeName(employee) {
  return [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getBankLabel(bank) {
  if (!bank) return "-";

  const code = bank.bank_code || bank.code || "";
  const name =
    bank.bank_name_th ||
    bank.bank_name ||
    bank.bank_name_en ||
    bank.name ||
    "-";

  return code ? `${code} - ${name}` : name;
}

function getPaymentMethodLabel(item) {
  if (!item) return "-";

  const code =
    item.payment_method_code || item.method_code || item.code || "";
  const name =
    item.payment_method_name || item.method_name || item.name || "-";

  return code ? `${code} - ${name}` : name;
}

function maskAccountNo(value) {
  const text = String(value || "").replace(/\s/g, "");
  if (!text) return "-";
  if (text.length <= 4) return "*".repeat(text.length);

  return `${"*".repeat(Math.max(text.length - 4, 4))}${text.slice(-4)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
}

export default function EmployeeBankAccountTable({
  data = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  canView = false,
  canEdit = false,
  canDelete = false,
  onChange,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      title: "#",
      key: "no",
      width: 70,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "พนักงาน",
      key: "employee",
      width: 260,
      render: (_, record) => {
        const employee = record?.employees;

        return (
          <div className="min-w-0">
            <div className="truncate font-semibold">
              {employee?.employee_code || "-"}
            </div>
            <Text type="secondary" className="block truncate text-xs">
              {getEmployeeName(employee) || "-"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "ธนาคาร",
      key: "bank",
      width: 230,
      render: (_, record) => getBankLabel(record?.banks),
    },
    {
      title: "เลขบัญชี",
      key: "account_no",
      width: 180,
      render: (_, record) => (
        <div>
          <div className="font-mono font-semibold">
            {maskAccountNo(record?.account_no)}
          </div>
          <Text type="secondary" className="text-xs">
            {record?.account_name || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "วิธีการจ่าย",
      key: "payment_method",
      width: 210,
      render: (_, record) =>
        getPaymentMethodLabel(record?.payment_methods),
    },
    {
      title: "บัญชีหลัก",
      dataIndex: "is_primary",
      key: "is_primary",
      width: 110,
      align: "center",
      render: (value) =>
        value ? <Tag color="blue">บัญชีหลัก</Tag> : <Tag>บัญชีรอง</Tag>,
    },
    {
      title: "ช่วงใช้งาน",
      key: "effective",
      width: 190,
      render: (_, record) => (
        <div>
          <div>{formatDate(record?.effective_date)}</div>
          <Text type="secondary" className="text-xs">
            ถึง {formatDate(record?.expire_date)}
          </Text>
        </div>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (value) => <StatusTag value={value} />,
    },
    {
      title: "จัดการ",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => (
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

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          )}

          {canDelete && (
            <DeleteConfirm
              title="ลบบัญชีธนาคารพนักงาน"
              description={`ต้องการลบบัญชี "${maskAccountNo(
                record?.account_no
              )}" ใช่หรือไม่`}
              onConfirm={() => onDelete?.(record)}
            />
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
      scroll={{ x: 1550 }}
    />
  );
}
