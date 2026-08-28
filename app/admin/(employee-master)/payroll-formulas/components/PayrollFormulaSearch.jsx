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

import LazyPayrollFormulaCompanySelect from "./LazyPayrollFormulaCompanySelect";

const SEARCH_DEBOUNCE_MS = 400;

const FORMULA_TYPE_OPTIONS = [
  {
    value: "earning",
    label: "สูตรรายได้",
  },
  {
    value: "deduction",
    label: "สูตรรายการหัก",
  },
  {
    value: "general",
    label: "สูตรทั่วไป",
  },
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "ใช้งาน",
  },
  {
    value: "inactive",
    label: "ไม่ใช้งาน",
  },
];

export default function PayrollFormulaSearch({
  search = "",
  companyId,
  formulaType,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onFormulaTypeChange,
  onStatusChange,
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

    return () => {
      clearTimeout(timer);
    };
  }, [
    keyword,
  ]);

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
        placeholder="ค้นหารหัส / ชื่อสูตร / สูตรคำนวณ"
        enterButton
        style={{
          flex: "1 1 320px",
          minWidth: 220,
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

      <div
        style={{
          flex: "1 1 240px",
          minWidth: 220,
        }}
      >
        <LazyPayrollFormulaCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      <Select
        allowClear
        value={formulaType}
        placeholder="ทุกประเภทสูตร"
        options={
          FORMULA_TYPE_OPTIONS
        }
        style={{
          flex: "0 1 190px",
          minWidth: 170,
        }}
        onChange={
          onFormulaTypeChange
        }
      />

      <Select
        allowClear
        value={status}
        placeholder="ทุกสถานะ"
        options={
          STATUS_OPTIONS
        }
        style={{
          flex: "0 1 150px",
          minWidth: 130,
        }}
        onChange={
          onStatusChange
        }
      />
    </Flex>
  );
}
