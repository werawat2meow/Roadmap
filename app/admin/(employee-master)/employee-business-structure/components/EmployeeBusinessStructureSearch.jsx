"use client";

import { Button, Card, Col, Input, Row, Select, Space } from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const MANAGEMENT_LEVEL_OPTIONS = ["P12", "P11", "P10", "P9"].map(
  (value) => ({ value, label: value })
);

const SCOPE_OPTIONS = [
  { value: "all", label: "ทั้งองค์กร" },
  { value: "company", label: "บริษัท" },
  { value: "branch_group", label: "กรุ๊ปสังกัด" },
  { value: "branch", label: "สังกัด" },
  { value: "department", label: "แผนก" },
  { value: "division", label: "ฝ่าย" },
  { value: "unit", label: "หน่วยงาน" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ไม่ใช้งาน" },
];

export default function EmployeeBusinessStructureSearch({
  search = "",
  managementLevel = "",
  scopeType = "",
  status = "",
  loading = false,
  onSearchChange,
  onManagementLevelChange,
  onScopeTypeChange,
  onStatusChange,
  onClear,
  onRefresh,
}) {
  return (
    <Card size="small">
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} lg={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            placeholder="ค้นหารหัส/ชื่อพนักงาน ตำแหน่ง ผู้บังคับบัญชา หรือหน่วยงาน"
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </Col>

        <Col xs={24} sm={8} lg={4}>
          <Select
            allowClear
            value={managementLevel || undefined}
            placeholder="Management Level"
            options={MANAGEMENT_LEVEL_OPTIONS}
            style={{ width: "100%" }}
            onChange={(value) => onManagementLevelChange?.(value || "")}
          />
        </Col>

        <Col xs={24} sm={8} lg={4}>
          <Select
            allowClear
            value={scopeType || undefined}
            placeholder="ขอบเขตที่รับผิดชอบ"
            options={SCOPE_OPTIONS}
            style={{ width: "100%" }}
            onChange={(value) => onScopeTypeChange?.(value || "")}
          />
        </Col>

        <Col xs={24} sm={8} lg={4}>
          <Select
            allowClear
            value={status || undefined}
            placeholder="สถานะ"
            options={STATUS_OPTIONS}
            style={{ width: "100%" }}
            onChange={(value) => onStatusChange?.(value || "")}
          />
        </Col>

        <Col xs={24} lg={4}>
          <Space wrap>
            <Button
              icon={<ClearOutlined />}
              disabled={loading}
              onClick={onClear}
            >
              ล้าง
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
            >
              รีเฟรช
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
