"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Select,
  Spin,
  Tag,
} from "antd";

const PAGE_SIZE = 20;

function mapOption(item) {
  if (!item) return null;

  if (item.value) {
    return {
      value: item.value,
      label:
        item.label ||
        String(item.value),
    };
  }

  if (!item.id) return null;

  const group =
    item.payroll_groups;

  const groupText =
    group
      ? `${
          group.payroll_group_code ||
          ""
        } ${
          group.payroll_group_name ||
          ""
        }`.trim()
      : "";

  return {
    value:
      item.id,

    label:
      `${item.period_code || "-"} - ${item.period_name || "-"}${groupText ? ` | ${groupText}` : ""} [${item.status || "-"}]`,
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
  ].forEach(
    (item) => {
      if (item?.value) {
        map.set(
          String(
            item.value
          ),
          item
        );
      }
    }
  );

  return [
    ...map.values(),
  ];
}

async function readJson(
  response
) {
  const text =
    await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function LazyPayrollRunPeriodSelect({
  value,
  companyId,
  onChange,
  disabled = false,
  allowClear = true,
  placeholder = "เลือกงวดเงินเดือน",
  initialOption = null,
}) {
  const [
    options,
    setOptions,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    page,
    setPage,
  ] =
    useState(0);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    hasMore,
    setHasMore,
  ] =
    useState(true);

  const debounceRef =
    useRef(null);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    requestIdRef.current +=
      1;

    setPage(0);
    setSearch("");
    setHasMore(true);

    const initial =
      mapOption(
        initialOption
      );

    setOptions(
      initial
        ? [initial]
        : []
    );
  }, [
    companyId,
    initialOption,
  ]);

  useEffect(() => {
    return () => {
      if (
        debounceRef.current
      ) {
        clearTimeout(
          debounceRef.current
        );
      }
    };
  }, []);

  async function load({
    nextPage = 1,
    keyword = "",
    replace = false,
  } = {}) {
    if (!companyId) {
      setOptions([]);
      return;
    }

    const requestId =
      ++requestIdRef.current;

    try {
      setLoading(true);

      const params =
        new URLSearchParams({
          page:
            String(
              nextPage
            ),
          pageSize:
            String(
              PAGE_SIZE
            ),
          company_id:
            String(
              companyId
            ),
        });

      if (keyword) {
        params.set(
          "search",
          keyword
        );
      }

      const response =
        await fetch(
          `/api/admin/payroll-runs/periods?${params.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const json =
        await readJson(
          response
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
          "ไม่สามารถโหลดงวดเงินเดือนได้"
        );
      }

      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      const nextOptions =
        (
          json.data || []
        )
          .map(mapOption)
          .filter(Boolean);

      const initial =
        mapOption(
          initialOption
        );

      setOptions(
        (prev) =>
          replace
            ? mergeOptions(
                initial
                  ? [initial]
                  : [],
                nextOptions
              )
            : mergeOptions(
                prev,
                nextOptions
              )
      );

      setPage(
        nextPage
      );

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
          : nextOptions.length ===
            PAGE_SIZE
      );
    } catch (error) {
      console.error(
        "LOAD_PAYROLL_RUN_PERIODS_ERROR:",
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

  function handleSearch(
    value
  ) {
    const keyword =
      String(
        value || ""
      ).trim();

    setSearch(keyword);
    setPage(0);
    setHasMore(true);

    if (
      debounceRef.current
    ) {
      clearTimeout(
        debounceRef.current
      );
    }

    debounceRef.current =
      setTimeout(
        () => {
          load({
            nextPage: 1,
            keyword,
            replace: true,
          });
        },
        300
      );
  }

  return (
    <Select
      value={value}
      disabled={
        disabled ||
        !companyId
      }
      allowClear={
        allowClear
      }
      showSearch
      filterOption={
        false
      }
      placeholder={
        companyId
          ? placeholder
          : "เลือกบริษัทก่อน"
      }
      options={
        options
      }
      loading={
        loading
      }
      style={{
        width:
          "100%",
      }}
      notFoundContent={
        loading
          ? <Spin size="small" />
          : null
      }
      onOpenChange={(
        open
      ) => {
        if (
          open &&
          page === 0 &&
          !loading &&
          companyId
        ) {
          load({
            nextPage: 1,
            keyword: search,
            replace: true,
          });
        }
      }}
      onSearch={
        handleSearch
      }
      onChange={
        onChange
      }
      onPopupScroll={(
        event
      ) => {
        const target =
          event.currentTarget;

        const nearBottom =
          target.scrollTop +
            target.clientHeight >=
          target.scrollHeight -
            24;

        if (
          nearBottom &&
          hasMore &&
          !loading &&
          page > 0
        ) {
          load({
            nextPage:
              page + 1,
            keyword:
              search,
          });
        }
      }}
    />
  );
}
