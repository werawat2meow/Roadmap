"use client";

import { Pagination, Row, Col } from "antd";

export default function EmployeeSkillPagination({
  page,
  pageSize,
  total,

  onPageChange,
  onPageSizeChange,
}) {
  return (
    <Row
      justify="end"
      style={{
        marginTop: 20,
      }}
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
          onChange={(page, size) => {
            if (size !== pageSize) {
              onPageSizeChange(size);
            }

            onPageChange(page);
          }}
        />
      </Col>
    </Row>
  );
}