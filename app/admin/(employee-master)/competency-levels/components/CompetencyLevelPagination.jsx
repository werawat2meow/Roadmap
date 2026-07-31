"use client";

import { Pagination } from "antd";

export default function CompetencyLevelPagination({
  pagination,
  onChange,
}) {
  return (
    <div className="mt-4 flex justify-end">
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
      />
    </div>
  );
}