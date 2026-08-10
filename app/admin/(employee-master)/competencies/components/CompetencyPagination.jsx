"use client";

import { Pagination } from "antd";

export default function CompetencyPagination({
  pagination,
  onChange,
}) {
  return (
    <div className="mt-4 flex justify-end">
      <Pagination
        current={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={onChange}
        showSizeChanger
        showQuickJumper
        pageSizeOptions={[
          "10",
          "20",
          "50",
          "100",
        ]}
        showTotal={(total, range) =>
          `${range[0]}-${range[1]} จาก ${total} รายการ`
        }
      />
    </div>
  );
}