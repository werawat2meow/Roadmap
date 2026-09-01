"use client";

import { Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  EditOutlined,
  EyeOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getCompanyLabel,
  getEmployeeLabel,
  getIdentityLabel,
  getInsuredTypeLabel,
  getPayrollCompanyLabel,
} from "./statutoryProfileOptions";

const { Text } = Typography;

function formatDate(value) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
}

function maskValue(value) {
  const text = String(value || "");
  if (!text) return "-";
  if (text.length <= 4) return "*".repeat(text.length);
  return `${"*".repeat(Math.max(text.length - 4, 4))}${text.slice(-4)}`;
}

export default function EmployeeStatutoryProfileTable({
  dataSource = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onView,
  onEdit,
  onDeactivate,
  canEdit = false,
  canDelete = false,
  deactivatingId = null,
}) {
  const columns = [
    {
      title: "พนักงาน",
      key: "employee",
      fixed: "left",
      width: 240,
      render: (_, record) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-800">
            {getEmployeeLabel(record?.employees)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            บริษัททำงาน: {getCompanyLabel(record?.employees?.companies)}
          </div>
          <div className="text-xs text-slate-400">
            บริษัทเงินเดือน: {getPayrollCompanyLabel(record?.employees)}
          </div>
        </div>
      ),
    },
    {
      title: "ข้อมูลภาษี",
      key: "tax",
      width: 270,
      render: (_, record) => (
        <div className="space-y-1">
          <div>
            <Tag>{getIdentityLabel(record?.tax_identity_type)}</Tag>
            <Text className="!text-xs !text-slate-500">
              {maskValue(record?.tax_identification_no)}
            </Text>
          </div>
          <div className="text-sm text-slate-700">
            แบบภาษี: <b>{record?.tax_filing_form_code || "-"}</b>
          </div>
          <div className="text-xs text-slate-500">
            บริษัทนำส่ง: {getCompanyLabel(record?.tax_withholding_company)}
          </div>
        </div>
      ),
    },
    {
      title: "ประกันสังคม",
      key: "social-security",
      width: 270,
      render: (_, record) =>
        record?.social_security_registered ? (
          <div className="space-y-1">
            <div>
              <Tag color="green">ขึ้นทะเบียน</Tag>
              <Text className="!text-xs !text-slate-500">
                {maskValue(record?.social_security_no)}
              </Text>
            </div>
            <div className="text-sm text-slate-700">
              {getInsuredTypeLabel(record?.insured_type)}
            </div>
            <div className="text-xs text-slate-500">
              บริษัท: {getCompanyLabel(record?.social_security_company)}
            </div>
          </div>
        ) : (
          <Tag>ไม่ขึ้นทะเบียน</Tag>
        ),
    },
    {
      title: "มีผลตั้งแต่",
      dataIndex: "effective_from",
      key: "effective_from",
      width: 120,
      render: formatDate,
    },
    {
      title: "สิ้นสุด",
      dataIndex: "effective_to",
      key: "effective_to",
      width: 120,
      render: formatDate,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 105,
      render: (value) =>
        value === "active" ? (
          <Tag color="green">ใช้งาน</Tag>
        ) : (
          <Tag>ไม่ใช้งาน</Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView?.(record)}
            />
          </Tooltip>

          {canEdit ? (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          ) : null}

          {canDelete && record?.status === "active" ? (
            <Tooltip title="ปิดใช้งาน (ไม่ Hard Delete)">
              <Button
                danger
                type="text"
                loading={deactivatingId === record.id}
                icon={<StopOutlined />}
                onClick={() => onDeactivate?.(record)}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <Table
        rowKey="id"
        dataSource={dataSource}
        columns={columns}
        loading={loading}
        scroll={{ x: 1360 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100],
          showTotal: (value) => `ทั้งหมด ${value} รายการ`,
          onChange: (nextPage, nextPageSize) =>
            onPageChange?.(nextPage, nextPageSize),
        }}
      />
    </div>
  );
}
