"use client";

import { Tag } from "antd";

const COLORS = {
  active: "green",
  inactive: "red",

  pending: "orange",
  approved: "green",
  rejected: "red",

  draft: "default",

  yes: "green",
  no: "red",
};

const LABELS = {
  active: "ใช้งาน",
  inactive: "ไม่ใช้งาน",

  pending: "รออนุมัติ",
  approved: "อนุมัติ",
  rejected: "ไม่อนุมัติ",

  draft: "ฉบับร่าง",

  yes: "ใช่",
  no: "ไม่",
};

export default function StatusTag({
  value,
  color,
  label,
}) {
  const key = String(value || "").toLowerCase();

  return (
    <Tag color={color || COLORS[key] || "default"}>
      {label || LABELS[key] || value || "-"}
    </Tag>
  );
}