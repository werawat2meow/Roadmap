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

function getCompanyLabel(
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

export default function TaxRateTable({
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
      title:
        "รหัสอัตราภาษี",
      dataIndex:
        "tax_rate_code",
      width: 160,
      fixed: "left",
      render:
        (
          value,
          record
        ) => (
          <Space size={6}>
            <Text
              code
              strong
            >
              {value ||
                "-"}
            </Text>

            {record
              ?.is_default && (
              <Tooltip title="Default ของปี">
                <StarFilled />
              </Tooltip>
            )}
          </Space>
        ),
    },
    {
      title:
        "ชื่อชุดอัตราภาษี",
      dataIndex:
        "tax_rate_name",
      width: 260,
      render:
        (value) =>
          value || "-",
    },
    {
      title: "บริษัท",
      key: "company",
      width: 240,
      render: (
        _,
        record
      ) =>
        getCompanyLabel(
          record
        ),
    },
    {
      title: "ปีภาษี",
      dataIndex:
        "tax_year",
      width: 100,
      align: "center",
    },
    {
      title:
        "วิธีคำนวณ",
      dataIndex:
        "calculation_method",
      width: 140,
      align: "center",
      render:
        (value) => (
          <Tag
            color={
              value ===
              "progressive"
                ? "processing"
                : "default"
            }
          >
            {value ===
            "progressive"
              ? "Progressive"
              : value ===
                  "flat"
                ? "Flat Rate"
                : value ||
                  "-"}
          </Tag>
        ),
    },
    {
      title:
        "จำนวนขั้น",
      dataIndex:
        "bracket_count",
      width: 100,
      align: "center",
      render:
        (value) =>
          Number(
            value || 0
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
      width: 100,
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
                title="ลบชุดอัตราภาษี"
                description={`ยืนยันการลบ "${record.tax_rate_code} - ${record.tax_rate_name}" ใช่หรือไม่`}
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
        title="รายการอัตราภาษี"
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
        total={
          total
        }
        scroll={{
          x: 1650,
        }}
        onChange={
          onChange
        }
      />
    </div>
  );
}
