"use client";

import { useMemo } from "react";

import {
  Button,
  Card,
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

import PositionLazySelect from "./PositionLazySelect";

function makeOptions(rows, codeKey, nameKey) {
  return (rows || []).map((item) => {
    const code = item?.[codeKey] || "";
    const name = item?.[nameKey] || "-";

    return {
      value: item.id,
      label: code ? `${code} - ${name}` : name,
    };
  });
}

function FieldLabel({ children }) {
  return (
    <div className="mb-1 text-xs font-medium text-slate-500">
      {children}
    </div>
  );
}

export default function EmployeeOrganizationSearch({
  filters,
  options,
  loading = false,
  optionsLoading = false,
  onChange,
  onClear,
  onRefresh,
}) {
  const companies = options?.companies || [];
  const branchGroups = options?.branch_groups || [];
  const branches = options?.branches || [];
  const branchDepartments = options?.branch_departments || [];
  const departments = options?.departments || [];
  const divisions = options?.divisions || [];
  const units = options?.units || [];
  const positionLevels = options?.position_levels || [];
  const employmentTypes = options?.employment_types || [];
  const employeeStatuses = options?.employee_statuses || [];

  const scopedBranchGroups = useMemo(() => {
    if (!filters.company_id) return [];

    const ids = new Set(
      branches
        .filter(
          (branch) =>
            String(branch.company_id || "") ===
            String(filters.company_id)
        )
        .map((branch) => String(branch.group_id || ""))
        .filter(Boolean)
    );

    return branchGroups.filter((item) => ids.has(String(item.id)));
  }, [branchGroups, branches, filters.company_id]);

  const scopedBranches = useMemo(() => {
    if (!filters.company_id || !filters.branch_group_id) return [];

    return branches.filter(
      (branch) =>
        String(branch.company_id || "") === String(filters.company_id) &&
        String(branch.group_id || "") ===
          String(filters.branch_group_id)
    );
  }, [branches, filters.company_id, filters.branch_group_id]);

  const scopedDepartments = useMemo(() => {
    if (!filters.branch_id) return [];

    const ids = new Set(
      branchDepartments
        .filter(
          (item) =>
            String(item.branch_id || "") === String(filters.branch_id) &&
            item.status !== "inactive"
        )
        .map((item) => String(item.department_id || ""))
        .filter(Boolean)
    );

    return departments.filter((item) => ids.has(String(item.id)));
  }, [branchDepartments, departments, filters.branch_id]);

  const scopedDivisions = useMemo(() => {
    if (!filters.department_id) return [];

    return divisions.filter(
      (item) =>
        String(item.department_id || "") ===
        String(filters.department_id)
    );
  }, [divisions, filters.department_id]);

  const scopedUnits = useMemo(() => {
    if (!filters.division_id) return [];

    return units.filter(
      (item) =>
        String(item.division_id || "") === String(filters.division_id)
    );
  }, [units, filters.division_id]);

  return (
    <Card>
      <Row gutter={[12, 12]} align="bottom">
        <Col xs={24} lg={8} xl={6}>
          <FieldLabel>ค้นหาพนักงาน</FieldLabel>
          <Input
            allowClear
            value={filters.search}
            prefix={<SearchOutlined />}
            placeholder="รหัสพนักงาน / ชื่อ / นามสกุล"
            onChange={(event) => onChange?.("search", event.target.value)}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>บริษัท</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            loading={optionsLoading}
            value={filters.company_id || undefined}
            placeholder="ทุกบริษัท"
            options={companies.map((item) => ({
              value: item.id,
              label: item.company_code
                ? `${item.company_code} - ${
                    item.company_name_th || item.company_name_en || "-"
                  }`
                : item.company_name_th || item.company_name_en || "-",
            }))}
            onChange={(value) => onChange?.("company_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>กรุ๊ปสังกัด</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.company_id}
            value={filters.branch_group_id || undefined}
            placeholder="ทุกกรุ๊ปสังกัด"
            options={makeOptions(scopedBranchGroups, "group_code", "group_name")}
            onChange={(value) =>
              onChange?.("branch_group_id", value || "")
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>สังกัด</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.branch_group_id}
            value={filters.branch_id || undefined}
            placeholder="ทุกสังกัด"
            options={makeOptions(scopedBranches, "branch_code", "branch_name")}
            onChange={(value) => onChange?.("branch_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>แผนก</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.branch_id}
            value={filters.department_id || undefined}
            placeholder="ทุกแผนก"
            options={makeOptions(
              scopedDepartments,
              "department_code",
              "department_name"
            )}
            onChange={(value) => onChange?.("department_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>ฝ่าย</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.department_id}
            value={filters.division_id || undefined}
            placeholder="ทุกฝ่าย"
            options={makeOptions(scopedDivisions, "division_code", "division_name")}
            onChange={(value) => onChange?.("division_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>หน่วยงาน</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            disabled={!filters.division_id}
            value={filters.unit_id || undefined}
            placeholder="ทุกหน่วยงาน"
            options={makeOptions(scopedUnits, "unit_code", "unit_name")}
            onChange={(value) => onChange?.("unit_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>ตำแหน่ง</FieldLabel>
          <PositionLazySelect
            value={filters.position_id}
            onChange={(value) => onChange?.("position_id", value || "")}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>ระดับตำแหน่ง</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={filters.position_level_id || undefined}
            placeholder="ทุก Level"
            options={makeOptions(positionLevels, "level_code", "level_name")}
            onChange={(value) =>
              onChange?.("position_level_id", value || "")
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>ประเภทการจ้าง</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={filters.employment_type_id || undefined}
            placeholder="ทุกประเภทการจ้าง"
            options={makeOptions(employmentTypes, "type_code", "type_name")}
            onChange={(value) =>
              onChange?.("employment_type_id", value || "")
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={4}>
          <FieldLabel>สถานะพนักงาน</FieldLabel>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-full"
            value={filters.employee_status_id || undefined}
            placeholder="ทุกสถานะ"
            options={makeOptions(
              employeeStatuses,
              "status_code",
              "status_name"
            )}
            onChange={(value) =>
              onChange?.("employee_status_id", value || "")
            }
          />
        </Col>

        <Col xs={24} xl={8}>
          <Space wrap>
            <Button onClick={onClear}>ล้างตัวกรอง</Button>
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
