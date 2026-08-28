"use client";

import {
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  EditOutlined,
  EyeOutlined,
  StarFilled,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const {
  Text,
} = Typography;

const SCHEME_LABEL = {
  section_33:
    "มาตรา 33",
  section_39:
    "มาตรา 39",
  section_40:
    "มาตรา 40",
  custom:
    "Custom",
};

function money(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "th-TH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

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

function companyLabel(
  record
) {
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

export default function SocialSecurityTable({
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
      dataIndex:
        "setting_code",
      width: 150,
      fixed: "left",
      render:
        (
          value,
          record
        ) => (
          <Space size={6}>
            <Text
              strong
              code
            >
              {value || "-"}
            </Text>

            {record
              ?.is_default && (
              <Tooltip title="Default">
                <StarFilled />
              </Tooltip>
            )}
          </Space>
        ),
    },
    {
      title:
        "ชื่อการตั้งค่า",
      dataIndex:
        "setting_name",
      width: 250,
      render:
        (value) =>
          value || "-",
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
      title:
        "ประเภทผู้ประกันตน",
      dataIndex:
        "scheme_type",
      width: 140,
      align: "center",
      render:
        (value) => (
          <Tag>
            {SCHEME_LABEL[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        ),
    },
    {
      title:
        "วิธีคำนวณ",
      dataIndex:
        "contribution_method",
      width: 130,
      align: "center",
      render:
        (value) => (
          <Tag
            color={
              value ===
              "percentage"
                ? "processing"
                : "default"
            }
          >
            {value ===
            "percentage"
              ? "Percentage"
              : "Fixed"}
          </Tag>
        ),
    },
    {
      title:
        "ฐานค่าจ้าง",
      key: "wage_base",
      width: 190,
      align: "right",
      render: (
        _,
        record
      ) =>
        `${money(record.wage_base_min)} - ${record.wage_base_max === null ? "ไม่จำกัด" : money(record.wage_base_max)}`,
    },
    {
      title:
        "พนักงาน",
      key: "employee",
      width: 145,
      align: "right",
      render: (
        _,
        record
      ) =>
        record.contribution_method ===
        "percentage"
          ? `${Number(record.employee_rate_percent || 0)}%`
          : money(
              record.fixed_employee_amount
            ),
    },
    {
      title:
        "นายจ้าง",
      key: "employer",
      width: 145,
      align: "right",
      render: (
        _,
        record
      ) =>
        record.contribution_method ===
        "percentage"
          ? `${Number(record.employer_rate_percent || 0)}%`
          : money(
              record.fixed_employer_amount
            ),
    },
    {
      title:
        "วันที่มีผล",
      dataIndex:
        "effective_date",
      width: 130,
      align: "center",
      render:
        formatDate,
    },
    {
      title:
        "วันที่สิ้นสุด",
      dataIndex:
        "expire_date",
      width: 130,
      align: "center",
      render:
        formatDate,
    },
    {
      title: "Default",
      dataIndex:
        "is_default",
      width: 95,
      align: "center",
      render:
        (value) =>
          value ? (
            <Tag color="gold">
              Default
            </Tag>
          ) : (
            "-"
          ),
    },
    {
      title: "สถานะ",
      dataIndex:
        "status",
      width: 110,
      align: "center",
      render:
        (value) => (
          <Tag
            color={
              value ===
              "active"
                ? "success"
                : "default"
            }
          >
            {value ===
            "active"
              ? "Active"
              : "Inactive"}
          </Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 135,
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

        const allowDelete =
          record.status ===
            "inactive" &&
          (
            typeof canDeleteRecord ===
            "function"
              ? canDeleteRecord(
                  record
                )
              : canDelete
          );

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
              <DeleteConfirm
                title="ลบการตั้งค่าประกันสังคม"
                description={`ยืนยันการลบ "${record.setting_code} - ${record.setting_name}" ใช่หรือไม่`}
                loading={
                  deletingId ===
                  record.id
                }
                onConfirm={() =>
                  onDelete?.(
                    record
                  )
                }
              />
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
        title="รายการตั้งค่าประกันสังคม"
        columns={columns}
        dataSource={
          dataSource
        }
        loading={
          loading
        }
        page={page}
        pageSize={
          pageSize
        }
        total={total}
        scroll={{
          x: 1900,
        }}
        onChange={
          onChange
        }
      />
    </div>
  );
}
