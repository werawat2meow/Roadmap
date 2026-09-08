"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Tag,
} from "antd";
import {
  ArrowRightOutlined,
  BellOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

function toCount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0
    ? Math.floor(number)
    : 0;
}

export default function DashboardProbationAlert({
  dashboard,
  canViewEmployees = false,
}) {
  const router = useRouter();

  if (!canViewEmployees) {
    return null;
  }

  const probationCount = toCount(
    dashboard?.kpi?.probation
  );

  if (!probationCount) {
    return null;
  }

  return (
    <Card
      data-dashboard-tour="probation-alert"
      className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-xl text-white shadow-sm">
            <BellOutlined />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
              {probationCount > 99
                ? "99+"
                : probationCount}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-bold text-slate-900">
                งานที่ต้องติดตาม: พนักงานทดลองงาน
              </div>
              <Tag color="gold">
                {probationCount.toLocaleString("th-TH")} คน
              </Tag>
            </div>

            <div className="mt-1 text-sm leading-6 text-slate-600">
              พนักงานใน Scope ของคุณยังอยู่ในสถานะทดลองงาน ควรตรวจสอบการประเมินและการยืนยันสถานะตาม Policy ของบริษัท
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
              <ClockCircleOutlined />
              <span>
                การแจ้งเตือนรอบนี้อ้างอิงสถานะ PROBATION ที่ Dashboard มีอยู่แล้ว
              </span>
            </div>
          </div>
        </div>

        <Button
          type="primary"
          onClick={() => router.push("/admin/employees")}
          icon={<ArrowRightOutlined />}
          iconPlacement="end"
          className="shrink-0"
        >
          ดูพนักงานทดลองงาน
        </Button>
      </div>
    </Card>
  );
}
