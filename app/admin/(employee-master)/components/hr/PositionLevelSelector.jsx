"use client";

import { useEffect, useState } from "react";

export default function PositionLevelSelector({
  value = [],
  onChange,
  disabled = false,
}) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevels();
  }, []);

  async function loadLevels() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/position-levels", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Load Position Levels failed");
      }

      setLevels(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleLevel(levelId) {
    if (disabled) return;

    const selected = Array.isArray(value) ? value : [];

    if (selected.includes(levelId)) {
      onChange(selected.filter((id) => id !== levelId));
    } else {
      onChange([...selected, levelId]);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {levels.map((level) => {
        const checked = value.includes(level.id);

        return (
          <label
            key={level.id}
            className={`cursor-pointer rounded-2xl border p-4 transition
            ${
              checked
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleLevel(level.id)}
                className="mt-1 h-4 w-4"
              />

              <div className="flex-1">
                <div className="font-semibold text-slate-700">
                  {level.level_code}
                </div>

                <div className="text-sm text-slate-500">
                  {level.level_name}
                </div>

                {(level.salary_min || level.salary_max) && (
                  <div className="mt-2 text-xs text-slate-400">
                    Salary

                    {level.salary_min ?? "-"}

                    {" - "}

                    {level.salary_max ?? "-"}
                  </div>
                )}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}