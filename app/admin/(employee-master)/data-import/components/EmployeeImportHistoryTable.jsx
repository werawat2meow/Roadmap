"use client";

import {
  Table,
  Tag,
  Typography,
} from "antd";

import dayjs from "dayjs";

const {
  Text,
} = Typography;

const STATUS_LABELS = {
  processing:
    "กำลังนำเข้า",

  completed:
    "สำเร็จ",

  completed_with_errors:
    "สำเร็จบางส่วน",

  failed:
    "ล้มเหลว",
};

const STATUS_COLORS = {
  processing:
    "processing",

  completed:
    "success",

  completed_with_errors:
    "warning",

  failed:
    "error",
};

function formatDateTime(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    dayjs(value);

  return date.isValid()
    ? date.format(
        "DD/MM/YYYY HH:mm"
      )
    : "-";
}

export default function EmployeeImportHistoryTable({
  rows = [],
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onChange,
}) {
  const columns = [
    {
      title: "วันที่",
      dataIndex:
        "created_at",
      width: 160,
      render:
        formatDateTime,
    },
    {
      title: "ไฟล์",
      dataIndex:
        "file_name",
      width: 260,
      ellipsis: true,
      render:
        (value) => (
          <Text>
            {value || "-"}
          </Text>
        ),
    },
    {
      title: "สถานะ",
      dataIndex:
        "status",
      width: 140,
      align: "center",
      render:
        (value) => (
          <Tag
            color={
              STATUS_COLORS[
                value
              ]
            }
          >
            {STATUS_LABELS[
              value
            ] ||
              value ||
              "-"}
          </Tag>
        ),
    },
    {
      title: "ทั้งหมด",
      dataIndex:
        "total_rows",
      width: 90,
      align: "right",
    },
    {
      title: "INSERT",
      dataIndex:
        "inserted_rows",
      width: 90,
      align: "right",
    },
    {
      title: "UPDATE",
      dataIndex:
        "updated_rows",
      width: 90,
      align: "right",
    },
    {
      title: "SKIP",
      dataIndex:
        "skipped_rows",
      width: 90,
      align: "right",
    },
    {
      title: "FAILED",
      dataIndex:
        "failed_rows",
      width: 90,
      align: "right",
    },
    {
      title: "เสร็จเมื่อ",
      dataIndex:
        "completed_at",
      width: 160,
      render:
        formatDateTime,
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
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [
            20,
            50,
            100,
          ],
          showTotal:
            (value) =>
              `ทั้งหมด ${value} รายการ`,
        }}
        scroll={{
          x: 1180,
        }}
        onChange={
          onChange
        }
      />
    </div>
  );
}
