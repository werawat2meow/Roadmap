"use client";

import { Card, Button, Tag } from "antd";

export default function BenefitMenuCard({ item, onClick }) {
  return (
    <Card
      hoverable
      variant="borderless"
      onClick={onClick}
      className="h-full cursor-pointer rounded-[24px] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
            {item.icon}
          </div>

          <Tag className="m-0 rounded-full border-0 bg-slate-100 px-3 py-1 text-slate-600">
            {item.tag}
          </Tag>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
          <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
            {item.desc}
          </p>
        </div>

        <Button
          block
          className="mt-5 !h-11 !rounded-xl !border-emerald-100 !bg-emerald-50 !font-semibold !text-emerald-700"
        >
          เข้าจัดการ
        </Button>
      </div>
    </Card>
  );
}