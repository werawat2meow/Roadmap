"use client";

import {
  Skeleton,
} from "antd";

import {
  CalendarOutlined,
  SafetyOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";

function StatCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-400">
            {label}
          </div>

          <div className="mt-0.5 text-xl font-bold text-slate-800">
            {value}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs leading-relaxed text-slate-400">
        {description}
      </div>
    </div>
  );
}

export default function PortalHomeOverviewStats({
  loading = false,
  metrics = {},
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <Skeleton
                active
                paragraph={{
                  rows: 1,
                }}
              />
            </div>
          )
        )}
      </div>
    );
  }

  const employee =
    metrics
      ?.employees
      ?.data;

  const periods =
    metrics
      ?.payroll_periods
      ?.data;

  const runs =
    metrics
      ?.payroll_runs
      ?.data;

  const social =
    metrics
      ?.social_security
      ?.data;

  const cards = [];

  if (
    metrics
      ?.employees
      ?.available
  ) {
    cards.push({
      icon:
        <TeamOutlined />,

      label:
        "พนักงานใน Scope",

      value:
        employee
          ?.total ??
        "-",

      description:
        employee
          ?.scope_supported ===
        false
          ? "ยังไม่สามารถอ่าน Employee Scope ได้"
          : `Active ${employee?.active ?? 0} คน`,
    });
  }

  if (
    metrics
      ?.payroll_periods
      ?.available
  ) {
    cards.push({
      icon:
        <CalendarOutlined />,

      label:
        "Payroll Period",

      value:
        periods
          ?.open ??
        0,

      description:
        "งวดสถานะ Open ที่อยู่ใน Company Scope",
    });
  }

  if (
    metrics
      ?.payroll_runs
      ?.available
  ) {
    cards.push({
      icon:
        <WalletOutlined />,

      label:
        "Payroll Run พร้อมทำ",

      value:
        runs
          ?.prepared ??
        0,

      description:
        `Completed ${runs?.completed ?? 0} รายการ`,
    });
  }

  if (
    metrics
      ?.social_security
      ?.available
  ) {
    cards.push({
      icon:
        <SafetyOutlined />,

      label:
        "ประกันสังคม",

      value:
        social
          ?.active ??
        0,

      description:
        `Default Active ${social?.default ?? 0} ชุด`,
    });
  }

  if (
    cards.length ===
    0
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards
        .slice(0, 4)
        .map(
          (
            card,
            index
          ) => (
            <StatCard
              key={`${card.label}-${index}`}
              {...card}
            />
          )
        )}
    </div>
  );
}
