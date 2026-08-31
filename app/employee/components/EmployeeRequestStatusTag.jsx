"use client";

import {
  Tag,
} from "antd";

const STATUS_MAP = {
  pending: {
    color: "processing",
    label: "รออนุมัติ",
  },
  approved: {
    color: "success",
    label: "อนุมัติแล้ว",
  },
  rejected: {
    color: "error",
    label: "ไม่อนุมัติ",
  },
  cancelled: {
    color: "default",
    label: "ยกเลิก",
  },
};

export default function EmployeeRequestStatusTag({
  status,
}) {
  const item =
    STATUS_MAP[status] || {
      color: "default",
      label:
        status || "-",
    };

  return (
    <Tag color={item.color}>
      {item.label}
    </Tag>
  );
}
