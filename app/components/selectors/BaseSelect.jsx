"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Select } from "antd";

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function BaseSelect({
  api,

  value,

  onChange,

  placeholder = "เลือกข้อมูล",

  allowClear = true,

  disabled = false,

  enabled = true,

  showSearch = true,

  size = "large",

  className = "w-full",

  valueField = "id",

  labelField,

  params = {},

  reloadKey = "",

  mode,

  maxTagCount = "responsive",
}) {
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);

  /* =========================
     Query String
  ========================= */

  const queryString = useMemo(() => {
    const search = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        search.append(key, String(value));
      }
    });

    return search.toString();
  }, [params]);

  /* =========================
     Load
  ========================= */

  const load = useCallback(async () => {
    if (!api) return;

    if (!enabled) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);

      const url = queryString
        ? `${api}?${queryString}`
        : api;

      const res = await fetch(url, {
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          json?.error || "Load Error"
        );
      }

      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("BASE_SELECT_ERROR:", err);

      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [api, queryString, enabled]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  /* =========================
     Options
  ========================= */

  const options = useMemo(() => {
    return items.map((item) => ({
      value: item[valueField],

      label:
        typeof labelField === "function"
          ? labelField(item)
          : item[labelField] ??
            item.name ??
            item[valueField],

      item,
    }));
  }, [items, valueField, labelField]);

  /* =========================
     Render
  ========================= */

  return (
    <Select
      size={size}
      mode={mode}
      className={className}
      showSearch={showSearch}
      allowClear={allowClear}
      disabled={disabled || !enabled}
      loading={loading}
      value={
        value === "" ||
        value === null ||
        value === undefined
          ? undefined
          : value
      }
      placeholder={placeholder}
      optionFilterProp="label"
      maxTagCount={maxTagCount}
      options={options}
      filterOption={(input, option) =>
        String(option?.label || "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      onChange={(nextValue) => {
        if (Array.isArray(nextValue)) {
          const selectedItems = options
            .filter((x) =>
              nextValue.includes(x.value)
            )
            .map((x) => x.item);

          onChange?.(
            nextValue,
            selectedItems
          );

          return;
        }

        const selected = options.find(
          (x) => x.value === nextValue
        );

        onChange?.(
          nextValue ?? "",
          selected?.item || null
        );
      }}
    />
  );
}