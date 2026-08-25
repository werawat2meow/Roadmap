"use client";

import { Select } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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

function toOption(item) {
  if (!item?.id) return null;

  return {
    value: item.id,
    label: item.name || item.structure_name || item.id,
    structure: item,
  };
}

export default function LazySalaryStructureSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "เลือกแถบเงินเดือนตามระดับตำแหน่ง",
}) {
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const loadedOnceRef = useRef(false);
  const loadingRef = useRef(false);
  const searchTimerRef = useRef(null);
  const requestIdRef = useRef(0);

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
        });

        const keyword = String(search || "").trim();
        if (keyword) {
          params.set("search", keyword);
        }

        const response = await fetch(
          `/api/admin/salary-structures?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            payload?.error || "ไม่สามารถโหลดแถบเงินเดือนได้"
          );
        }

        if (requestId !== requestIdRef.current) return;

        const rows = normalizeApiRows(payload);
        const nextOptions = rows.map(toOption).filter(Boolean);

        const total = Number(
          payload?.pagination?.total ?? payload?.total ?? 0
        );

        const totalPages = Number(
          payload?.pagination?.totalPages ??
            (total > 0 ? Math.ceil(total / PAGE_SIZE) : 0)
        );

        setOptions((current) =>
          replace
            ? mergeOptions(
                current.find(
                  (option) => String(option.value) === String(value || "")
                ),
                nextOptions
              )
            : mergeOptions(current, nextOptions)
        );

        setPage(nextPage);
        setHasMore(
          totalPages > 0
            ? nextPage < totalPages
            : rows.length >= PAGE_SIZE
        );
        loadedOnceRef.current = true;
      } catch (error) {
        console.error("LazySalaryStructureSelect:", error);
        if (replace) setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [value]
  );

  const loadSelectedById = useCallback(
    async (selectedId) => {
      if (!selectedId) return;

      const alreadyLoaded = options.some(
        (option) => String(option.value) === String(selectedId)
      );
      if (alreadyLoaded) return;

      try {
        const response = await fetch(
          `/api/admin/salary-structures/${selectedId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload = await readJsonResponse(response);
        if (!response.ok) return;

        const option = toOption(payload?.data || null);
        if (!option) return;

        setOptions((current) => mergeOptions(current, option));
      } catch (error) {
        console.error("LazySalaryStructureSelect selected:", error);
      }
    },
    [options]
  );

  useEffect(() => {
    if (!value) return;
    loadSelectedById(value);
  }, [value, loadSelectedById]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      requestIdRef.current += 1;
    };
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    setPage(0);
    setHasMore(true);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      loadPage({
        nextPage: 1,
        search: text,
        replace: true,
      });
    }, 300);
  };

  const handlePopupScroll = (event) => {
    if (loadingRef.current || !hasMore || page <= 0) return;

    const target = event.currentTarget;
    const distance =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distance > 48) return;

    loadPage({
      nextPage: page + 1,
      search: searchText,
      replace: false,
    });
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
        onChange?.(nextValue, option?.structure || null)
      }
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      onOpenChange={(open) => {
        if (open && !loadedOnceRef.current) {
          loadPage({
            nextPage: 1,
            search: "",
            replace: true,
          });
        }

        if (!open && searchText) {
          setSearchText("");
          setPage(0);
          setHasMore(true);
          loadPage({
            nextPage: 1,
            search: "",
            replace: true,
          });
        }
      }}
      notFoundContent={loading ? "กำลังโหลด..." : "ไม่พบแถบเงินเดือน"}
    />
  );
}
