"use client";

import { Alert, Col, Form, InputNumber, Row, Select } from "antd";
import { useMemo } from "react";

function makeOptions(items, codeKey, nameKey) {
  return (items || []).map((item) => ({
    value: item.id,
    label: item?.[codeKey]
      ? `${item[codeKey]} - ${item?.[nameKey] || "-"}`
      : item?.[nameKey] || "-",
  }));
}

function allowedIds(lineages = [], selected = {}, key, requiredKeys = []) {
  const ids = new Set();

  for (const lineage of lineages) {
    const matched = requiredKeys.every((filterKey) => {
      const value = selected?.[filterKey];
      if (!value) return true;
      return String(lineage?.[filterKey] || "") === String(value);
    });

    if (matched && lineage?.[key]) {
      ids.add(String(lineage[key]));
    }
  }

  return ids;
}

function filterByIds(items = [], ids = new Set()) {
  return items.filter((item) => ids.has(String(item.id)));
}

export default function UnitPositionForm({
  form,
  options = {},
  editingRow = null,
  disabled = false,
}) {
  const companyId = Form.useWatch("company_id", form);
  const branchGroupId = Form.useWatch("branch_group_id", form);
  const branchId = Form.useWatch("branch_id", form);
  const departmentId = Form.useWatch("department_id", form);
  const divisionId = Form.useWatch("division_id", form);

  const structureLocked = Boolean(editingRow?.slot_count > 0);
  const structureDisabled = disabled || structureLocked;
  const lineages = options.lineages || [];

  const selected = {
    company_id: companyId,
    branch_group_id: branchGroupId,
    branch_id: branchId,
    department_id: departmentId,
    division_id: divisionId,
  };

  const companies = useMemo(
    () =>
      filterByIds(
        options.companies || [],
        allowedIds(lineages, selected, "company_id", [])
      ),
    [lineages, options.companies]
  );

  const branchGroups = useMemo(
    () =>
      filterByIds(
        options.branch_groups || [],
        allowedIds(lineages, selected, "branch_group_id", ["company_id"])
      ),
    [lineages, options.branch_groups, companyId]
  );

  const branches = useMemo(
    () =>
      filterByIds(
        options.branches || [],
        allowedIds(lineages, selected, "branch_id", [
          "company_id",
          "branch_group_id",
        ])
      ),
    [lineages, options.branches, companyId, branchGroupId]
  );

  const departments = useMemo(
    () =>
      filterByIds(
        options.departments || [],
        allowedIds(lineages, selected, "department_id", [
          "company_id",
          "branch_group_id",
          "branch_id",
        ])
      ),
    [
      lineages,
      options.departments,
      companyId,
      branchGroupId,
      branchId,
    ]
  );

  const divisions = useMemo(
    () =>
      filterByIds(
        options.divisions || [],
        allowedIds(lineages, selected, "division_id", [
          "company_id",
          "branch_group_id",
          "branch_id",
          "department_id",
        ])
      ),
    [
      lineages,
      options.divisions,
      companyId,
      branchGroupId,
      branchId,
      departmentId,
    ]
  );

  const units = useMemo(
    () =>
      filterByIds(
        options.units || [],
        allowedIds(lineages, selected, "unit_id", [
          "company_id",
          "branch_group_id",
          "branch_id",
          "department_id",
          "division_id",
        ])
      ),
    [
      lineages,
      options.units,
      companyId,
      branchGroupId,
      branchId,
      departmentId,
      divisionId,
    ]
  );

  return (
    <Form form={form} layout="vertical">
      {structureLocked && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title="แผนนี้มี Position Slot เชื่อมอยู่แล้ว"
          description="ระบบล็อก Company / Branch Group / Branch / Department / Division / Unit / Position เพื่อไม่ให้ Slot ที่สร้างแล้วหลุดจาก Workforce Plan เดิม แต่ยังแก้ Target Headcount และ Status ได้"
        />
      )}

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[{ required: true, message: "กรุณาเลือกบริษัท" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled}
              placeholder="เลือกบริษัท"
              options={makeOptions(companies, "company_code", "company_name_th")}
              onChange={() => {
                form.setFieldsValue({
                  branch_group_id: undefined,
                  branch_id: undefined,
                  department_id: undefined,
                  division_id: undefined,
                  unit_id: undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="กรุ๊ปสังกัด"
            name="branch_group_id"
            rules={[{ required: true, message: "กรุณาเลือกกรุ๊ปสังกัด" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled || !companyId}
              placeholder="เลือกกรุ๊ปสังกัด"
              options={makeOptions(branchGroups, "group_code", "group_name")}
              onChange={() => {
                form.setFieldsValue({
                  branch_id: undefined,
                  department_id: undefined,
                  division_id: undefined,
                  unit_id: undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="สังกัด"
            name="branch_id"
            rules={[{ required: true, message: "กรุณาเลือกสังกัด" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled || !branchGroupId}
              placeholder="เลือกสังกัด"
              options={makeOptions(branches, "branch_code", "branch_name")}
              onChange={() => {
                form.setFieldsValue({
                  department_id: undefined,
                  division_id: undefined,
                  unit_id: undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="แผนก"
            name="department_id"
            rules={[{ required: true, message: "กรุณาเลือกแผนก" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled || !branchId}
              placeholder="เลือกแผนก"
              options={makeOptions(
                departments,
                "department_code",
                "department_name"
              )}
              onChange={() => {
                form.setFieldsValue({
                  division_id: undefined,
                  unit_id: undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="ฝ่าย"
            name="division_id"
            rules={[{ required: true, message: "กรุณาเลือกฝ่าย" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled || !departmentId}
              placeholder="เลือกฝ่าย"
              options={makeOptions(divisions, "division_code", "division_name")}
              onChange={() => {
                form.setFieldValue("unit_id", undefined);
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label="หน่วยงาน"
            name="unit_id"
            rules={[{ required: true, message: "กรุณาเลือกหน่วยงาน" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled || !divisionId}
              placeholder="เลือกหน่วยงาน"
              options={makeOptions(units, "unit_code", "unit_name")}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="ตำแหน่ง"
            name="position_id"
            rules={[{ required: true, message: "กรุณาเลือกตำแหน่ง" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={structureDisabled}
              placeholder="เลือกตำแหน่ง"
              options={makeOptions(
                options.positions || [],
                "position_code",
                "position_name"
              )}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            label="Target Headcount"
            name="headcount_target"
            rules={[{ required: true, message: "กรุณาระบุจำนวนอัตราเป้าหมาย" }]}
          >
            <InputNumber
              min={0}
              precision={0}
              className="w-full"
              disabled={disabled}
              placeholder="0"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item label="สถานะ" name="status">
            <Select
              disabled={disabled}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
