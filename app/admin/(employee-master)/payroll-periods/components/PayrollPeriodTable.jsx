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
  LockOutlined,
} from "@ant-design/icons";

import MasterTable from "@/app/admin/(employee-master)/components/master/MasterTable";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const {
  Text,
} = Typography;

const STATUS_META = {
  draft: {
    label: "Draft",
    color: "default",
  },
  open: {
    label: "เปิดงวด",
    color: "processing",
  },
  closed: {
    label: "ปิดงวด",
    color: "warning",
  },
  processed: {
    label: "ประมวลผลแล้ว",
    color: "success",
  },
};

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

function getGroupLabel(
  record
) {
  const group =
    record?.payroll_groups;

  if (!group) {
    return "-";
  }

  const code =
    group.payroll_group_code ||
    "";

  const name =
    group.payroll_group_name ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

export default function PayrollPeriodTable({
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
      title: "รหัสงวด",
      dataIndex:
        "period_code",
      width: 150,
      fixed: "left",
      render: (
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
            ?.is_locked ===
            true && (
            <Tooltip title="งวดนี้ถูก Lock">
              <LockOutlined />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "ชื่องวด",
      dataIndex:
        "period_name",
      width: 220,
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
      title:
        "กลุ่มเงินเดือน",
      key: "group",
      width: 220,
      render: (
        _,
        record
      ) =>
        getGroupLabel(
          record
        ),
    },
    {
      title: "ปี / งวด",
      key: "period",
      width: 120,
      align: "center",
      render: (
        _,
        record
      ) =>
        `${record.period_year || "-"} / ${record.period_no || "-"}`,
    },
    {
      title:
        "ช่วงงวดเงินเดือน",
      key: "period_range",
      width: 220,
      render: (
        _,
        record
      ) =>
        `${formatDate(record.period_start_date)} - ${formatDate(record.period_end_date)}`,
    },
    {
      title: "Cut-off",
      key: "cutoff",
      width: 220,
      render: (
        _,
        record
      ) => {
        if (
          !record.cutoff_start_date &&
          !record.cutoff_end_date
        ) {
          return "-";
        }

        return `${formatDate(record.cutoff_start_date)} - ${formatDate(record.cutoff_end_date)}`;
      },
    },
    {
      title: "วันที่จ่าย",
      dataIndex:
        "payment_date",
      width: 130,
      align: "center",
      render:
        formatDate,
    },
    {
      title: "สถานะ",
      dataIndex:
        "status",
      width: 130,
      align: "center",
      render:
        (value) => {
          const meta =
            STATUS_META[
              value
            ] || {
              label:
                value ||
                "-",
              color:
                "default",
            };

          return (
            <Tag
              color={
                meta.color
              }
            >
              {meta.label}
            </Tag>
          );
        },
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
        const locked =
          record
            ?.is_locked ===
          true;

        const allowEdit =
          !locked &&
          (
            typeof canEditRecord ===
            "function"
              ? canEditRecord(
                  record
                )
              : canEdit
          );

        const allowDelete =
          !locked &&
          record.status ===
            "draft" &&
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
              <Tooltip title="ลบ">
                <DeleteConfirm
                  title="ลบงวดเงินเดือน"
                  description={`ยืนยันการลบ "${record.period_code} - ${record.period_name}" ใช่หรือไม่`}
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
              </Tooltip>
            )}

            {locked &&
              (canEdit ||
                canDelete) && (
                <Tooltip title="งวดนี้ถูก Lock">
                  <Button
                    type="text"
                    disabled
                    icon={
                      <LockOutlined />
                    }
                  />
                </Tooltip>
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
        title="รายการงวดเงินเดือน"
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
          x: 1800,
        }}
        onChange={
          onChange
        }
      />
    </div>
  );
}
