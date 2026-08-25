"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Select, Spin } from "antd";

const PAGE_SIZE = 20;

function mapOption(item) {
  return {
    value: item.id,
    label: `${item.payroll_company_code} - ${item.payroll_company_name}`,
  };
}

function mergeOptions(current, next) {
  const map = new Map();

  [...current, ...next].forEach((item) => {
    if (item?.value) {
      map.set(item.value, item);
    }
  });

  return Array.from(map.values());
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function LazyPayrollCompanySelect({
  value,
  onChange,
  disabled = false,
  placeholder = "เลือกบริษัทเงินเดือน",
  style,
  initialOption = null,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const selectedOptionRef = useRef(null);

  useEffect(() => {
    if (!initialOption?.id) return;

    const option = mapOption(initialOption);

    if (value === initialOption.id) {
      selectedOptionRef.current = option;
    }

    setOptions((prev) =>
      mergeOptions(prev, [option])
    );
  }, [initialOption, value]);

  useEffect(() => {
    if (!value) {
      selectedOptionRef.current = null;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  async function fetchCompanies({
    nextPage = 1,
    keyword = "",
    replace = false,
  } = {}) {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(PAGE_SIZE));

      if (keyword) {
        params.set("search", keyword);
      }

      const response = await fetch(
        `/api/admin/payroll-companies?${params.toString()}`
      );

      const json = await readJsonResponse(response);

      if (!response.ok || !json.success) {
        throw new Error(
          json.error ||
            json.message ||
            "ไม่สามารถโหลดบริษัทเงินเดือนได้"
        );
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      const rows = json.data || [];
      const nextOptions = rows.map(mapOption);

      setOptions((prev) =>
        replace
          ? mergeOptions(
              [
                ...(initialOption?.id
                  ? [mapOption(initialOption)]
                  : []),
                ...(selectedOptionRef.current
                  ? [selectedOptionRef.current]
                  : []),
              ],
              nextOptions
            )
          : mergeOptions(prev, nextOptions)
      );

      setPage(nextPage);

      const totalPages = Number(
        json.pagination?.totalPages || 0
      );

      if (totalPages > 0) {
        setHasMore(nextPage < totalPages);
      } else {
        setHasMore(rows.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error(error);
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleChange(nextValue, option) {
    selectedOptionRef.current = nextValue
      ? {
          value: option?.value || nextValue,
          label: option?.label || nextValue,
        }
      : null;

    onChange?.(nextValue, option);
  }

  function handleOpenChange(open) {
    if (open && page === 0 && !loading) {
      fetchCompanies({
        nextPage: 1,
        keyword: search,
        replace: true,
      });
    }
  }

  function handleSearch(value) {
    const keyword = value.trim();

    setSearch(keyword);
    setPage(0);
    setHasMore(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchCompanies({
        nextPage: 1,
        keyword,
        replace: true,
      });
    }, 300);
  }

  function handlePopupScroll(event) {
    const target = event.currentTarget;
    const nearBottom =
      target.scrollTop + target.clientHeight >=
      target.scrollHeight - 24;

    if (
      nearBottom &&
      hasMore &&
      !loading &&
      page > 0
    ) {
      fetchCompanies({
        nextPage: page + 1,
        keyword: search,
      });
    }
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      showSearch
      allowClear
      placeholder={placeholder}
      style={style || { width: "100%" }}
      filterOption={false}
      options={options}
      loading={loading}
      notFoundContent={
        loading ? <Spin size="small" /> : null
      }
      onOpenChange={handleOpenChange}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
    />
  );
}
