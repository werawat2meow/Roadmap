"use client";

import { useEffect, useState } from "react";
import { Select } from "antd";

const { Option } = Select;

export default function PositionLevelSelector({
  value,
  onChange,
  familyId,
  disabled = false,
  allowClear = true,
  placeholder = "เลือกระดับตำแหน่ง",
  style = {
    width: "100%",
  },
}) {
  const [loading, setLoading] = useState(false);

  const [levels, setLevels] = useState([]);

  useEffect(() => {
    if (!familyId) {
      setLevels([]);
      return;
    }

    loadLevels();
  }, [familyId]);

  async function loadLevels() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/position-family-levels?family_id=${familyId}`);
      const json = await res.json();
      if (!json.success) {
        setLevels([]);
        return;
      }
      if (json.success) {
        setLevels(json.data || []);
      }
      const mappedLevels = (json.data || []).map((item) => ({
        id: item.position_levels?.id,
        level_code: item.position_levels?.level_code,
        level_name: item.position_levels?.level_name,
        sort_order: item.position_levels?.sort_order,
      }));

      setLevels(mappedLevels);
    } catch (err) {
      console.error("LOAD_POSITION_LEVELS_ERROR", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      mode="multiple"
      showSearch
      allowClear={allowClear}
      disabled={disabled || !familyId}
      loading={loading}
      value={value}
      style={style}
      placeholder={placeholder}
      optionFilterProp="label"
      onChange={onChange}
      maxTagCount="responsive"
      filterOption={(input, option) =>
        (option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    >
      {levels.map((level) => (
        <Option
          key={level.id}
          value={level.id}
          label={`${level.level_code} - ${level.level_name}`}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span>
              {level.level_code}
            </span>

            <span
              style={{
                color: "#666",
              }}
            >
              {level.level_name}
            </span>
          </div>
        </Option>
      ))}
    </Select>
  );
}