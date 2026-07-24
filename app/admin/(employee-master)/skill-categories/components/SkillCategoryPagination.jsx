"use client";

import { Pagination } from "antd";

export default function SkillCategoryPagination({
  pagination,
  onChange,
}) {
  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Pagination
        current={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        showSizeChanger
        showQuickJumper
        showTotal={(total) =>
          `ทั้งหมด ${total} รายการ`
        }
        onChange={onChange}
      />
    </div>
  );
}