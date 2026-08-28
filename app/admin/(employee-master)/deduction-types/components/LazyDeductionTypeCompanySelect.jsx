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
  if (!item) return null;

  if (item.value) {
    return {
      value: item.value,
      label: item.label || String(item.value),
    };
  }

  if (!item.id) return null;

  const name =
    item.company_name_th ||
    item.company_name_en ||
    "-";

  return {
    value: item.id,
    label: item.company_code
      ? `${item.company_code} - ${name}`
      : name,
  };
}

function mergeOptions(current, next) {
  const map = new Map();

  [...current, ...next].forEach((item) => {
    if (item?.value) {
      map.set(String(item.value), item);
    }
  });

  return Array.from(map.values());
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function LazyDeductionTypeCompanySelect({
  value,
  onChange,
  disabled = false,
  allowClear = true,
  placeholder = "เลือกบริษัท",
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
    const option = mapOption(initialOption);

    if (!option?.value) return;

    if (String(value) === String(option.value)) {
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
        `/api/admin/deduction-types/companies?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json =
        await readJsonResponse(response);

      if (!response.ok || !json.success) {
        throw new Error(
          json.error ||
            "ไม่สามารถโหลดบริษัทได้"
        );
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      const rows = Array.isArray(json.data)
        ? json.data
        : [];

      const nextOptions = rows
        .map(mapOption)
        .filter(Boolean);

      const initialMapped =
        mapOption(initialOption);

      setOptions((prev) => {
        if (replace) {
          const keep = [];

          if (initialMapped?.value) {
            keep.push(initialMapped);
          }

          if (
            selectedOptionRef.current?.value
          ) {
            keep.push(
              selectedOptionRef.current
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
      });

      setPage(nextPage);

      const totalPages = Number(
        json.pagination?.totalPages || 0
      );

      setHasMore(
        totalPages > 0
          ? nextPage < totalPages
          : rows.length === PAGE_SIZE
      );
    } catch (error) {
      console.error(
        "LOAD_DEDUCTION_TYPE_COMPANIES_ERROR:",
        error
      );

      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleChange(
    nextValue,
    option
  ) {
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
    const keyword = String(
      value || ""
    ).trim();

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
      target.scrollTop +
        target.clientHeight >=
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
      allowClear={allowClear}
      showSearch
      filterOption={false}
      placeholder={placeholder}
      options={options}
      loading={loading}
      notFoundContent={
        loading
          ? <Spin size="small" />
          : null
      }
      style={{
        width: "100%",
      }}
      onOpenChange={handleOpenChange}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
    />
  );
}
