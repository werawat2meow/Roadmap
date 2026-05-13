"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Button } from "antd";
import {GiftOutlined,CheckCircleOutlined,ClockCircleOutlined,SafetyCertificateOutlined,MedicineBoxOutlined,WalletOutlined,TeamOutlined,} from "@ant-design/icons";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import BenefitHeader from "./components/BenefitHeader";
import BenefitStatCard from "./components/BenefitStatCard";
import BenefitMatrix from "./components/BenefitMatrix";

export default function BenefitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const canRequest = hasPermission(user, "benefit.request.create");
  const canApprove = hasPermission(user, "benefit.request.approve");

  const benefitSummary = useMemo(
    () => [
      {
        title: "สิทธิ์ที่ใช้งานได้",
        value: 12,
        suffix: "รายการ",
        icon: <GiftOutlined />,
        gradient: "from-emerald-500 to-green-500",
      },
      {
        title: "คำขอรออนุมัติ",
        value: 3,
        suffix: "รายการ",
        icon: <ClockCircleOutlined />,
        gradient: "from-amber-500 to-orange-500",
      },
      {
        title: "ใช้สิทธิ์แล้วปีนี้",
        value: 8,
        suffix: "ครั้ง",
        icon: <CheckCircleOutlined />,
        gradient: "from-sky-500 to-blue-500",
      },
      {
        title: "วงเงินคงเหลือ",
        value: 2000,
        suffix: "บาท",
        icon: <WalletOutlined />,
        gradient: "from-violet-500 to-purple-500",
      },
    ],
    []
  );

  const benefitGroups = [
    {
      title: "Primary Benefit",
      subtitle: "สิทธิ์หลักสำหรับพนักงาน",
      items: [
        "วันหยุดนักขัตฤกษ์ 15 วันต่อปี",
        "ยูนิฟอร์ม 4 ชุด",
        "ประกันสังคม บริษัทสมทบ 5%",
        "อาหารกลางวัน 1 มื้อต่อวัน",
        "สวัสดิการเงินกู้พนักงาน",
      ],
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: "Secondary Benefit",
      subtitle: "สิทธิประโยชน์เพิ่มเติม",
      items: [
        "Company Staff Incentive",
        "Restaurant Incentive",
        "Activity Incentive",
        "Commission",
        "Fix Incentive",
      ],
      icon: <TeamOutlined />,
    },
    {
      title: "Health & Support",
      subtitle: "สุขภาพและเงินช่วยเหลือ",
      items: [
        "สิทธิวงเงินเครดิตพนักงาน 2,000 บาทต่อเดือน",
        "สิทธิร้านอาหารและกิจกรรมในเครือ",
        "เงินสนับสนุนด้านการศึกษาพนักงานหรือบุตร",
        "ค่าประกันภัยแบบกลุ่มสุขภาพ",
      ],
      icon: <MedicineBoxOutlined />,
    },
  ];

  const levels = [
    { level: "P10", color: "bg-red-900", leave: 15, loan: "2 เท่า" },
    { level: "P9", color: "bg-red-600", leave: 15, loan: "2 เท่า" },
    { level: "P8", color: "bg-orange-600", leave: 11, loan: "1.5 เท่า" },
    { level: "P7", color: "bg-orange-500", leave: 9, loan: "1.5 เท่า" },
    { level: "P6", color: "bg-amber-400", leave: 7, loan: "1 เท่า" },
    { level: "P5", color: "bg-cyan-500", leave: 7, loan: "1 เท่า" },
    { level: "P4", color: "bg-sky-600", leave: 7, loan: "1 เท่า" },
    { level: "P3", color: "bg-slate-600", leave: 7, loan: "0.5 เท่า" },
    { level: "P2", color: "bg-slate-800", leave: 7, loan: "0.5 เท่า" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <BenefitHeader
          title="ระบบสวัสดิการพนักงาน"
          subtitle="ศูนย์กลางตรวจสอบสิทธิ์สวัสดิการ การเบิกสิทธิ์ การอนุมัติ และข้อมูล Benefit ตามระดับพนักงาน P2 - P10"
          user={user}
          badges={["Benefit Portal", "Permission Based", "Enterprise"]}
        >
          {canRequest && (
            <Button
              size="large"
              onClick={() => router.push("/benefit/requests")}
              className="!h-12 !rounded-2xl !border-0 !bg-white !px-6 !font-semibold !text-emerald-800 hover:!bg-emerald-50"
            >
              ขอใช้สิทธิ์
            </Button>
          )}

          <Button
            size="large"
            onClick={() => router.push("/benefit/my-rights")}
            className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
          >
            ตรวจสอบสิทธิ์ของฉัน
          </Button>

          <Button
            size="large"
            onClick={() => router.push("/benefit/categories")}
            className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
          >
            จัดการหมวดหมู่
          </Button>

          <Button
            size="large"
            onClick={() => router.push("/benefit/benefits")}
            className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
          >
            จัดการสวัสดิการ
          </Button>

          <Button
            size="large"
            onClick={() => router.push("/benefit/rules")}
            className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
          >
            Benefit Rules
          </Button>

          {canApprove && (
            <Button
              size="large"
              onClick={() => router.push("/benefit/approvals")}
              className="!h-12 !rounded-2xl !border-amber-200 !bg-amber-400 !px-6 !font-semibold !text-amber-950 hover:!bg-amber-300"
            >
              รายการรออนุมัติ
            </Button>
          )}
        </BenefitHeader>

        <Row gutter={[16, 16]}>
          {benefitSummary.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <BenefitStatCard {...item} />
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          {benefitGroups.map((group) => (
            <Col xs={24} xl={8} key={group.title}>
              <Card
                variant="borderless"
                className="h-full rounded-[24px] shadow-sm"
                title={
                  <div>
                    <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                      {group.icon}
                      {group.title}
                    </div>
                    <div className="text-sm font-normal text-slate-400">
                      {group.subtitle}
                    </div>
                  </div>
                }
              >
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <CheckCircleOutlined className="mt-1 text-emerald-600" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          variant="borderless"
          className="rounded-[24px] shadow-sm"
          title={
            <div>
              <div className="text-lg font-bold text-slate-800">
                Benefit Matrix ตามระดับพนักงาน
              </div>
              <div className="text-sm font-normal text-slate-400">
                สรุปสิทธิ์เบื้องต้นตามระดับ P2 - P10
              </div>
            </div>
          }
        >
          <BenefitMatrix levels={levels} />
        </Card>
      </div>
    </div>
  );
}
/*
  app
└── benefit
    ├── requests
    │   └── page.jsx
    │
    ├── my-rights
    │   └── page.jsx
    │
    ├── approvals
    │   └── page.jsx
    │
    ├── reports
    │   └── page.jsx
    │
    ├── rules
    │   └── page.jsx
    │
    ├── components
    │   ├── BenefitCard.jsx
    │   ├── BenefitStatCard.jsx
    │   ├── BenefitMatrix.jsx
    │   ├── BenefitHeader.jsx
    │   └── RequestStatusTag.jsx
    │
    ├── layout.jsx
    └── page.jsx


    ในระบบ Benefit แต่ละตาราง มันต้องมีการเพิ่ม,ลบ,แก้ไข ได้ใช่มั้ยครับบ 





    ✅ Benefit Categories
✅ Benefit Masters
⏳ Benefit Rules ← ขั้นต่อไป
⏳ Approval Workflow
⏳ Entitlement Engine
⏳ Auto Approval
*/