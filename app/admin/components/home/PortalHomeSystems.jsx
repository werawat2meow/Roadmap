"use client";

import {
  Button,
} from "antd";

import {
  AppstoreOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

export default function PortalHomeSystems({
  systems = [],
  onNavigate,
}) {
  if (
    systems.length ===
    0
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {systems
        .slice(0, 9)
        .map(
          (system) => (
            <button
              key={
                system.key
              }
              type="button"
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              onClick={() =>
                onNavigate?.(
                  system.href
                )
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                  <AppstoreOutlined />
                </div>

                <ArrowRightOutlined className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>

              <div className="mt-4 text-base font-bold text-slate-800">
                {system.title}
              </div>

              <div className="mt-1 min-h-[42px] text-sm leading-relaxed text-slate-500">
                {system.description}
              </div>

              <div className="mt-4 text-xs font-semibold text-blue-600">
                {system.menuCount} เมนูที่เข้าถึงได้
              </div>
            </button>
          )
        )}
    </div>
  );
}
