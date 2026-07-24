"use client";

import { Pagination, Row, Col } from "antd";

export default function PositionSkillPagination({
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
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} จาก ${total} รายการ`
          }
          pageSizeOptions={[10, 20, 50, 100]}
          onChange={onChange}
        />
      </Col>
    </Row>
  );
}