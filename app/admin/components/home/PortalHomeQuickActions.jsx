"use client";

import {
  Button,
} from "antd";

import {
  CalendarOutlined,
  ImportOutlined,
  PlusOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";

const ACTIONS = [
  {
    key:
      "employee-create",

    title:
      "เพิ่มพนักงาน",

    description:
      "เพิ่มพนักงานใหม่",

    href:
      "/admin/employees",

    permission:
      "ems.employees.create",

    icon:
      <TeamOutlined />,
  },
  {
    key:
      "data-import",

    title:
      "นำเข้าข้อมูล",

    description:
      "นำเข้าข้อมูลแบบ Bulk",

    href:
      "/admin/data-import",

    permission:
      "data.import.view",

    icon:
      <ImportOutlined />,
  },
  {
    key:
      "payroll-period",

    title:
      "สร้างงวดเงินเดือน",

    description:
      "กำหนด Period / Cut-off",

    href:
      "/admin/payroll-periods",

    permission:
      "ems.payroll_periods.create",

    icon:
      <CalendarOutlined />,
  },
  {
    key:
      "payroll-run",

    title:
      "ประมวลผลเงินเดือน",

    description:
      "สร้างหรือดู Payroll Run",

    href:
      "/admin/payroll-runs",

    permission:
      "ems.payroll_runs.view",

    icon:
      <WalletOutlined />,
  },
];

export default function PortalHomeQuickActions({
  can,
  onNavigate,
}) {
  const visible =
    ACTIONS.filter(
      (item) =>
        can(
          item.permission
        )
    );

  if (
    visible.length ===
    0
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {visible.map(
        (item) => (
          <Button
            key={
              item.key
            }
            type="default"
            className="!h-auto !rounded-2xl !border-slate-200 !px-4 !py-4 !text-left"
            onClick={() =>
              onNavigate?.(
                item.href
              )
            }
          >
            <div className="flex w-full items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {item.icon}
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-slate-800">
                  {item.title}
                </div>

                <div className="mt-0.5 text-xs text-slate-400">
                  {item.description}
                </div>
              </div>
            </div>
          </Button>
        )
      )}
    </div>
  );
}
