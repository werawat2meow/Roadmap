"use client";

import { MANAGEMENT_LEVELS } from "../utils/scopeUtils";

export default function ManagementSummary({levelGroups,}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

      {MANAGEMENT_LEVELS.map((level) => (
        <div
          key={level}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Management Level
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-800">
                {level}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-lg font-black text-sky-700">
              {levelGroups[level]?.length || 0}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            ทั้งหมด {levelGroups[level]?.length || 0} รายการ
          </p>
        </div>
      ))}
    </div>
  );
}