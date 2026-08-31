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

import LazyPolicyCompanySelect from "./LazyPolicyCompanySelect";

const CATEGORY_OPTIONS = [
  { value: "general", label: "ทั่วไป" },
  { value: "hr", label: "ทรัพยากรบุคคล" },
  { value: "employment", label: "การจ้างงาน" },
  { value: "conduct", label: "จรรยาบรรณ / การปฏิบัติตน" },
  { value: "attendance", label: "เวลาและการปฏิบัติงาน" },
  { value: "leave", label: "การลา" },
  { value: "compensation", label: "ค่าตอบแทน" },
  { value: "benefit", label: "สวัสดิการ" },
  { value: "safety", label: "ความปลอดภัย" },
  { value: "compliance", label: "Compliance" },
  { value: "pdpa", label: "PDPA" },
  { value: "other", label: "อื่น ๆ" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function HrPolicySearch({
  search = "",
  companyId,
  category,
  status,
  loading = false,
  onSearch,
  onCompanyChange,
  onCategoryChange,
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
      }, 400);

    return () =>
      clearTimeout(timer);
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
        placeholder="ค้นหารหัส / ชื่อนโยบาย"
        style={{
          flex: "1 1 280px",
          minWidth: 220,
        }}
        onChange={(event) =>
          setKeyword(
            event.target.value
          )
        }
        onSearch={(value) =>
          onSearchRef.current?.(
            String(
              value || ""
            ).trim()
          )
        }
      />

      <div
        style={{
          flex: "1 1 230px",
          minWidth: 210,
        }}
      >
        <LazyPolicyCompanySelect
          value={companyId}
          placeholder="ทุกบริษัทใน Scope"
          onChange={
            onCompanyChange
          }
        />
      </div>

      <Select
        allowClear
        value={category}
        placeholder="ทุกหมวดหมู่"
        options={
          CATEGORY_OPTIONS
        }
        style={{
          minWidth: 180,
        }}
        onChange={
          onCategoryChange
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
          minWidth: 140,
        }}
        onChange={
          onStatusChange
        }
      />
    </Flex>
  );
}

export {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
};
