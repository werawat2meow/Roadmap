"use client";

import { Pagination } from "antd";

export default function SkillPagination({
  pagination,
  onChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 16,
      }}
    >
      <Pagination
        current={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        showSizeChanger
        showQuickJumper
        showTotal={(total, range) =>
          `${range[0]}-${range[1]} จาก ${total} รายการ`
        }
        onChange={onChange}
        onShowSizeChange={onChange}
      />
    </div>
  );
}