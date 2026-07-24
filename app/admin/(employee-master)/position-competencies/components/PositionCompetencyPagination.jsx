"use client";

import { Pagination, Row, Col } from "antd";

export default function PositionCompetencyPagination({
  page,
  pageSize,
  total,
  onChange,
}) {
  return (
    <Row
      justify="end"
      className="mt-4"
    >
      <Col>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} จาก ${total} รายการ`
          }
          pageSizeOptions={[
            "10",
            "20",
            "50",
            "100",
          ]}
          onChange={onChange}
        />
      </Col>
    </Row>
  );
}