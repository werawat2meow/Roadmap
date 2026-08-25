"use client";

import { Select } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  employeeName,
  normalizeApiRows,
  readJsonResponse,
} from "./compensationUi";

const PAGE_SIZE = 20;

function mergeOptions(...groups) {
  const map = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    if (!item?.value) return;
    map.set(String(item.value), item);
  });
  return Array.from(map.values());
}

function toOption(employee) {
  if (!employee?.id) return null;
  const code = employee.employee_code || "-";
  return {
    value: employee.id,
    label: `${code} - ${employeeName(employee)}`,
    employee,
  };
}

export default function LazyEmployeeSelect({
  value,
  onChange,
  disabled = false,
  initialEmployee = null,
  placeholder = "ค้นหารหัส / ชื่อพนักงาน",
}) {
  const initialOption = toOption(initialEmployee);
  const [options, setOptions] = useState(
    initialOption ? [initialOption] : []
  );
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const loadedOnceRef = useRef(false);
  const loadingRef = useRef(false);
  const searchTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!initialOption) return;
    setOptions((current) => mergeOptions(current, initialOption));
  }, [initialEmployee?.id]);

  const loadPage = useCallback(
    async ({ nextPage = 1, search = "", replace = false } = {}) => {
      if (loadingRef.current && !replace) return;

      const requestId = ++requestIdRef.current;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          pageSize: String(PAGE_SIZE),
          search: String(search || "").trim(),
        });

        const response = await fetch(`/api/admin/employees?${params}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error(payload?.error || "ไม่สามารถโหลดพนักงานได้");
        }

        if (requestId !== requestIdRef.current) return;

        const rows = normalizeApiRows(payload);
        const nextOptions = rows.map(toOption).filter(Boolean);
        const total = Number(payload?.pagination?.total ?? payload?.total ?? 0);
        const totalPages = Number(
          payload?.pagination?.totalPages ??
            (total > 0 ? Math.ceil(total / PAGE_SIZE) : 0)
        );

        setOptions((current) =>
          replace
            ? mergeOptions(initialOption, nextOptions)
            : mergeOptions(current, nextOptions)
        );
        setPage(nextPage);
        setHasMore(
          totalPages > 0 ? nextPage < totalPages : rows.length >= PAGE_SIZE
        );
        loadedOnceRef.current = true;
      } catch (error) {
        console.error("LazyEmployeeSelect:", error);
        if (replace) setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [initialEmployee?.id]
  );

  const handleSearch = (text) => {
    setSearchText(text);
    setPage(0);
    setHasMore(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadPage({ nextPage: 1, search: text, replace: true });
    }, 300);
  };

  const handlePopupScroll = (event) => {
    if (loadingRef.current || !hasMore || page <= 0) return;
    const target = event.currentTarget;
    const distance = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distance > 48) return;
    loadPage({ nextPage: page + 1, search: searchText, replace: false });
  };

  return (
    <Select
      showSearch
      allowClear
      value={value}
      disabled={disabled}
      loading={loading}
      options={options}
      filterOption={false}
      searchValue={searchText}
      placeholder={placeholder}
      onChange={(nextValue, option) =>
        onChange?.(nextValue, option?.employee || null)
      }
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      onOpenChange={(open) => {
        if (open && !loadedOnceRef.current) {
          loadPage({ nextPage: 1, search: "", replace: true });
        }
        if (!open && searchText) {
          setSearchText("");
          setPage(0);
          setHasMore(true);
          loadPage({ nextPage: 1, search: "", replace: true });
        }
      }}
      notFoundContent={loading ? "กำลังโหลด..." : "ไม่พบพนักงาน"}
    />
  );
}
