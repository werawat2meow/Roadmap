"use client";

import {
  Button,
  Empty,
  Skeleton,
} from "antd";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  SafetyOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";

function ActionCard({
  icon,
  title,
  description,
  href,
  level = "info",
  onNavigate,
}) {
  const levelClass =
    level === "warning"
      ? "border-amber-200 bg-amber-50/70"
      : level === "success"
        ? "border-emerald-200 bg-emerald-50/70"
        : "border-slate-200 bg-white";

  return (
    <div
      className={`flex min-h-[150px] flex-col rounded-2xl border p-5 shadow-sm ${levelClass}`}
    >
      <div className="text-xl text-slate-700">
        {icon}
      </div>

      <div className="mt-3 text-base font-bold text-slate-800">
        {title}
      </div>

      <div className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
        {description}
      </div>

      <Button
        type="link"
        className="!mt-2 !h-auto !p-0"
        onClick={() =>
          onNavigate?.(
            href
          )
        }
      >
        ไปดำเนินการ
        <ArrowRightOutlined />
      </Button>
    </div>
  );
}

export default function PortalHomeRecommendedActions({
  loading = false,
  metrics = {},
  can,
  onNavigate,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Skeleton
                active
                paragraph={{
                  rows: 2,
                }}
              />
            </div>
          )
        )}
      </div>
    );
  }

  const actions = [];

  const employees =
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

  const tax =
    metrics
      ?.tax_rates
      ?.data;

  const social =
    metrics
      ?.social_security
      ?.data;

  if (
    can(
      "ems.employees.view"
    ) &&
    employees &&
    Number(
      employees.total ||
      0
    ) === 0
  ) {
    actions.push({
      icon:
        <TeamOutlined />,
      title:
        "ยังไม่มีข้อมูลพนักงาน",
      description:
        "เพิ่มพนักงานใหม่หรือนำเข้าข้อมูลก่อนเริ่ม Workflow อื่น",
      href:
        can(
          "ems.employees.create"
        )
          ? "/admin/employees"
          : "/admin/data-import",
      level:
        "warning",
    });
  }

  if (
    can(
      "ems.payroll_runs.edit"
    ) &&
    Number(
      runs?.prepared ||
      0
    ) > 0
  ) {
    actions.push({
      icon:
        <DollarOutlined />,
      title:
        `มี Payroll Run พร้อมประมวลผล ${runs.prepared} รายการ`,
      description:
        "มี Payroll Run สถานะ Prepared ที่พร้อมเข้าสู่ขั้นตอน Process",
      href:
        "/admin/payroll-runs",
      level:
        "warning",
    });
  } else if (
    can(
      "ems.payroll_runs.create"
    ) &&
    Number(
      periods?.open ||
      0
    ) > 0
  ) {
    actions.push({
      icon:
        <DollarOutlined />,
      title:
        `มีงวดเงินเดือน Open ${periods.open} งวด`,
      description:
        "สร้าง Payroll Run จากงวดที่เปิดอยู่เพื่อเริ่มประมวลผลเงินเดือน",
      href:
        "/admin/payroll-runs",
      level:
        "info",
    });
  }

  if (
    can(
      "ems.tax_rates.view"
    ) &&
    tax &&
    Number(
      tax.active ||
      0
    ) === 0
  ) {
    actions.push({
      icon:
        <WarningOutlined />,
      title:
        "ยังไม่มีอัตราภาษี Active",
      description:
        "ตรวจสอบ Tax Rate Set และ Effective Date ก่อนเชื่อม Payroll Calculation",
      href:
        "/admin/tax-rates",
      level:
        "warning",
    });
  }

  if (
    can(
      "ems.social_security.view"
    ) &&
    social &&
    Number(
      social.active ||
      0
    ) === 0
  ) {
    actions.push({
      icon:
        <SafetyOutlined />,
      title:
        "ยังไม่มีประกันสังคม Active",
      description:
        "กำหนดอัตราเงินสมทบและฐานค่าจ้างแบบ Effective Version",
      href:
        "/admin/social-security",
      level:
        "warning",
    });
  }

  if (
    can(
      "system.setup_center.view"
    )
  ) {
    actions.push({
      icon:
        <CheckCircleOutlined />,
      title:
        "ตรวจสอบความพร้อมของระบบ",
      description:
        "ดู Checklist การตั้งค่า Master, Organization, Payroll และข้อมูลพนักงาน",
      href:
        "/admin/setup-center",
      level:
        actions.length ===
        0
          ? "success"
          : "info",
    });
  }

  const visible =
    actions.slice(
      0,
      4
    );

  if (
    visible.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Empty
          image={
            Empty.PRESENTED_IMAGE_SIMPLE
          }
          description="ยังไม่มีรายการแนะนำที่ต้องดำเนินการ"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {visible.map(
        (
          item,
          index
        ) => (
          <ActionCard
            key={`${item.href}-${index}`}
            {...item}
            onNavigate={
              onNavigate
            }
          />
        )
      )}
    </div>
  );
}
