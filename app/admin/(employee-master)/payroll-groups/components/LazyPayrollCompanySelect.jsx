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

/* =========================================================
   Helpers
========================================================= */

function mapOption(
  item
) {
  if (!item) {
    return null;
  }

  /*
   * รองรับ option ที่ page.jsx ส่งมาแล้ว
   *
   * {
   *   value: UUID,
   *   label: "PC001 - บริษัท ABC"
   * }
   */
  if (item.value) {
    return {
      value:
        item.value,

      label:
        item.label ||
        String(
          item.value
        ),
    };
  }

  /*
   * รองรับข้อมูลจาก API
   *
   * {
   *   id,
   *   payroll_company_code,
   *   payroll_company_name
   * }
   */
  if (item.id) {
    const code =
      item.payroll_company_code ||
      "";

    const name =
      item.payroll_company_name ||
      "-";

    return {
      value:
        item.id,

      label:
        code
          ? `${code} - ${name}`
          : name,
    };
  }

  return null;
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
      if (
        item?.value
      ) {
        map.set(
          String(
            item.value
          ),
          item
        );
      }
    }
  );

  return Array.from(
    map.values()
  );
}

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return {};
  }
}

/* =========================================================
   Component
========================================================= */

export default function LazyPayrollCompanySelect({
  value,

  onChange,

  disabled = false,

  placeholder =
    "เลือกบริษัทเงินเดือน",

  style,

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
    hasMore,
    setHasMore,
  ] =
    useState(true);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const debounceRef =
    useRef(null);

  const requestIdRef =
    useRef(0);

  const selectedOptionRef =
    useRef(null);

  /* =========================================================
     Initial Selected Option

     สำคัญ:
     ทำให้ Edit แสดง Label
     แทน UUID
  ========================================================= */

  useEffect(() => {
    const option =
      mapOption(
        initialOption
      );

    if (
      !option?.value
    ) {
      return;
    }

    /*
     * เก็บ selected option
     * ป้องกันหายตอน lazy search
     */
    if (
      String(value) ===
      String(option.value)
    ) {
      selectedOptionRef.current =
        option;
    }

    /*
     * เติม option ที่กำลัง Edit
     * เข้า Select ทันที
     */
    setOptions(
      (prev) =>
        mergeOptions(
          prev,
          [
            option,
          ]
        )
    );
  }, [
    initialOption,
    value,
  ]);

  /* =========================================================
     Clear Selected
  ========================================================= */

  useEffect(() => {
    if (!value) {
      selectedOptionRef.current =
        null;
    }
  }, [
    value,
  ]);

  /* =========================================================
     Cleanup Debounce
  ========================================================= */

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

  /* =========================================================
     Fetch Companies
  ========================================================= */

  async function fetchCompanies({
    nextPage = 1,

    keyword = "",

    replace = false,
  } = {}) {
    const requestId =
      ++requestIdRef.current;

    try {
      setLoading(
        true
      );

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(
          nextPage
        )
      );

      params.set(
        "pageSize",
        String(
          PAGE_SIZE
        )
      );

      if (keyword) {
        params.set(
          "search",
          keyword
        );
      }

      const response =
        await fetch(
          `/api/admin/payroll-companies?${params.toString()}`,
          {
            cache:
              "no-store",
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
            json.message ||
            "ไม่สามารถโหลดบริษัทเงินเดือนได้"
        );
      }

      /*
       * Request เก่า
       * ไม่ให้มาเขียนทับ request ใหม่
       */
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      const rows =
        Array.isArray(
          json.data
        )
          ? json.data
          : [];

      const nextOptions =
        rows
          .map(
            mapOption
          )
          .filter(
            Boolean
          );

      const initialMappedOption =
        mapOption(
          initialOption
        );

      setOptions(
        (prev) => {
          if (replace) {
            const keepOptions =
              [];

            /*
             * เก็บ Initial Option
             * ของ record ที่กำลัง Edit
             */
            if (
              initialMappedOption
                ?.value
            ) {
              keepOptions.push(
                initialMappedOption
              );
            }

            /*
             * เก็บ option ที่ user
             * เลือกอยู่ปัจจุบัน
             */
            if (
              selectedOptionRef
                .current
                ?.value
            ) {
              keepOptions.push(
                selectedOptionRef
                  .current
              );
            }

            return mergeOptions(
              keepOptions,
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

      if (
        totalPages > 0
      ) {
        setHasMore(
          nextPage <
            totalPages
        );
      } else {
        setHasMore(
          rows.length ===
            PAGE_SIZE
        );
      }
    } catch (error) {
      console.error(
        "LOAD_PAYROLL_COMPANIES_ERROR:",
        error
      );

      setHasMore(
        false
      );
    } finally {
      if (
        requestId ===
        requestIdRef.current
      ) {
        setLoading(
          false
        );
      }
    }
  }

  /* =========================================================
     Change
  ========================================================= */

  function handleChange(
    nextValue,
    option
  ) {
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
  }

  /* =========================================================
     Open
  ========================================================= */

  function handleOpenChange(
    open
  ) {
    if (
      open &&
      page === 0 &&
      !loading
    ) {
      fetchCompanies({
        nextPage: 1,

        keyword:
          search,

        replace: true,
      });
    }
  }

  /* =========================================================
     Search
  ========================================================= */

  function handleSearch(
    value
  ) {
    const keyword =
      value.trim();

    setSearch(
      keyword
    );

    setPage(
      0
    );

    setHasMore(
      true
    );

    if (
      debounceRef.current
    ) {
      clearTimeout(
        debounceRef.current
      );
    }

    /*
     * Lazy Search
     * รอหยุดพิมพ์ 300ms
     */
    debounceRef.current =
      setTimeout(
        () => {
          fetchCompanies({
            nextPage: 1,

            keyword,

            replace: true,
          });
        },
        300
      );
  }

  /* =========================================================
     Infinite Scroll
  ========================================================= */

  function handlePopupScroll(
    event
  ) {
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
      fetchCompanies({
        nextPage:
          page + 1,

        keyword:
          search,

        replace:
          false,
      });
    }
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <Select
      value={
        value
      }

      onChange={
        handleChange
      }

      disabled={
        disabled
      }

      showSearch

      allowClear

      placeholder={
        placeholder
      }

      style={
        style || {
          width:
            "100%",
        }
      }

      filterOption={
        false
      }

      options={
        options
      }

      loading={
        loading
      }

      notFoundContent={
        loading
          ? (
              <div
                style={{
                  padding:
                    "8px 0",
                  textAlign:
                    "center",
                }}
              >
                <Spin size="small" />
              </div>
            )
          : null
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
  );
}