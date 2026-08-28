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

import LazyTaxRateCompanySelect from "./LazyTaxRateCompanySelect";

const METHOD_OPTIONS = [
  {
    value:
      "progressive",
    label:
      "Progressive",
  },
  {
    value:
      "flat",
    label:
      "Flat Rate",
  },
];

const STATUS_OPTIONS = [
  {
    value:
      "active",
    label:
      "Active",
  },
  {
    value:
      "inactive",
    label:
      "Inactive",
  },
];

const DEFAULT_OPTIONS = [
  {
    value:
      "true",
    label:
      "Default เท่านั้น",
  },
  {
    value:
      "false",
    label:
      "ไม่ใช่ Default",
  },
];

export default function TaxRateSearch({
  search = "",
  companyId,
  taxYear,
  calculationMethod,
  status,
  isDefault,
  loading = false,
  onSearch,
  onCompanyChange,
  onTaxYearChange,
  onCalculationMethodChange,
  onStatusChange,
  onDefaultChange,
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
      <Input.Search
        value={keyword}
        allowClear
        enterButton
        loading={loading}
        placeholder="ค้นหารหัส / ชุดอัตราภาษี"
        style={{
          flex:
            "1 1 280px",
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
          flex:
            "1 1 230px",
          minWidth: 210,
        }}
      >
        <LazyTaxRateCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      <InputNumber
        value={taxYear}
        min={2000}
        max={2200}
        controls={false}
        placeholder="ทุกปีภาษี"
        style={{
          width: 130,
        }}
        onChange={
          onTaxYearChange
        }
      />

      <Select
        allowClear
        value={
          calculationMethod
        }
        placeholder="ทุกวิธีคำนวณ"
        options={
          METHOD_OPTIONS
        }
        style={{
          minWidth: 160,
        }}
        onChange={
          onCalculationMethodChange
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
          minWidth: 130,
        }}
        onChange={
          onStatusChange
        }
      />

      <Select
        allowClear
        value={isDefault}
        placeholder="Default / ทั้งหมด"
        options={
          DEFAULT_OPTIONS
        }
        style={{
          minWidth: 160,
        }}
        onChange={
          onDefaultChange
        }
      />
    </Flex>
  );
}
