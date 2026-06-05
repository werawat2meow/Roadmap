"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Tag } from "antd";
import {AppstoreAddOutlined,ApartmentOutlined,} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import BenefitHeader from "./components/BenefitHeader";
import BenefitMenuSection from "./components/BenefitMenuSection";
import {getVisibleBenefitSidebarMenus,} from "./components/benefitMenus";

export default function BenefitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const roleCode =
    user?.roles?.role_code ||
    user?.role_code ||
    user?.role?.role_code ||
    "USER";

  const sidebarSections = useMemo(() => {
    return getVisibleBenefitSidebarMenus(user);
  }, [user]);

  const goTo = (path) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <BenefitHeader
          title="ระบบสวัสดิการพนักงาน"
          subtitle="Benefit Management Portal สำหรับตรวจสอบสิทธิ์ ขอใช้สิทธิ์ อนุมัติ และจัดการข้อมูลสวัสดิการ"
          user={user}
          badges={["Benefit Portal", roleCode, "RBAC"]}
        >
          <Button
            size="large"
            onClick={() => router.push("/benefit/my-rights")}
            className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
          >
            สิทธิ์ของฉัน
          </Button>

          <Button
            size="large"
            onClick={() => router.push("/benefit/requests")}
            className="!h-12 !rounded-2xl !border-0 !bg-white !px-6 !font-semibold !text-emerald-800 hover:!bg-emerald-50"
          >
            ขอใช้สิทธิ์
          </Button>
        </BenefitHeader>

        {sidebarSections.map((section) => (
          <BenefitMenuSection
            key={section.title}
            title={section.title}
            icon={section.icon}
            menus={section.items.map((item) => ({
              title: item.label,
              desc: item.desc || item.label,
              icon: item.icon,
              path: item.href,
              tag: item.tag || "Menu",
            }))}
            onNavigate={goTo}
          />
        ))}

        <Card variant="borderless" className="rounded-[24px] shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <AppstoreAddOutlined className="text-emerald-600" />
                  Flow การทำงานระบบ Benefit
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  ระบบ Benefit แบ่งการทำงานเป็น Self Service, Setup, Matrix,
                  Entitlement, Request, Approval, Usage และ Reports
                </p>
              </div>

              <Tag className="w-fit rounded-full border-0 bg-emerald-100 px-4 py-1 text-emerald-700">
                Role Based Access Control
              </Tag>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-800">1. Setup</div>
                <div className="mt-1 text-xs text-slate-500">
                  กำหนดหมวดหมู่ รายการสวัสดิการ และข้อมูลตั้งต้น
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-800">2. Matrix</div>
                <div className="mt-1 text-xs text-slate-500">
                  กำหนดว่าใคร ได้สิทธิ์อะไร เท่าไหร่
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-800">
                  3. Entitlement
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Generate สิทธิ์จริงให้พนักงานประจำปี/ประจำเดือน
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-800">
                  4. Request & Approval
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  พนักงานยื่นคำขอ ส่งอนุมัติ และตัดสิทธิ์หลังอนุมัติ
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <ApartmentOutlined />
              Flow หลัก: Benefit Setup → Benefit Matrix → Generate
              Entitlements → Request → Approval → Usage → Reports
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/*
Benefit Setup                ✅ 100%
Benefit Rules                ✅ 100%
Benefit Matrix               ✅ 100%
Advanced Policy Engine       ✅ 100%
Entitlement Engine           ✅ 100%
Request Management           ✅ 100%
Approval Workflow            ✅ 100%
Auto Deduction               ✅ 100%
Reverse Deduction            ✅ 100%
Usage Tracking               ✅ 100%
Reports                      ✅ 100%
Dashboard                    🟡 85%
Audit Log                    ❌
Attachments Management       🟡 70%
Notifications                ❌
Advanced Quota Rules         ❌
*/