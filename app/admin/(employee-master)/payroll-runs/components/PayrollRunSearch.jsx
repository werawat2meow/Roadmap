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

import LazyPayrollRunCompanySelect from "./LazyPayrollRunCompanySelect";
import LazyPayrollRunPeriodSelect from "./LazyPayrollRunPeriodSelect";

const RUN_TYPE_OPTIONS = [
  {
    value: "regular",
    label: "Regular",
  },
  {
    value: "adjustment",
    label: "Adjustment",
  },
  {
    value: "bonus",
    label: "Bonus",
  },
  {
    value: "final",
    label: "Final",
  },
];

const STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "prepared",
    label: "Prepared",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function PayrollRunSearch({
  search = "",
  companyId,
  payrollPeriodId,
  runType,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onPeriodChange,
  onRunTypeChange,
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
        400
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
        enterButton
        loading={loading}
        placeholder="ค้นหารหัส Run / ชื่อ Run"
        style={{
          flex: "1 1 280px",
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
          flex: "1 1 220px",
          minWidth: 210,
        }}
      >
        <LazyPayrollRunCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      <div
        style={{
          flex: "1 1 280px",
          minWidth: 230,
        }}
      >
        <LazyPayrollRunPeriodSelect
          value={
            payrollPeriodId
          }
          companyId={
            companyId
          }
          placeholder="ทุกงวดเงินเดือน"
          onChange={
            onPeriodChange
          }
        />
      </div>

      <Select
        allowClear
        value={runType}
        placeholder="ทุกประเภท Run"
        options={
          RUN_TYPE_OPTIONS
        }
        style={{
          minWidth: 150,
        }}
        onChange={
          onRunTypeChange
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
