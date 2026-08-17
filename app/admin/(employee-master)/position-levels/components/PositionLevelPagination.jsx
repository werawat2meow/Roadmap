"use client";

import { Button } from "antd";
import {
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

export default function PositionLevelPagination({
  page,
  totalPages,
  total,
  loading,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex items-center justify-end gap-4">


      <div className="text-sm text-slate-500">
        ทั้งหมด {total} รายการ • หน้า {page} / {totalPages}
      </div>

      <Button
        icon={<LeftOutlined />}
        disabled={page <= 1 || loading}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <Button
        icon={<RightOutlined />}
        iconPlacement="end"
        disabled={page >= totalPages || loading}
        onClick={onNext}
      >
        Next
      </Button>

    </div>
  );
}