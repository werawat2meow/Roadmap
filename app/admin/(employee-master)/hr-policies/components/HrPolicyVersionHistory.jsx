"use client";

import {
  Empty,
  Table,
  Tag,
  Typography,
} from "antd";

const {
  Text,
} = Typography;

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

export default function HrPolicyVersionHistory({
  versions = [],
}) {
  if (
    !Array.isArray(versions) ||
    versions.length === 0
  ) {
    return (
      <Empty
        image={
          Empty.PRESENTED_IMAGE_SIMPLE
        }
        description="ยังไม่มีประวัติ Version"
      />
    );
  }

  const columns = [
    {
      title: "Version",
      dataIndex: "version_no",
      width: 90,
      align: "center",
      render: (value) => (
        <Text strong>
          v{value}
        </Text>
      ),
    },
    {
      title: "ชื่อ Version",
      dataIndex: "version_title",
      width: 220,
      render: (value) =>
        value || "-",
    },
    {
      title: "สรุปการแก้ไข",
      dataIndex: "change_summary",
      ellipsis: true,
      render: (value) =>
        value || "-",
    },
    {
      title: "วันที่มีผล",
      dataIndex: "effective_date",
      width: 130,
      render: formatDate,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 110,
      align: "center",
      render: statusTag,
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
        size="small"
        columns={columns}
        dataSource={versions}
        pagination={false}
        scroll={{
          x: 850,
        }}
      />
    </div>
  );
}
