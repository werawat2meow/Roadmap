"use client";

import { Empty } from "antd";

export default function EmptyState({
  description = "ไม่พบข้อมูล",
  image = Empty.PRESENTED_IMAGE_SIMPLE,
}) {
  return (
    <Empty
      image={image}
      description={description}
    />
  );
}