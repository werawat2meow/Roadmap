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

import LazySocialSecurityCompanySelect from "./LazySocialSecurityCompanySelect";

const SCHEME_OPTIONS = [
  {
    value:
      "section_33",
    label:
      "มาตรา 33",
  },
  {
    value:
      "section_39",
    label:
      "มาตรา 39",
  },
  {
    value:
      "section_40",
    label:
      "มาตรา 40",
  },
  {
    value:
      "custom",
    label:
      "Custom",
  },
];

const METHOD_OPTIONS = [
  {
    value:
      "percentage",
    label:
      "Percentage",
  },
  {
    value:
      "fixed",
    label:
      "Fixed",
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

export default function SocialSecuritySearch({
  search = "",
  companyId,
  schemeType,
  method,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onSchemeChange,
  onMethodChange,
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
        placeholder="ค้นหารหัส / ชื่อการตั้งค่า"
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
        <LazySocialSecurityCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      <Select
        allowClear
        value={schemeType}
        placeholder="ทุกประเภท"
        options={
          SCHEME_OPTIONS
        }
        style={{
          minWidth: 150,
        }}
        onChange={
          onSchemeChange
        }
      />

      <Select
        allowClear
        value={method}
        placeholder="ทุกวิธีคำนวณ"
        options={
          METHOD_OPTIONS
        }
        style={{
          minWidth: 150,
        }}
        onChange={
          onMethodChange
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
    </Flex>
  );
}
