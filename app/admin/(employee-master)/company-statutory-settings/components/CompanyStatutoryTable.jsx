"use client";

import { Button, Space, Table, Tag, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

function formatDate(value) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
}

function textOrDash(value) {
  const text = String(value || "").trim();
  return text || "-";
}

export default function CompanyStatutoryTable({
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
      title: "บริษัท",
      key: "company",
      width: 300,
      fixed: "left",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.companies?.company_code || "-"}
            {" - "}
            {record.companies?.company_name_th ||
              record.companies?.company_name_en ||
              "-"}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Tax ID: {textOrDash(record.companies?.tax_id)} · สาขาภาษี:{" "}
            {textOrDash(record.companies?.branch_no)}
          </div>
        </div>
      ),
    },
    {
      title: "เลขบัญชีนายจ้าง SSO",
      dataIndex: "sso_employer_account_no",
      width: 210,
      render: textOrDash,
    },
    {
      title: "สาขา SSO",
      dataIndex: "sso_branch_no",
      width: 150,
      render: textOrDash,
    },
    {
      title: "เลขทะเบียน WCF",
      dataIndex: "wcf_registration_no",
      width: 190,
      render: textOrDash,
    },
    {
      title: "มีผลตั้งแต่",
      dataIndex: "effective_from",
      width: 130,
      render: formatDate,
    },
    {
      title: "มีผลถึง",
      dataIndex: "effective_to",
      width: 130,
      render: formatDate,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 110,
      render: (value) => (
        <Tag color={value === "active" ? "success" : "default"}>
          {value === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 145,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canView ? (
            <Tooltip title="ดู">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView?.(record)}
              />
            </Tooltip>
          ) : null}

          {canEdit ? (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          ) : null}

          {canDelete ? (
            <Tooltip title="ลบ">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete?.(record)}
              />
            </Tooltip>
          ) : null}
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
      scroll={{ x: 1370 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        showTotal: (value) => `ทั้งหมด ${value} รายการ`,
      }}
      onChange={onChange}
    />
  );
}
