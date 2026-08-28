"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Flex,
  Input,
  InputNumber,
  Select,
} from "antd";

import LazyPayrollPeriodCompanySelect from "./LazyPayrollPeriodCompanySelect";
import LazyPayrollPeriodGroupSelect from "./LazyPayrollPeriodGroupSelect";

const SEARCH_DEBOUNCE_MS =
  400;

const STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "open",
    label: "เปิดงวด",
  },
  {
    value: "closed",
    label: "ปิดงวด",
  },
  {
    value: "processed",
    label: "ประมวลผลแล้ว",
  },
];

export default function PayrollPeriodSearch({
  search = "",
  companyId,
  payrollGroupId,
  periodYear,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onPayrollGroupChange,
  onPeriodYearChange,
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
      setTimeout(
        () => {
          onSearchRef.current?.(
            keyword.trim()
          );
        },
        SEARCH_DEBOUNCE_MS
      );

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
        placeholder="ค้นหารหัสงวด / ชื่องวด"
        enterButton
        style={{
          flex: "1 1 300px",
          minWidth: 220,
        }}
        onChange={(
          event
        ) => {
          setKeyword(
            event.target
              .value
          );
        }}
        onSearch={(
          value
        ) => {
          onSearchRef.current?.(
            String(
              value || ""
            ).trim()
          );
        }}
      />

      <div
        style={{
          flex: "1 1 230px",
          minWidth: 210,
        }}
      >
        <LazyPayrollPeriodCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      <div
        style={{
          flex: "1 1 230px",
          minWidth: 210,
        }}
      >
        <LazyPayrollPeriodGroupSelect
          value={
            payrollGroupId
          }
          companyId={
            companyId
          }
          placeholder="ทุกกลุ่มเงินเดือน"
          onChange={
            onPayrollGroupChange
          }
        />
      </div>

      <InputNumber
        value={periodYear}
        min={2000}
        max={2200}
        controls={false}
        placeholder="ทุกปี"
        style={{
          width: 120,
        }}
        onChange={
          onPeriodYearChange
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
          minWidth: 150,
        }}
        onChange={
          onStatusChange
        }
      />
    </Flex>
  );
}
