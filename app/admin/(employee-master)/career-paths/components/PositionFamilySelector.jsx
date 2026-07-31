"use client";

import { useEffect, useState } from "react";
import { Select, Spin } from "antd";

export default function PositionFamilySelector({
  value,
  onChange,

  disabled = false,

  families = [],
}) {
  const [items, setItems] = useState(families);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (families.length > 0) {
      setItems(families);
      return;
    }

    loadFamilies();
  }, []);

  async function loadFamilies() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/admin/position-families?all=true"
      );

      const json = await res.json();

      if (json.success) {
        setItems(json.data || []);
      }
    } catch (error) {
      console.error(
        "Load Position Families Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      disabled={disabled}
      value={value}
      onChange={onChange}
      placeholder="เลือก Position Family"
      optionFilterProp="label"
      notFoundContent={
        loading ? <Spin size="small" /> : null
      }
      options={items.map((item) => ({
        value: item.id,

        label: `${item.family_code} - ${item.family_name}`,
      }))}
      filterOption={(input, option) =>
        (option?.label || "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    />
  );
}