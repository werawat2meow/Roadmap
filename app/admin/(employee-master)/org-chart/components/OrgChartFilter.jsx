"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Flex,
  Input,
  Select,
} from "antd";

const SEARCH_DEBOUNCE_MS = 400;

const OCCUPANCY_OPTIONS = [
  {
    value: "all",
    label: "ทุก Slot",
  },
  {
    value: "filled",
    label: "มีผู้ครองตำแหน่ง",
  },
  {
    value: "vacant",
    label: "มีตำแหน่งว่าง",
  },
];

function option(
  value,
  code,
  name
) {
  if (!value) {
    return null;
  }

  return {
    value,
    label:
      code && name
        ? `${code} - ${name}`
        : name ||
          code ||
          value,
  };
}

export default function OrgChartFilter({
  search = "",
  companyId,
  branchGroupId,
  branchId,
  departmentId,
  divisionId,
  unitId,
  occupancy = "all",
  options = {},
  loading = false,
  onSearch,
  onCompanyChange,
  onBranchGroupChange,
  onBranchChange,
  onDepartmentChange,
  onDivisionChange,
  onUnitChange,
  onOccupancyChange,
}) {
  const [
    keyword,
    setKeyword,
  ] =
    useState(search);

  const onSearchRef =
    useRef(onSearch);

  const firstRenderRef =
    useRef(true);

  useEffect(() => {
    onSearchRef.current =
      onSearch;
  }, [
    onSearch,
  ]);

  useEffect(() => {
    setKeyword(search);
  }, [
    search,
  ]);

  useEffect(() => {
    if (
      firstRenderRef.current
    ) {
      firstRenderRef.current =
        false;
      return;
    }

    const timer =
      setTimeout(() => {
        onSearchRef.current?.(
          keyword.trim()
        );
      }, SEARCH_DEBOUNCE_MS);

    return () =>
      clearTimeout(timer);
  }, [
    keyword,
  ]);

  const companies =
    (options.companies || [])
      .map(
        (item) =>
          option(
            item.id,
            item.company_code,
            item.company_name_th ||
              item.company_name_en
          )
      )
      .filter(Boolean);

  const branchGroups =
    (options.branch_groups || [])
      .map(
        (item) =>
          option(
            item.id,
            item.group_code,
            item.group_name
          )
      )
      .filter(Boolean);

  const branches =
    (options.branches || [])
      .filter(
        (item) =>
          !companyId ||
          !item.company_id ||
          String(
            item.company_id
          ) ===
            String(companyId)
      )
      .map(
        (item) =>
          option(
            item.id,
            item.branch_code,
            item.branch_name
          )
      )
      .filter(Boolean);

  const departments =
    (options.departments || [])
      .map(
        (item) =>
          option(
            item.id,
            item.department_code,
            item.department_name
          )
      )
      .filter(Boolean);

  const divisions =
    (options.divisions || [])
      .filter(
        (item) =>
          !departmentId ||
          !item.department_id ||
          String(
            item.department_id
          ) ===
            String(
              departmentId
            )
      )
      .map(
        (item) =>
          option(
            item.id,
            item.division_code,
            item.division_name
          )
      )
      .filter(Boolean);

  const units =
    (options.units || [])
      .filter(
        (item) =>
          !divisionId ||
          !item.division_id ||
          String(
            item.division_id
          ) ===
            String(divisionId)
      )
      .map(
        (item) =>
          option(
            item.id,
            item.unit_code,
            item.unit_name
          )
      )
      .filter(Boolean);

  const commonStyle = {
    flex: "1 1 190px",
    minWidth: 170,
  };

  return (
    <Flex
      wrap="wrap"
      gap={12}
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <Input.Search
        value={keyword}
        allowClear
        loading={loading}
        placeholder="ค้นหา Slot / ตำแหน่ง / รหัสพนักงาน / ชื่อพนักงาน"
        enterButton
        style={{
          flex: "2 1 340px",
          minWidth: 260,
        }}
        onChange={(event) => {
          setKeyword(
            event.target.value
          );
        }}
        onSearch={(value) => {
          onSearchRef.current?.(
            String(
              value || ""
            ).trim()
          );
        }}
      />

      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={companyId}
        placeholder="ทุกบริษัท"
        options={companies}
        style={commonStyle}
        onChange={(value) => {
          onCompanyChange?.(
            value
          );
        }}
      />

      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={branchGroupId}
        placeholder="ทุกกรุ๊ปสังกัด"
        options={branchGroups}
        style={commonStyle}
        onChange={(value) => {
          onBranchGroupChange?.(
            value
          );
        }}
      />

      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={branchId}
        placeholder="ทุกสังกัด"
        options={branches}
        style={commonStyle}
        onChange={(value) => {
          onBranchChange?.(
            value
          );
        }}
      />

      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={departmentId}
        placeholder="ทุกแผนก"
        options={departments}
        style={commonStyle}
        onChange={(value) => {
          onDepartmentChange?.(
            value
          );
        }}
      />

      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={divisionId}
        placeholder="ทุกฝ่าย"
        options={divisions}
        style={commonStyle}
        onChange={(value) => {
          onDivisionChange?.(
            value
          );
        }}
      />

      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={unitId}
        placeholder="ทุกหน่วย"
        options={units}
        style={commonStyle}
        onChange={(value) => {
          onUnitChange?.(
            value
          );
        }}
      />

      <Select
        value={occupancy}
        options={
          OCCUPANCY_OPTIONS
        }
        style={{
          flex: "0 1 190px",
          minWidth: 170,
        }}
        onChange={
          onOccupancyChange
        }
      />
    </Flex>
  );
}
