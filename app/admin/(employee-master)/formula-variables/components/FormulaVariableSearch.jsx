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

import LazyFormulaVariableCompanySelect from "./LazyFormulaVariableCompanySelect";

const SEARCH_DEBOUNCE_MS = 400;

const DATA_TYPE_OPTIONS = [
  {
    value: "number",
    label: "ตัวเลขทศนิยม",
  },
  {
    value: "integer",
    label: "จำนวนเต็ม",
  },
  {
    value: "boolean",
    label: "จริง / เท็จ",
  },
  {
    value: "text",
    label: "ข้อความ",
  },
  {
    value: "date",
    label: "วันที่",
  },
];

const SOURCE_TYPE_OPTIONS = [
  {
    value: "system",
    label: "ระบบ",
  },
  {
    value: "employee",
    label: "ข้อมูลพนักงาน",
  },
  {
    value: "attendance",
    label: "เวลาและการลงเวลา",
  },
  {
    value: "payroll",
    label: "Payroll",
  },
  {
    value: "custom",
    label: "กำหนดเอง",
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

export default function FormulaVariableSearch({
  search = "",
  companyId,
  dataType,
  sourceType,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onDataTypeChange,
  onSourceTypeChange,
  onStatusChange,
}) {
  const [
    keyword,
    setKeyword,
  ] = useState(search);

  const onSearchRef =
    useRef(onSearch);

  const firstRenderRef =
    useRef(true);

  /* =========================================================
     Keep Callback Latest
  ========================================================= */

  useEffect(() => {
    onSearchRef.current =
      onSearch;
  }, [
    onSearch,
  ]);

  /* =========================================================
     Sync Search From Parent
  ========================================================= */

  useEffect(() => {
    setKeyword(
      search
    );
  }, [
    search,
  ]);

  /* =========================================================
     Auto Search - Debounce
  ========================================================= */

  useEffect(() => {
    /*
     * ไม่ยิงซ้ำตอน Component mount ครั้งแรก
     */
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
      clearTimeout(
        timer
      );
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
      {/* =====================================================
          SEARCH
      ===================================================== */}

      <Input.Search
        value={keyword}
        allowClear
        loading={loading}
        placeholder="ค้นหารหัส / ชื่อตัวแปร / Source Key"
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
          /*
           * กด Enter / ปุ่ม Search
           * ให้ยิงทันที ไม่ต้องรอ Debounce
           */
          onSearchRef.current?.(
            String(
              value || ""
            ).trim()
          );
        }}
      />

      {/* =====================================================
          COMPANY
      ===================================================== */}

      <div
        style={{
          flex: "1 1 240px",
          minWidth: 220,
        }}
      >
        <LazyFormulaVariableCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      {/* =====================================================
          DATA TYPE
      ===================================================== */}

      <Select
        allowClear
        value={dataType}
        placeholder="ทุกชนิดข้อมูล"
        options={
          DATA_TYPE_OPTIONS
        }
        style={{
          flex: "0 1 180px",
          minWidth: 160,
        }}
        onChange={
          onDataTypeChange
        }
      />

      {/* =====================================================
          SOURCE TYPE
      ===================================================== */}

      <Select
        allowClear
        value={sourceType}
        placeholder="ทุกแหล่งข้อมูล"
        options={
          SOURCE_TYPE_OPTIONS
        }
        style={{
          flex: "0 1 190px",
          minWidth: 170,
        }}
        onChange={
          onSourceTypeChange
        }
      />

      {/* =====================================================
          STATUS
      ===================================================== */}

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