"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select, Spin, Typography } from "antd";

const { Text } = Typography;
const PAGE_SIZE = 20;
const SEARCH_DELAY = 300;

function normalizeItem(item = {}) {
  return {
    id: item.id || item.employee_id || null,
    employee_code: item.employee_code || "",
    employee_name: item.employee_name || item.name || "-",
    position_name: item.position_name || "",
    job_name: item.job_name || "",
    management_level: item.management_level || "",
    company_id: item.company_id || null,
    branch_group_id: item.branch_group_id || null,
    branch_id: item.branch_id || null,
    department_id: item.department_id || null,
    division_id: item.division_id || null,
    unit_id: item.unit_id || null,
  };
}

function mergeUnique(current = [], incoming = []) {
  const map = new Map();

  [...current, ...incoming].forEach((item) => {
    const normalized = normalizeItem(item);
    if (normalized.id) {
      map.set(String(normalized.id), normalized);
    }
  });

  return Array.from(map.values());
}

function optionLabel(item) {
  const parts = [
    item.employee_code,
    item.employee_name,
    item.position_name || item.job_name,
    item.management_level,
  ].filter(Boolean);

  return parts.join(" • ");
}

export default function EmployeeBusinessStructureEmployeeSelect({
  value,
  onChange,
  disabled = false,
  action = "view",
  managementLevel = "",
  excludeEmployeeId = "",
  availableOnly = false,
  initialOption = null,
  placeholder = "ค้นหารหัสหรือชื่อพนักงาน",
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const requestIdRef = useRef(0);

  const normalizedInitial = useMemo(
    () => (initialOption?.id ? normalizeItem(initialOption) : null),
    [initialOption]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DELAY);

    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async ({ nextPage = 1, append = false } = {}) => {
      if (disabled && !value) {
        return;
      }

      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", String(nextPage));
        params.set("pageSize", String(PAGE_SIZE));
        params.set("action", action || "view");
        params.set("management_only", "true");

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        if (managementLevel) {
          params.set("management_level", managementLevel);
        }

        if (excludeEmployeeId) {
          params.set("exclude_employee_id", excludeEmployeeId);
        }

        if (availableOnly) {
          params.set("available_only", "true");
        }

        const response = await fetch(
          `/api/admin/employee-business-structure/employees?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.error || "ไม่สามารถโหลดรายชื่อพนักงานได้");
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        const incoming = Array.isArray(result?.data) ? result.data : [];
        const totalPages = Number(result?.pagination?.totalPages || 0);

        setRows((current) => {
          let base = append ? current : [];

          if (normalizedInitial) {
            base = mergeUnique(base, [normalizedInitial]);
          }

          return mergeUnique(base, incoming);
        });

        setPage(nextPage);
        setHasMore(totalPages > nextPage);
      } catch (error) {
        console.error("EMPLOYEE_BUSINESS_STRUCTURE_EMPLOYEE_SELECT_ERROR:", error);

        if (!append) {
          setRows(normalizedInitial ? [normalizedInitial] : []);
        }

        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, [
      action,
      availableOnly,
      debouncedSearch,
      disabled,
      excludeEmployeeId,
      managementLevel,
      normalizedInitial,
      value,
    ]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load({ nextPage: 1, append: false });
  }, [load]);

  useEffect(() => {
    if (!normalizedInitial) return;
    setRows((current) => mergeUnique(current, [normalizedInitial]));
  }, [normalizedInitial]);

  const options = useMemo(
    () =>
      rows.map((item) => ({
        value: item.id,
        label: optionLabel(item),
        raw: item,
      })),
    [rows]
  );

  const handlePopupScroll = useCallback(
    (event) => {
      const target = event.currentTarget;
      if (!target || loading || !hasMore) return;

      const nearBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 24;

      if (nearBottom) {
        load({ nextPage: page + 1, append: true });
      }
    },
    [hasMore, load, loading, page]
  );

  return (
    <Select
      showSearch
      allowClear
      value={value || undefined}
      disabled={disabled}
      placeholder={placeholder}
      filterOption={false}
      onSearch={setSearch}
      onPopupScroll={handlePopupScroll}
      options={options}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : "ไม่พบข้อมูล"}
      onChange={(nextValue, option) => {
        const selected = option?.raw || null;
        onChange?.(nextValue, selected);
      }}
      optionRender={(option) => {
        const item = option?.data?.raw || {};

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Text strong>
              {item.employee_code ? `${item.employee_code} - ` : ""}
              {item.employee_name || "-"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {[item.position_name || item.job_name, item.management_level]
                .filter(Boolean)
                .join(" • ") || "-"}
            </Text>
          </div>
        );
      }}
    />
  );
}
