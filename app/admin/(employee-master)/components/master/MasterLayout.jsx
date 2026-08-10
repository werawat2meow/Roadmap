"use client";

import { Space } from "antd";

export default function MasterLayout({
  header,

  search,

  summary,

  toolbar,

  table,

  modal,

  children,
}) {
  return (
    <Space
      orientation="vertical"
      size="large"
      className="w-full"
    >
      {header}

      {search}

      {summary}

      {toolbar}

      {table}

      {children}

      {modal}
    </Space>
  );
}