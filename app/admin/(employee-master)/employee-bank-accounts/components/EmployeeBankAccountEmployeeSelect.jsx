"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Select, Spin } from "antd";

const PAGE_SIZE = 20;
const LOAD_MORE_OFFSET = 40;

function buildEmployeeName(employee) {
  return [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildEmployeeLabel(employee) {
  if (!employee) return "-";

  const code = employee.employee_code || "";
  const name =
    employee.full_name_th || buildEmployeeName(employee);

  if (code && name) return `${code} - ${name}`;
  return name || code || "-";
}

function toOption(employee) {
  return {
    value: employee.id,
    label: buildEmployeeLabel(employee),
  };
}

function mergeRows(currentRows, nextRows) {
  const map = new Map();

  [...currentRows, ...nextRows].forEach((item) => {
    if (!item?.id) return;
    map.set(String(item.id), item);
  });

  return Array.from(map.values());
}

function getPayloadTotal(payload) {
  const candidates = [
    payload?.total,
    payload?.pagination?.total,
    payload?.meta?.total,
    payload?.summary?.total,
  ];

  for (const value of candidates) {
    const total = Number(value);

    if (Number.isFinite(total) && total >= 0) {
      return total;
    }
  }

  return null;
}

export default function EmployeeBankAccountEmployeeSelect({
  value,
  onChange,
  initialEmployee = null,
  disabled = false,
  allowClear = true,
  placeholder = "ค้นหารหัสหรือชื่อพนักงาน",
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const requestRef = useRef(0);
  const loadingRef = useRef(false);

  const loadRows = useCallback(
    async ({
      keyword = "",
      nextPage = 1,
      append = false,
    } = {}) => {
      if (append && loadingRef.current) {
        return;
      }

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      loadingRef.current = true;

      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(nextPage),
          pageSize: String(PAGE_SIZE),
        });

        const normalizedKeyword = keyword.trim();

        if (normalizedKeyword) {
          params.set("search", normalizedKeyword);
        }

        const response = await fetch(
          `/api/admin/employees?${params.toString()}`,
          { cache: "no-store" }
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "ไม่สามารถโหลดรายการพนักงานได้"
          );
        }

        if (requestRef.current !== requestId) {
          return;
        }

        const nextRows = Array.isArray(payload.data)
          ? payload.data
          : [];

        setRows((currentRows) =>
          append
            ? mergeRows(currentRows, nextRows)
            : nextRows
        );

        setPage(nextPage);

        const total = getPayloadTotal(payload);

        if (total !== null) {
          setHasMore(nextPage * PAGE_SIZE < total);
        } else {
          setHasMore(nextRows.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error(
          "LOAD_EMPLOYEE_BANK_ACCOUNT_EMPLOYEE_OPTIONS_ERROR:",
          error
        );

        if (requestRef.current === requestId) {
          if (!append) {
            setRows([]);
          }

          setHasMore(false);
        }
      } finally {
        if (requestRef.current === requestId) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    []
  );

  /* ---------------------------------------------------------
     เปิด Select / Search ใหม่
     - Reset กลับหน้า 1
     - Debounce 250ms
     - โหลดครั้งละ 20 รายการ
  --------------------------------------------------------- */
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setPage(1);
      setHasMore(true);

      loadRows({
        keyword: search,
        nextPage: 1,
        append: false,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, search, loadRows]);

  /* ---------------------------------------------------------
     Scroll ลงใกล้ท้าย Dropdown
     → โหลดหน้าถัดไปครั้งละ 20 รายการ
  --------------------------------------------------------- */
  const handlePopupScroll = useCallback(
    (event) => {
      const target = event?.currentTarget;

      if (!target || loadingRef.current || !hasMore) {
        return;
      }

      const reachedBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - LOAD_MORE_OFFSET;

      if (!reachedBottom) {
        return;
      }

      loadRows({
        keyword: search,
        nextPage: page + 1,
        append: true,
      });
    },
    [hasMore, loadRows, page, search]
  );

  const options = useMemo(() => {
    const next = rows.map(toOption);

    if (
      initialEmployee?.id &&
      !next.some(
        (item) =>
          String(item.value) ===
          String(initialEmployee.id)
      )
    ) {
      next.unshift(toOption(initialEmployee));
    }

    return next;
  }, [rows, initialEmployee]);

  return (
    <Select
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      options={options}
      open={open}
      filterOption={false}
      loading={loading}
      listHeight={256}
      onOpenChange={setOpen}
      onSearch={setSearch}
      onPopupScroll={handlePopupScroll}
      onChange={onChange}
      notFoundContent={
        loading ? (
          <div className="flex justify-center py-3">
            <Spin size="small" />
          </div>
        ) : undefined
      }
    />
  );
}

export { buildEmployeeLabel };
