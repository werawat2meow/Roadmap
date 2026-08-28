"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Button,
  Flex,
  Select,
  Spin,
  Typography,
} from "antd";

import {
  PlusOutlined,
} from "@ant-design/icons";

const {
  Text,
} = Typography;

const PAGE_SIZE = 20;

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function mapOption(item) {
  return {
    value:
      item.variable_code,

    label:
      `${item.variable_code} - ${item.variable_name}`,

    data_type:
      item.data_type,

    source_type:
      item.source_type,
  };
}

function mergeOptions(
  current,
  next
) {
  const map =
    new Map();

  [
    ...current,
    ...next,
  ].forEach((item) => {
    if (item?.value) {
      map.set(
        String(item.value),
        item
      );
    }
  });

  return Array.from(
    map.values()
  );
}

export default function FormulaVariablePicker({
  companyId,
  disabled = false,
  onInsert,
}) {
  const [
    options,
    setOptions,
  ] =
    useState([]);

  const [
    value,
    setValue,
  ] =
    useState();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(0);

  const [
    hasMore,
    setHasMore,
  ] =
    useState(true);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const debounceRef =
    useRef(null);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    setOptions([]);
    setValue(undefined);
    setSearch("");
    setPage(0);
    setHasMore(true);
  }, [
    companyId,
  ]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(
          debounceRef.current
        );
      }
    };
  }, []);

  async function fetchVariables({
    nextPage = 1,
    keyword = "",
    replace = false,
  } = {}) {
    if (!companyId) {
      return;
    }

    const requestId =
      ++requestIdRef.current;

    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.set(
        "company_id",
        companyId
      );

      params.set(
        "page",
        String(nextPage)
      );

      params.set(
        "pageSize",
        String(PAGE_SIZE)
      );

      if (keyword) {
        params.set(
          "search",
          keyword
        );
      }

      const response =
        await fetch(
          `/api/admin/payroll-formulas/variables?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const json =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            "ไม่สามารถโหลดตัวแปรสูตรได้"
        );
      }

      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      const rows =
        Array.isArray(json.data)
          ? json.data
          : [];

      const nextOptions =
        rows.map(mapOption);

      setOptions((prev) =>
        replace
          ? nextOptions
          : mergeOptions(
              prev,
              nextOptions
            )
      );

      setPage(nextPage);

      const totalPages =
        Number(
          json.pagination
            ?.totalPages ||
            0
        );

      setHasMore(
        totalPages > 0
          ? nextPage <
              totalPages
          : rows.length ===
              PAGE_SIZE
      );
    } catch (error) {
      console.error(
        "LOAD_FORMULA_VARIABLE_PICKER_ERROR:",
        error
      );

      setHasMore(false);
    } finally {
      if (
        requestId ===
        requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }

  function handleOpenChange(
    open
  ) {
    if (
      open &&
      companyId &&
      page === 0 &&
      !loading
    ) {
      fetchVariables({
        nextPage: 1,
        keyword: search,
        replace: true,
      });
    }
  }

  function handleSearch(
    nextSearch
  ) {
    const keyword =
      String(
        nextSearch || ""
      ).trim();

    setSearch(keyword);
    setPage(0);
    setHasMore(true);

    if (debounceRef.current) {
      clearTimeout(
        debounceRef.current
      );
    }

    debounceRef.current =
      setTimeout(() => {
        fetchVariables({
          nextPage: 1,
          keyword,
          replace: true,
        });
      }, 300);
  }

  function handlePopupScroll(
    event
  ) {
    const target =
      event.currentTarget;

    const nearBottom =
      target.scrollTop +
        target.clientHeight >=
      target.scrollHeight - 24;

    if (
      nearBottom &&
      hasMore &&
      !loading &&
      page > 0
    ) {
      fetchVariables({
        nextPage:
          page + 1,

        keyword:
          search,
      });
    }
  }

  return (
    <div>
      <Flex
        gap={8}
        wrap="wrap"
        align="center"
      >
        <Select
          showSearch
          allowClear
          filterOption={false}
          disabled={
            disabled ||
            !companyId
          }
          value={value}
          placeholder={
            companyId
              ? "เลือกตัวแปรที่ต้องการแทรกในสูตร"
              : "เลือกบริษัทก่อน"
          }
          options={options}
          loading={loading}
          notFoundContent={
            loading
              ? (
                  <Spin size="small" />
                )
              : null
          }
          style={{
            flex: "1 1 360px",
            minWidth: 260,
          }}
          onChange={
            setValue
          }
          onOpenChange={
            handleOpenChange
          }
          onSearch={
            handleSearch
          }
          onPopupScroll={
            handlePopupScroll
          }
        />

        <Button
          icon={
            <PlusOutlined />
          }
          disabled={
            disabled ||
            !value
          }
          onClick={() => {
            if (!value) {
              return;
            }

            onInsert?.(
              value
            );

            setValue(undefined);
          }}
        >
          แทรกตัวแปร
        </Button>
      </Flex>

      <Text
        type="secondary"
        style={{
          display: "block",
          marginTop: 6,
        }}
      >
        ตัวแปรมาจากหน้า “ตัวแปรสูตรคำนวณ”
        และจะแสดงเฉพาะบริษัทที่เลือก
      </Text>
    </div>
  );
}
