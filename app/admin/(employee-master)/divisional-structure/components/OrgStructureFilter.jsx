"use client";

import {
  Button,
  Col,
  Input,
  Row,
  Select,
  Space,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function OrgStructureFilter({
  filters,
  options,
  onChange,
  onSearchChange,
  onReload,
  loading = false,
}) {
  const filtered = buildFilteredOptions(options, filters);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8} xl={6}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={filters.search}
            placeholder="ค้นหา Slot / ชื่อ Slot / ประเภท"
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="บริษัท"
            value={filters.company_id || undefined}
            options={filtered.companies}
            onChange={(value) =>
              onChange?.("company_id", value || "")
            }
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="กลุ่มสังกัด"
            value={filters.branch_group_id || undefined}
            options={filtered.branchGroups}
            onChange={(value) =>
              onChange?.("branch_group_id", value || "")
            }
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="สังกัด / สาขา"
            value={filters.branch_id || undefined}
            options={filtered.branches}
            onChange={(value) =>
              onChange?.("branch_id", value || "")
            }
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="แผนก"
            value={filters.department_id || undefined}
            options={filtered.departments}
            onChange={(value) =>
              onChange?.("department_id", value || "")
            }
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="ฝ่าย"
            value={filters.division_id || undefined}
            options={filtered.divisions}
            onChange={(value) =>
              onChange?.("division_id", value || "")
            }
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            placeholder="หน่วย"
            value={filters.unit_id || undefined}
            options={filtered.units}
            onChange={(value) =>
              onChange?.("unit_id", value || "")
            }
          />
        </Col>

        <Col xs={24} md={8} xl={6}>
          <Space className="w-full" wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onReload}
            >
              โหลดใหม่
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

export function buildFilteredOptions(options = {}, filters = {}) {
  const companies = options.companies || [];
  const branchGroups = options.branch_groups || [];
  const branches = options.branches || [];
  const branchDepartments = options.branch_departments || [];
  const departments = options.departments || [];
  const divisions = options.divisions || [];
  const units = options.units || [];

  const visibleBranches = branches.filter((item) => {
    if (filters.company_id && item.company_id !== filters.company_id) {
      return false;
    }
    if (
      filters.branch_group_id &&
      item.group_id !== filters.branch_group_id
    ) {
      return false;
    }
    return true;
  });

  const visibleBranchIds = new Set(visibleBranches.map((item) => item.id));

  const groupIdsFromCompany = new Set(
    branches
      .filter(
        (item) =>
          !filters.company_id || item.company_id === filters.company_id
      )
      .map((item) => item.group_id)
      .filter(Boolean)
  );

  const visibleDepartmentIds = new Set(
    branchDepartments
      .filter((item) => {
        if (filters.branch_id) {
          return item.branch_id === filters.branch_id;
        }
        if (filters.company_id || filters.branch_group_id) {
          return visibleBranchIds.has(item.branch_id);
        }
        return true;
      })
      .map((item) => item.department_id)
  );

  const hasBranchConstraint = Boolean(
    filters.branch_id || filters.company_id || filters.branch_group_id
  );

  const visibleDepartments = departments.filter((item) => {
    if (!hasBranchConstraint) return true;
    return visibleDepartmentIds.has(item.id);
  });

  const visibleDivisions = divisions.filter(
    (item) =>
      !filters.department_id || item.department_id === filters.department_id
  );

  const visibleDivisionIds = new Set(visibleDivisions.map((item) => item.id));

  const visibleUnits = units.filter((item) => {
    if (filters.division_id) {
      return item.division_id === filters.division_id;
    }
    if (filters.department_id) {
      return visibleDivisionIds.has(item.division_id);
    }
    return true;
  });

  return {
    companies: companies.map((item) => ({
      value: item.id,
      label: `${item.company_code || ""} - ${item.company_name_th || item.company_name_en || "-"}`,
    })),

    branchGroups: branchGroups
      .filter(
        (item) =>
          !filters.company_id || groupIdsFromCompany.has(item.id)
      )
      .map((item) => ({
        value: item.id,
        label: `${item.group_code || ""} - ${item.group_name || "-"}`,
      })),

    branches: visibleBranches.map((item) => ({
      value: item.id,
      label: `${item.branch_code || ""} - ${item.branch_name || "-"}`,
    })),

    departments: visibleDepartments.map((item) => ({
      value: item.id,
      label: `${item.department_code || ""} - ${item.department_name || "-"}`,
    })),

    divisions: visibleDivisions.map((item) => ({
      value: item.id,
      label: `${item.division_code || ""} - ${item.division_name || "-"}`,
    })),

    units: visibleUnits.map((item) => ({
      value: item.id,
      label: `${item.unit_code || ""} - ${item.unit_name || "-"}`,
    })),
  };
}
