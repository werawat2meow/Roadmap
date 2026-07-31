"use client";

import { Tag } from "antd";

export default function StatusTag({ status }) {
  if (status === "active") {
    return <Tag color="success">Active</Tag>;
  }

  return <Tag color="default">Inactive</Tag>;
}