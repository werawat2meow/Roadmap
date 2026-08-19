"use client";

import { Button, Card, Col, Input, Row, Select, Space } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

function makeOptions(items, codeKey, nameKey) {
  return (items || []).map((item) => ({
    value: item.id,
    label: item?.[codeKey]
      ? `${item[codeKey]} - ${item?.[nameKey] || "-"}`
      : item?.[nameKey] || "-",
  }));
}

function filterByIds(items = [], ids = new Set()) {
  return items.filter((item) => ids.has(String(item.id)));
}

function allowedIds(lineages = [], filters = {}, key, requiredKeys = []) {
  const ids = new Set();

  for (const lineage of lineages) {
    const matched = requiredKeys.every((filterKey) => {
      const selected = filters?.[filterKey];
      if (!selected) return true;
      return String(lineage?.[filterKey] || "") === String(selected);
    });

    if (matched && lineage?.[key]) {
      ids.add(String(lineage[key]));
    }
  }

  return ids;
}

export default function UnitPositionSearch({
  filters = {},
  options = {},
  loading = false,
  canCreate = false,
  onChange,
  onSearch,
  onReset,
  onRefresh,
  onCreate,
}) {
  const lineages = options.lineages || [];

  const companies = filterByIds(
    options.companies || [],
    allowedIds(lineages, filters, "company_id", [])
  );

  const branchGroups = filterByIds(
    options.branch_groups || [],
    allowedIds(lineages, filters, "branch_group_id", ["company_id"])
  );

  const branches = filterByIds(
    options.branches || [],
    allowedIds(lineages, filters, "branch_id", [
      "company_id",
      "branch_group_id",
    ])
  );

  const departments = filterByIds(
    options.departments || [],
    allowedIds(lineages, filters, "department_id", [
      "company_id",
      "branch_group_id",
      "branch_id",
    ])
  );

  const divisions = filterByIds(
    options.divisions || [],
    allowedIds(lineages, filters, "division_id", [
      "company_id",
      "branch_group_id",
      "branch_id",
      "department_id",
    ])
  );

  const units = filterByIds(
    options.units || [],
    allowedIds(lineages, filters, "unit_id", [
      "company_id",
      "branch_group_id",
      "branch_id",
      "department_id",
      "division_id",
    ])
  );

  return (
    <Card className="shadow-sm">
      <Row gutter={[12, 12]} align="bottom">
        <Col xs={24} lg={6}>
          <FieldLabel>ค้นหา</FieldLabel>
          <Input
            allowClear
            value={filters.search}
            prefix={<SearchOutlined />}
            placeholder="บริษัท / สังกัด / หน่วย / ตำแหน่ง"
            onChange={(event) => onChange?.("search", event.target.value)}
            onPressEnter={onSearch}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>บริษัท</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={filters.company_id || undefined}
            placeholder="บริษัท"
            options={makeOptions(companies, "company_code", "company_name_th")}
            onChange={(value) => onChange?.("company_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>กรุ๊ปสังกัด</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.company_id}
            value={filters.branch_group_id || undefined}
            placeholder="กรุ๊ปสังกัด"
            options={makeOptions(branchGroups, "group_code", "group_name")}
            onChange={(value) => onChange?.("branch_group_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>สังกัด</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.branch_group_id}
            value={filters.branch_id || undefined}
            placeholder="สังกัด"
            options={makeOptions(branches, "branch_code", "branch_name")}
            onChange={(value) => onChange?.("branch_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>แผนก</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.branch_id}
            value={filters.department_id || undefined}
            placeholder="แผนก"
            options={makeOptions(
              departments,
              "department_code",
              "department_name"
            )}
            onChange={(value) => onChange?.("department_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>ฝ่าย</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.department_id}
            value={filters.division_id || undefined}
            placeholder="ฝ่าย"
            options={makeOptions(divisions, "division_code", "division_name")}
            onChange={(value) => onChange?.("division_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>หน่วยงาน</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.division_id}
            value={filters.unit_id || undefined}
            placeholder="หน่วยงาน"
            options={makeOptions(units, "unit_code", "unit_name")}
            onChange={(value) => onChange?.("unit_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <FieldLabel>ตำแหน่ง</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={filters.position_id || undefined}
            placeholder="ตำแหน่ง"
            options={makeOptions(
              options.positions || [],
              "position_code",
              "position_name"
            )}
            onChange={(value) => onChange?.("position_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={3}>
          <FieldLabel>สถานะ</FieldLabel>
          <Select
            allowClear
            className="w-full"
            value={filters.status || undefined}
            placeholder="ทุกสถานะ"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            onChange={(value) => onChange?.("status", value || "")}
          />
        </Col>

        <Col xs={24} lg={9}>
          <Space wrap>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loading}
              onClick={onSearch}
            >
              ค้นหา
            </Button>

            <Button onClick={onReset}>ล้างตัวกรอง</Button>

            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
            >
              รีเฟรช
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreate}
              >
                เพิ่ม Workforce Plan
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="mb-1 text-xs font-medium text-slate-500">{children}</div>
  );
}
