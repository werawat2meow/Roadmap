"use client";

import { Tooltip } from "antd";

export default function DepartmentBranchBadges({ names = [] }) {
  const show = 4;
  const visible = names.slice(0, show);
  const hidden = names.slice(show);

  if (!names.length) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-slate-400 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          {name}
        </span>
      ))}

      {hidden.length > 0 && (
        <Tooltip
          title={
            <div className="flex flex-col gap-1 py-0.5">
              {hidden.map((name) => (
                <div key={name} className="flex items-center gap-2 text-[11px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {name}
                </div>
              ))}
            </div>
          }
          placement="top"
          color="#0f172a"
        >
          <span className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            +{hidden.length} more
          </span>
        </Tooltip>
      )}
    </div>
  );
}
