"use client";

import {
  ArrowRightOutlined,
} from "@ant-design/icons";

export default function EmployeeServiceCard({
  icon,
  title,
  description,
  meta,
  onClick,
}) {
  return (
    <button
      type="button"
      className="group flex min-h-[160px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
          {icon}
        </div>

        <ArrowRightOutlined className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
      </div>

      <div className="mt-4 text-base font-bold text-slate-800">
        {title}
      </div>

      <div className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
        {description}
      </div>

      {meta && (
        <div className="mt-3 text-xs font-medium text-slate-400">
          {meta}
        </div>
      )}
    </button>
  );
}
