"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Select, Spin } from "antd";

const PAGE_SIZE = 20;

function useDebouncedCallback(callback, delay) {
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

function mergeUnique(current = [], incoming = []) {
  const map = new Map();

  [...current, ...incoming].forEach((item) => {
    if (!item?.id) return;
    map.set(String(item.id), item);
  });

  return Array.from(map.values());
}

export default function PositionLazySelect({
  value,
  onChange,
  disabled = false,
  className = "w-full",
}) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const requestIdRef = useRef(0);
  const keywordRef = useRef("");
  const selectedRef = useRef(null);

  const fetchPositions = useCallback(
    async (keyword = "", nextPage = 1, append = false) => {
      const requestId = ++requestIdRef.current;

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();

        if (keyword.trim()) {
          params.set("search", keyword.trim());
        }

        params.set("page", String(nextPage));
        params.set("pageSize", String(PAGE_SIZE));

        const response = await fetch(
          `/api/admin/employee-organization/positions?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "ไม่สามารถโหลดตำแหน่งได้"
          );
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        const rows = Array.isArray(result?.data)
          ? result.data
          : [];

        setPositions((current) => {
          if (append) {
            return mergeUnique(current, rows);
          }

          const selected = selectedRef.current;
          const preserve =
            selected?.id && String(selected.id) === String(value || "")
              ? [selected]
              : [];

          return mergeUnique(preserve, rows);
        });

        setPage(nextPage);

        const totalPages = Number(
          result?.pagination?.totalPages || 1
        );

        setHasMore(nextPage < totalPages);
      } catch (error) {
        console.error("LOAD_EMPLOYEE_ORG_POSITIONS_ERROR", error);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [value]
  );

  const debouncedSearch = useDebouncedCallback((keyword) => {
    keywordRef.current = keyword;
    setPage(1);
    setHasMore(true);
    fetchPositions(keyword, 1, false);
  }, 300);

  useEffect(() => {
    fetchPositions("", 1, false);
  }, [fetchPositions]);

  useEffect(() => {
    if (!value) {
      selectedRef.current = null;
    }
  }, [value]);

  const handlePopupScroll = (event) => {
    const target = event.currentTarget;

    const nearBottom =
      target.scrollTop + target.clientHeight >=
      target.scrollHeight - 24;

    if (!nearBottom || !hasMore || loading || loadingMore) {
      return;
    }

    fetchPositions(keywordRef.current, page + 1, true);
  };

  return (
    <Select
      allowClear
      showSearch
      className={className}
      value={value || undefined}
      disabled={disabled}
      loading={loading}
      placeholder="ตำแหน่ง"
      filterOption={false}
      onSearch={debouncedSearch}
      onPopupScroll={handlePopupScroll}
      onChange={(nextValue, option) => {
        if (nextValue) {
          const selected = positions.find(
            (item) => String(item.id) === String(nextValue)
          );

          selectedRef.current = selected || null;
        } else {
          selectedRef.current = null;
        }

        onChange?.(nextValue || "", option);
      }}
      notFoundContent={loading ? <Spin size="small" /> : "ไม่พบข้อมูล"}
      popupRender={(menu) => (
        <>
          {menu}
          {loadingMore && (
            <div style={{ textAlign: "center", padding: 8 }}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}
      options={positions.map((item) => ({
        value: item.id,
        label: item.position_code
          ? `${item.position_code} - ${item.position_name || "-"}`
          : item.position_name || "-",
      }))}
    />
  );
}
