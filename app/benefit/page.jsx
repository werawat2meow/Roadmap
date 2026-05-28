"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Tag } from "antd";
import {GiftOutlined,SettingOutlined,AppstoreAddOutlined,} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import BenefitHeader from "./components/BenefitHeader";
import BenefitMenuSection from "./components/BenefitMenuSection";
import {benefitSelfMenus,benefitAdminMenus,getVisibleBenefitMenus,} from "./components/benefitMenus";

export default function BenefitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const roleCode = user?.roles?.role_code || user?.role_code || user?.role?.role_code || "USER";

  const selfMenus = useMemo(() => {
    return getVisibleBenefitMenus(user, benefitSelfMenus);
  }, [user]);

  const adminMenus = useMemo(() => {
    return getVisibleBenefitMenus(user, benefitAdminMenus);
  }, [user]);

  const goTo = (path) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <BenefitHeader
          title="ระบบสวัสดิการพนักงาน"
          subtitle="Benefit Management Portal สำหรับตรวจสอบสิทธิ์ ขอใช้สิทธิ์ และจัดการข้อมูลสวัสดิการ"
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

        <BenefitMenuSection
          title="เมนูพนักงาน"
          icon={<GiftOutlined />}
          menus={selfMenus}
          onNavigate={goTo}
        />

        <BenefitMenuSection
          title="เมนูผู้ดูแลระบบ Benefit"
          icon={<SettingOutlined />}
          menus={adminMenus}
          onNavigate={goTo}
        />

        <Card variant="borderless" className="rounded-[24px] shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <AppstoreAddOutlined className="text-emerald-600" />
                โครงสร้างสิทธิ์ระบบ Benefit
              </div>

              <p className="mt-1 text-sm text-slate-500">
                P11-P12 ดูข้อมูลภาพรวมและรายงานได้ ส่วน HR_ADMIN /
                BENEFIT_ADMIN สามารถเพิ่ม แก้ไข ลบ และอนุมัติได้ตาม Permission
              </p>
            </div>

            <Tag className="w-fit rounded-full border-0 bg-emerald-100 px-4 py-1 text-emerald-700">
              Role Based Access Control
            </Tag>
          </div>
        </Card>
      </div>
    </div>
  );
}

/*
 app/benefit
├── page.jsx
├── layout.jsx
│
├── dashboard
│   └── page.jsx
│
├── my-rights
│   └── page.jsx
│
├── requests
│   ├── page.jsx
│   ├── history
│   │   └── page.jsx
│   └── create
│       └── page.jsx
│
├── approvals
│   └── page.jsx
│
├── benefits
│   └── page.jsx
│
├── categories
│   └── page.jsx
│
├── rules
│   └── page.jsx
│
├── entitlements
│   └── page.jsx
│
├── workflows
│   └── page.jsx
│
├── usages
│   └── page.jsx
│
├── reports
│   └── page.jsx
│
├── attachments
│   └── page.jsx
│
├── running-numbers
│   └── page.jsx
│
└── components
    ├── BenefitHeader.jsx
    ├── BenefitMenuCard.jsx
    ├── BenefitMenuSection.jsx
    ├── benefitMenus.js
    │
    ├── cards
    │   ├── BenefitCard.jsx
    │   ├── BenefitRuleCard.jsx
    │   ├── BenefitUsageCard.jsx
    │   └── RequestCard.jsx
    │
    ├── tables
    │   ├── BenefitTable.jsx
    │   ├── BenefitRuleTable.jsx
    │   ├── ApprovalTable.jsx
    │   └── EntitlementTable.jsx
    │
    ├── forms
    │   ├── BenefitForm.jsx
    │   ├── BenefitRuleForm.jsx
    │   ├── CategoryForm.jsx
    │   ├── RequestForm.jsx
    │   └── WorkflowForm.jsx
    │
    └── modals
        ├── BenefitModal.jsx
        ├── RuleModal.jsx
        ├── CategoryModal.jsx
        └── ApprovalModal.jsx





    Auto Entitlement Engine	⚠️
    Benefit Matrix	⚠️
    Auto Deduction	⚠️
    Advanced Policy Engine	⚠️
    Advanced Quota Rules	⚠️
*/