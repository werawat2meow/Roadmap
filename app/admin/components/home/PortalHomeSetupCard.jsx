"use client";

import {
  Button,
} from "antd";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

export default function PortalHomeSetupCard({
  canView,
  onNavigate,
}) {
  if (!canView) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
          <CheckCircleOutlined />
        </div>

        <div className="min-w-0">
          <div className="text-base font-bold text-slate-800">
            Setup Center
          </div>

          <div className="mt-1 text-sm leading-relaxed text-slate-500">
            ตรวจลำดับการตั้งค่าและความพร้อมของ Master,
            Organization, Payroll, Compensation, Tax
            และข้อมูลพนักงานแบบละเอียด
          </div>
        </div>
      </div>

      <Button
        type="primary"
        ghost
        className="!mt-5"
        onClick={() =>
          onNavigate?.(
            "/admin/setup-center"
          )
        }
      >
        เปิด Setup Center
        <ArrowRightOutlined />
      </Button>
    </div>
  );
}
