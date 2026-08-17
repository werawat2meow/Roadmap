"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
  NumberOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";

import StatusTag from "@/app/admin/(employee-master)/components/master/StatusTag";

import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const { Text } = Typography;

/* =========================================================
   Helpers
========================================================= */

function getCompanyName(record) {
  const company = record?.companies;

  if (!company) {
    return "-";
  }

  const companyName =
    company.company_name_th ||
    company.company_name_en ||
    "-";

  if (company.company_code) {
    return `${company.company_code} - ${companyName}`;
  }

  return companyName;
}

function getResetPolicyLabel(value) {
  const labels = {
    never: "ไม่รีเซ็ต",
    yearly: "รายปี",
    monthly: "รายเดือน",
  };

  return labels[value] || value || "-";
}

function getResetPolicyColor(value) {
  const colors = {
    never: "default",
    yearly: "blue",
    monthly: "purple",
  };

  return colors[value] || "default";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return "-";
  }

  return date.format("DD/MM/YYYY");
}

/* =========================================================
   Component
========================================================= */

export default function EmployeeCodeSettingTable({
  dataSource = [],

  loading = false,

  deletingId = null,

  page = 1,

  pageSize = 20,

  total = 0,

  canView = false,

  canEdit = false,

  canDelete = false,

  onView,

  onEdit,

  onDelete,

  onChange,
}) {
  const columns = [
    {
      title: "บริษัท",

      key: "company",

      dataIndex: "company_id",

      width: 240,

      fixed: "left",

      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-800">
            {getCompanyName(record)}
          </div>

          {record.is_default && (
            <Tag
              color="gold"
              icon={
                <SafetyCertificateOutlined />
              }
              className="mt-1"
            >
              รูปแบบหลัก
            </Tag>
          )}
        </div>
      ),
    },

    {
      title: "ชื่อรูปแบบ",

      dataIndex: "code_name",

      key: "code_name",

      width: 180,

      render: (value) => (
        <Text strong>
          {value || "-"}
        </Text>
      ),
    },

    {
      title: "รูปแบบรหัส",

      dataIndex: "code_pattern",

      key: "code_pattern",

      width: 220,

      render: (value) => (
        <Text
          code
          copyable={
            value
              ? {
                  text: value,
                }
              : false
          }
        >
          {value || "-"}
        </Text>
      ),
    },

    {
      title: "Running",

      key: "running",

      width: 150,

      align: "center",

      render: (_, record) => (
        <Space
          orientation="vertical"
          size={0}
        >
          <Tag
            icon={<NumberOutlined />}
            color="cyan"
          >
            {record.running_digits || 0} หลัก
          </Tag>

          <Text
            type="secondary"
            className="text-xs"
          >
            เริ่ม {record.running_start || 1}
          </Text>
        </Space>
      ),
    },

    {
      title: "ปี",

      dataIndex: "year_digits",

      key: "year_digits",

      width: 90,

      align: "center",

      render: (value) => (
        <Tag>
          {value || 2} หลัก
        </Tag>
      ),
    },

    {
      title: "นโยบาย Reset",

      dataIndex: "reset_policy",

      key: "reset_policy",

      width: 140,

      align: "center",

      render: (value) => (
        <Tag
          color={getResetPolicyColor(
            value
          )}
        >
          {getResetPolicyLabel(value)}
        </Tag>
      ),
    },

    {
      title: "ช่วงวันที่ใช้งาน",

      key: "effective_period",

      width: 190,

      render: (_, record) => (
        <Space
          orientation="vertical"
          size={0}
        >
          <Text>
            <CalendarOutlined className="mr-1 text-slate-400" />

            {formatDate(
              record.effective_date
            )}
          </Text>

          <Text
            type="secondary"
            className="text-xs"
          >
            ถึง{" "}
            {record.expire_date
              ? formatDate(
                  record.expire_date
                )
              : "ไม่กำหนด"}
          </Text>
        </Space>
      ),
    },

    {
      title: "สถานะ",

      dataIndex: "status",

      key: "status",

      width: 110,

      align: "center",

      render: (value) => (
        <StatusTag value={value} />
      ),
    },

    {
      title: "จัดการ",

      key: "actions",

      width: 145,

      fixed: "right",

      align: "center",

      render: (_, record) => (
        <Space size={2}>
          {canView && (
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() =>
                  onView?.(record)
                }
              />
            </Tooltip>
          )}

          {canEdit && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  onEdit?.(record)
                }
              />
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="ลบ">
              <DeleteConfirm
                title="ลบรูปแบบรหัสพนักงาน"
                description={`ยืนยันการลบ ${
                  record.code_name || ""
                } ใช่หรือไม่`}
                loading={
                  deletingId === record.id
                }
                onConfirm={() =>
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
    <MasterTable
      rowKey="id"
      title="รายการตั้งค่ารหัสพนักงาน"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      scroll={{
        x: 1550,
      }}
      onChange={onChange}
    />
  );
}