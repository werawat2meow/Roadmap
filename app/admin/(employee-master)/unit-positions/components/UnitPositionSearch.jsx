"use client";

import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
} from "antd";

import {
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Search } = Input;

export default function UnitPositionSearch({
  search,
  onSearch,

  canCreate = false,

  onCreate,
}) {
  return (
    <Card>
      <Row
        gutter={[16, 16]}
        justify="space-between"
        align="middle"
      >
        <Col xs={24} md={16}>
          <Search
            allowClear
            enterButton={<SearchOutlined />}
            placeholder="ค้นหาหน่วย / ฝ่าย / แผนก / ตำแหน่ง"
            value={search}
            onChange={(e) =>
              onSearch?.(e.target.value)
            }
          />
        </Col>

        <Col>
          <Space>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreate}
              >
                เพิ่มข้อมูล
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}