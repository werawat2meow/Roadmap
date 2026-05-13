"use client";

import { Card, Tag } from "antd";
import {
  CheckCircleOutlined,
  GiftOutlined,
} from "@ant-design/icons";

export default function BenefitCard({
  title,
  description,
  category,
  quota,
  frequency,
  active = true,
}) {
  return (
    <Card
      variant="borderless"
      className="rounded-[24px] shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
          <GiftOutlined />
        </div>

        <Tag
          className={`m-0 rounded-full border-0 ${
            active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </Tag>
      </div>

      <h3 className="text-lg font-bold text-slate-800">
        {title || "-"}
      </h3>

      <p className="mt-1 min-h-[42px] text-sm text-slate-500">
        {description || "-"}
      </p>

      <div className="mt-4 space-y-2">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
          <span className="text-slate-400">
            ประเภท:
          </span>{" "}
          <span className="font-semibold text-slate-700">
            {category || "-"}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
          <span className="text-slate-400">
            Quota:
          </span>{" "}
          <span className="font-semibold text-slate-700">
            {quota || "-"}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
          <span className="text-slate-400">
            รอบการใช้สิทธิ์:
          </span>{" "}
          <span className="font-semibold text-slate-700">
            {frequency || "-"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
        <CheckCircleOutlined />
        <span>สามารถใช้งานได้</span>
      </div>
    </Card>
  );
}