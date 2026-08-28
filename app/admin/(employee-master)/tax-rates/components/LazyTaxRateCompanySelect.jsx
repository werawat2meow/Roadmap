"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Select,
  Spin,
} from "antd";

const PAGE_SIZE = 20;

function mapOption(item) {
  if (!item) {
    return null;
  }

  if (item.value) {
    return {
      value: item.value,
      label:
        item.label ||
        String(item.value),
    };
  }

  if (!item.id) {
    return null;
  }

  const name =
    item.company_name_th ||
    item.company_name_en ||
    "-";

  return {
    value: item.id,

    label:
      item.company_code
        ? `${item.company_code} - ${name}`
        : name,
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

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function LazyTaxRateCompanySelect({
  value,
  onChange,
  disabled = false,
  allowClear = true,
  placeholder = "เลือกบริษัท",
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

  const requestIdRef =
    useRef(0);

  const debounceRef =
    useRef(null);

  const selectedOptionRef =
    useRef(null);

  useEffect(() => {
    const option =
      mapOption(
        initialOption
      );

    if (!option) {
      return;
    }

    if (
      String(value) ===
      String(
        option.value
      )
    ) {
      selectedOptionRef.current =
        option;
    }

    setOptions(
      (prev) =>
        mergeOptions(
          prev,
          [option]
        )
    );
  }, [
    initialOption,
    value,
  ]);

  useEffect(() => {
    if (!value) {
      selectedOptionRef.current =
        null;
    }
  }, [
    value,
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
        });

      if (keyword) {
        params.set(
          "search",
          keyword
        );
      }

      const response =
        await fetch(
          `/api/admin/tax-rates/companies?${params.toString()}`,
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
          "ไม่สามารถโหลดบริษัทได้"
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
          json.data ||
          []
        )
          .map(
            mapOption
          )
          .filter(
            Boolean
          );

      const initial =
        mapOption(
          initialOption
        );

      setOptions(
        (prev) => {
          if (replace) {
            const keep = [];

            if (initial) {
              keep.push(
                initial
              );
            }

            if (
              selectedOptionRef
                .current
            ) {
              keep.push(
                selectedOptionRef
                  .current
              );
            }

            return mergeOptions(
              keep,
              nextOptions
            );
          }

          return mergeOptions(
            prev,
            nextOptions
          );
        }
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
        "LOAD_TAX_RATE_COMPANIES_ERROR:",
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

  return (
    <Select
      value={value}
      disabled={disabled}
      allowClear={
        allowClear
      }
      showSearch
      filterOption={
        false
      }
      placeholder={
        placeholder
      }
      options={
        options
      }
      loading={
        loading
      }
      style={{
        width: "100%",
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
          !loading
        ) {
          load({
            nextPage: 1,
            keyword: search,
            replace: true,
          });
        }
      }}
      onSearch={(
        value
      ) => {
        const keyword =
          String(
            value || ""
          ).trim();

        setSearch(
          keyword
        );

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
      }}
      onChange={(
        nextValue,
        option
      ) => {
        selectedOptionRef.current =
          nextValue
            ? {
                value:
                  option?.value ||
                  nextValue,

                label:
                  option?.label ||
                  nextValue,
              }
            : null;

        onChange?.(
          nextValue,
          option
        );
      }}
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
