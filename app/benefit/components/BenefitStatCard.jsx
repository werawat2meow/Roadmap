"use client";

import { Card } from "antd";

export default function BenefitStatCard({
  title,
  value,
  suffix,
  icon,
  gradient = "from-emerald-500 to-green-500",
}) {
  return (
    <Card
      variant="borderless"
      className="overflow-hidden rounded-[24px] shadow-sm"
      styles={{ body: { padding: 0 } }}
    >
      <div
        className={`bg-gradient-to-br ${gradient} p-5 text-white`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-white/80">
              {title}
            </div>

            <div className="mt-3 text-3xl font-bold">
              {value}

              {suffix && (
                <span className="ml-2 text-base font-medium text-white/80">
                  {suffix}
                </span>
              )}
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}