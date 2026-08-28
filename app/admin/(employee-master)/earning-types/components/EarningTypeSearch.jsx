"use client";

import {
  Col,
  Input,
  Row,
  Select,
} from "antd";

import LazyEarningTypeCompanySelect from "./LazyEarningTypeCompanySelect";

const CATEGORY_OPTIONS = [
  { value: "salary", label: "เงินเดือน" },
  { value: "overtime", label: "ค่าล่วงเวลา" },
  { value: "allowance", label: "เบี้ยเลี้ยง / ค่าตอบแทน" },
  { value: "bonus", label: "โบนัส" },
  { value: "commission", label: "ค่าคอมมิชชั่น" },
  { value: "other", label: "อื่น ๆ" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
];

export default function EarningTypeSearch({
  search = "",
  companyId,
  category,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onCategoryChange,
  onStatusChange,
}) {
  return (
    <Row>
      <Col xs={24} lg={10}>
        <Input.Search
          allowClear
          defaultValue={search}
          loading={loading}
          placeholder="ค้นหารหัส / ชื่อ / รายละเอียด"
          enterButton
          onSearch={onSearch}
          onChange={(event) => {
            if (!event.target.value) {
              onSearch?.("");
            }
          }}
        />
      </Col>

      <Col xs={24} md={8} lg={6}>
        <LazyEarningTypeCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={onCompanyChange}
        />
      </Col>

      <Col xs={12} md={8} lg={4}>
        <Select
          allowClear
          value={category}
          placeholder="ทุกหมวด"
          options={CATEGORY_OPTIONS}
          style={{ width: "100%" }}
          onChange={onCategoryChange}
        />
      </Col>

      <Col xs={12} md={8} lg={4}>
        <Select
          allowClear
          value={status}
          placeholder="ทุกสถานะ"
          options={STATUS_OPTIONS}
          style={{ width: "100%" }}
          onChange={onStatusChange}
        />
      </Col>
    </Row>
  );
}
