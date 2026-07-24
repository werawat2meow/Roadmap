"use client";

import { Col, Pagination, Row } from "antd";

export default function SkillLevelPagination({
  current = 1,
  pageSize = 20,
  total = 0,
  onChange,
}) {
  return (
    <Row justify="end" className="mt-4">
      <Col>
        <Pagination
          current={current}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} จาก ${total} รายการ`
          }
          onChange={onChange}
        />
      </Col>
    </Row>
  );
}