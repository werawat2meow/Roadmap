"use client";

import { Pagination, Row, Col } from "antd";

export default function PositionLevelBandPagination({
  pagination,
  page,
  setPage,
  pageSize,
  setPageSize,
}) {
  return (
    <Row justify="end" style={{ marginTop: 16 }}>
      <Col>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={pagination?.total || 0}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} จาก ${total} รายการ`
          }
          pageSizeOptions={["10", "20", "50", "100"]}
          onChange={(current, size) => {
            setPage(current);
            if (size !== pageSize) {
              setPageSize(size);
            }
          }}
        />
      </Col>
    </Row>
  );
}