"use client";

import { useEffect, useState } from "react";

export default function PositionFamilySelect({
  value = "",
  onChange,
  disabled = false,
  allowClear = true,
}) {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilies();
  }, []);

  async function loadFamilies() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/position-families", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Load Position Families failed");
      }

      setFamilies(json.data || []);
    } catch (err) {
      console.error("LOAD_POSITION_FAMILIES_ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
    );
  }

  return (
    <select
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
    >
      {allowClear && (
        <option value="">
          -- เลือก Position Family --
        </option>
      )}

      {families.map((family) => (
        <option
          key={family.id}
          value={family.id}
        >
          {family.family_code
            ? `${family.family_code} - ${family.family_name}`
            : family.family_name}
        </option>
      ))}
    </select>
  );
}