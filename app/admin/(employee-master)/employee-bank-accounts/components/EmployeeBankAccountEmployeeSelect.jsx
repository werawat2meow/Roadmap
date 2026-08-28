"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Select, Spin } from "antd";

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
  const requestRef = useRef(0);

  const loadRows = useCallback(async (keyword = "") => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: "1",
        pageSize: "20",
      });

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const response = await fetch(
        `/api/admin/employees?${params.toString()}`,
        { cache: "no-store" }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || "ไม่สามารถโหลดรายการพนักงานได้"
        );
      }

      if (requestRef.current !== requestId) return;

      setRows(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      console.error(
        "LOAD_EMPLOYEE_BANK_ACCOUNT_EMPLOYEE_OPTIONS_ERROR:",
        error
      );

      if (requestRef.current === requestId) {
        setRows([]);
      }
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      loadRows(search);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, search, loadRows]);

  const options = useMemo(() => {
    const next = rows.map(toOption);

    if (
      initialEmployee?.id &&
      !next.some(
        (item) => String(item.value) === String(initialEmployee.id)
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
      onOpenChange={setOpen}
      onSearch={setSearch}
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
