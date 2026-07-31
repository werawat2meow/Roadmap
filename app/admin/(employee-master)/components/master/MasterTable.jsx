"use client";

import {
  Card,
  Empty,
  Table,
} from "antd";

export default function MasterTable({
  rowKey = "id",

  columns = [],

  dataSource = [],

  loading = false,

  page = 1,

  pageSize = 20,

  total = 0,

  pagination = true,

  scroll,

  rowSelection,

  expandable,

  size = "middle",

  bordered = false,

  sticky = false,

  onChange,

  locale,

  footer,

  title,
}) {
  return (
    <Card title={title}>
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowSelection={rowSelection}
        expandable={expandable}
        bordered={bordered}
        sticky={sticky}
        size={size}
        scroll={scroll}
        onChange={onChange}
        footer={footer}
        locale={{
          emptyText: (
            <Empty description="ไม่พบข้อมูล" />
          ),
          ...locale,
        }}
        pagination={
          pagination
            ? {
                current: page,
                pageSize,
                total,

                showSizeChanger: true,

                showQuickJumper: true,

                showTotal: (total) =>
                  `ทั้งหมด ${total} รายการ`,
              }
            : false
        }
      />
    </Card>
  );
}