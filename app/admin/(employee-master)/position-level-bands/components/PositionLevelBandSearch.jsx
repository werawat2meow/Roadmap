"use client";

import { Row, Col, Input, Select, Button } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Search } = Input;

export default function PositionLevelBandSearch({
  search,
  setSearch,
  levels = [],
  selectedLevel,
  setSelectedLevel,
  onSearch,
  onReset,
  lockLevel = false
}) {
  return (
    <Row gutter={[16, 16]} align="middle">
      <Col xs={24} md={8}>
        <Select
          style={{ width: "100%" }}
          placeholder="เลือกระดับตำแหน่ง"
          allowClear
          value={selectedLevel}
          onChange={setSelectedLevel}
          options={levels.map((item) => ({
            value: item.id,
            label: `${item.level_code} - ${item.level_name}`,
          }))}
          disabled={lockLevel}
        />
      </Col>

      <Col xs={24} md={10}>
        <Search
          allowClear
          placeholder="ค้นหา Band Code หรือ Band Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={onSearch}
          enterButton={<SearchOutlined />}
        />
      </Col>

      <Col xs={24} md={6}>
        <Button
          icon={<ReloadOutlined />}
          block
          onClick={onReset}
        >
          รีเซ็ต
        </Button>
      </Col>
    </Row>
  );
}