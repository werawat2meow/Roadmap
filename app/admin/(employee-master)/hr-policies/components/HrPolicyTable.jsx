"use client";

import {
  Button,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";

const {
  Text,
} = Typography;

const CATEGORY_LABEL = {
  general: "ทั่วไป",
  hr: "ทรัพยากรบุคคล",
  employment: "การจ้างงาน",
  conduct: "จรรยาบรรณ / การปฏิบัติตน",
  attendance: "เวลาและการปฏิบัติงาน",
  leave: "การลา",
  compensation: "ค่าตอบแทน",
  benefit: "สวัสดิการ",
  safety: "ความปลอดภัย",
  compliance: "Compliance",
  pdpa: "PDPA",
  other: "อื่น ๆ",
};

function formatDate(value) {
  if (!value) return "-";

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(date);
}

function companyLabel(record) {
  const company =
    record?.companies;

  if (!company) {
    return "-";
  }

  const name =
    company.company_name_th ||
    company.company_name_en ||
    "-";

  return company.company_code
    ? `${company.company_code} - ${name}`
    : name;
}

function statusTag(value) {
  const map = {
    draft: {
      color: "default",
      label: "Draft",
    },
    published: {
      color: "success",
      label: "Published",
    },
    archived: {
      color: "warning",
      label: "Archived",
    },
  };

  const item =
    map[value] || {
      color: "default",
      label: value || "-",
    };

  return (
    <Tag color={item.color}>
      {item.label}
    </Tag>
  );
}

export default function HrPolicyTable({
  dataSource = [],
  loading = false,
  deletingId = null,
  page = 1,
  pageSize = 20,
  total = 0,
  canEdit = false,
  canDelete = false,
  canEditRecord,
  canDeleteRecord,
  onView,
  onEdit,
  onDelete,
  onChange,
}) {
  const columns = [
    {
      title: "รหัส",
      dataIndex: "policy_code",
      width: 150,
      fixed: "left",
      render: (value) => (
        <Text
          code
          strong
        >
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "ชื่อนโยบาย",
      dataIndex: "policy_name",
      width: 280,
      render: (
        value,
        record
      ) => (
        <Space size={6}>
          <span>
            {value || "-"}
          </span>

          {record
            ?.is_mandatory && (
            <Tooltip title="นโยบายบังคับใช้">
              <LockOutlined />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "บริษัท",
      key: "company",
      width: 230,
      render: (
        _,
        record
      ) =>
        companyLabel(
          record
        ),
    },
    {
      title: "หมวดหมู่",
      dataIndex:
        "policy_category",
      width: 190,
      render: (value) => (
        <Tag>
          {CATEGORY_LABEL[
            value
          ] ||
            value ||
            "-"}
        </Tag>
      ),
    },
    {
      title: "Version",
      dataIndex:
        "current_version_no",
      width: 90,
      align: "center",
      render: (value) =>
        `v${Number(
          value || 1
        )}`,
    },
    {
      title: "วันที่มีผล",
      dataIndex:
        "effective_date",
      width: 130,
      align: "center",
      render: formatDate,
    },
    {
      title: "วันที่สิ้นสุด",
      dataIndex:
        "expire_date",
      width: 130,
      align: "center",
      render: formatDate,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      align: "center",
      render: statusTag,
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 145,
      fixed: "right",
      align: "center",
      render: (
        _,
        record
      ) => {
        const allowEdit =
          typeof canEditRecord ===
          "function"
            ? canEditRecord(
                record
              )
            : canEdit;

        const scopeDelete =
          typeof canDeleteRecord ===
          "function"
            ? canDeleteRecord(
                record
              )
            : canDelete;

        const allowDelete =
          scopeDelete &&
          record.status ===
            "draft";

        return (
          <Space size={2}>
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                icon={
                  <EyeOutlined />
                }
                onClick={() =>
                  onView?.(
                    record
                  )
                }
              />
            </Tooltip>

            {allowEdit && (
              <Tooltip title="แก้ไข">
                <Button
                  type="text"
                  icon={
                    <EditOutlined />
                  }
                  onClick={() =>
                    onEdit?.(
                      record
                    )
                  }
                />
              </Tooltip>
            )}

            {allowDelete && (
              <Popconfirm
                title="ลบนโยบายบริษัท"
                description={`ยืนยันการลบ "${record.policy_code} - ${record.policy_name}" ใช่หรือไม่`}
                okText="ลบ"
                cancelText="ยกเลิก"
                okButtonProps={{
                  danger: true,
                  loading:
                    deletingId ===
                    record.id,
                }}
                onConfirm={() =>
                  onDelete?.(
                    record
                  )
                }
              >
                <Tooltip title="ลบ">
                  <Button
                    type="text"
                    danger
                    icon={
                      <DeleteOutlined />
                    }
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <MasterTable
        rowKey="id"
        title="รายการนโยบายบริษัท"
        columns={columns}
        dataSource={
          dataSource
        }
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        scroll={{
          x: 1550,
        }}
        onChange={onChange}
      />
    </div>
  );
}
