"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Button, Empty, Spin, Alert, Tag } from "antd";
import {GiftOutlined,CheckCircleOutlined,ClockCircleOutlined,SafetyCertificateOutlined,WalletOutlined,SettingOutlined,FileDoneOutlined,} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import BenefitHeader from "./components/BenefitHeader";
import BenefitStatCard from "./components/BenefitStatCard";
import BenefitInfoBox from "./components/BenefitInfoBox";
import BenefitAdminButton from "./components/BenefitAdminButton";

export default function BenefitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [benefits, setBenefits] = useState([]);

  const canRequest = hasPermission(user, "benefit.request.create");
  const canApprove = hasPermission(user, "benefit.request.approve");
  const canManageCategory = hasPermission(user, "benefit.category.view");
  const canManageBenefit = hasPermission(user, "benefit.master.view");
  const canManageRule = hasPermission(user, "benefit.rule.view");

  const loadMyBenefits = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/benefits/me", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลดข้อมูลสวัสดิการไม่สำเร็จ");
      }

      setProfile(data.profile || null);
      setSummary(data.summary || null);
      setBenefits(data.benefits || []);
    } catch (err) {
      console.error("LOAD_MY_BENEFITS_ERROR:", err);
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBenefits();
  }, []);

  const benefitSummary = useMemo(
    () => [
      {
        title: "สิทธิ์ที่ใช้งานได้",
        value: summary?.totalBenefits || 0,
        suffix: "รายการ",
        icon: <GiftOutlined />,
        gradient: "from-emerald-500 to-green-500",
      },
      {
        title: "ระดับพนักงาน",
        value: summary?.positionLevel || "-",
        suffix: "",
        icon: <SafetyCertificateOutlined />,
        gradient: "from-sky-500 to-blue-500",
      },
      {
        title: "อายุงาน",
        value: summary?.yearsOfService || 0,
        suffix: "ปี",
        icon: <ClockCircleOutlined />,
        gradient: "from-amber-500 to-orange-500",
      },
      {
        title: "สถานะทดลองงาน",
        value: summary?.probation ? "ใช่" : "ไม่ใช่",
        suffix: "",
        icon: <WalletOutlined />,
        gradient: "from-violet-500 to-purple-500",
      },
    ],
    [summary]
  );

  const groupedBenefits = useMemo(() => {
    return benefits.reduce((groups, item) => {
      const category =
        item?.benefits?.benefit_categories?.category_name || "Other";

      if (!groups[category]) groups[category] = [];
      groups[category].push(item);

      return groups;
    }, {});
  }, [benefits]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <BenefitHeader
          title="ระบบสวัสดิการพนักงาน"
          subtitle={`สิทธิ์สวัสดิการของ ${profile?.full_name || user?.full_name || user?.username || "ผู้ใช้งาน"} ตามสถานะจริงในระบบ Employee Master`}
          user={user}
          badges={[
            "Benefit Portal",
            profile?.position_level || "No Level",
            profile?.employee_status || "No Status",
          ]}
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

          {canManageCategory && (
            <Button
              size="large"
              onClick={() => router.push("/benefit/categories")}
              className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
            >
              จัดการหมวดหมู่
            </Button>
          )}

          {canManageBenefit && (
            <Button
              size="large"
              onClick={() => router.push("/benefit/benefits")}
              className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
            >
              จัดการสวัสดิการ
            </Button>
          )}

          {canManageRule && (
            <Button
              size="large"
              onClick={() => router.push("/benefit/rules")}
              className="!h-12 !rounded-2xl !border-white/20 !bg-white/10 !px-6 !font-semibold !text-white hover:!bg-white/20"
            >
              Benefit Rules
            </Button>
          )}

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

        {error && (
          <Alert
            type="error"
            showIcon
            message="โหลดข้อมูลไม่สำเร็จ"
            description={error}
            className="!rounded-2xl"
          />
        )}

        {loading ? (
          <Card className="rounded-[24px] shadow-sm">
            <div className="flex h-60 items-center justify-center">
              <Spin size="large" />
            </div>
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {benefitSummary.map((item) => (
                <Col xs={24} sm={12} xl={6} key={item.title}>
                  <BenefitStatCard {...item} />
                </Col>
              ))}
            </Row>

            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-bold text-slate-800">
                    ข้อมูลพนักงานที่ใช้คำนวณสิทธิ์
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    ระบบคำนวณจากระดับพนักงาน สถานะ ประเภทการจ้าง และอายุงาน
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <BenefitInfoBox label="รหัสพนักงาน" value={profile?.employee_code || "-"} />
                <BenefitInfoBox label="ระดับ" value={profile?.position_level || "-"} />
                <BenefitInfoBox label="สถานะ" value={profile?.employee_status || "-"} />
                <BenefitInfoBox label="ประเภทการจ้าง" value={profile?.employment_type || "-"} />
              </div>
            </Card>

            {benefits.length > 0 ? (
              Object.entries(groupedBenefits).map(([category, items]) => (
                <Card
                  key={category}
                  variant="borderless"
                  className="rounded-[24px] shadow-sm"
                  title={
                    <div className="flex items-center gap-2">
                      <GiftOutlined className="text-emerald-600" />
                      <span className="text-lg font-bold text-slate-800">
                        {category}
                      </span>
                      <Tag className="ml-2 rounded-full border-0 bg-emerald-100 text-emerald-700">
                        {items.length} รายการ
                      </Tag>
                    </div>
                  }
                >
                  <Row gutter={[16, 16]}>
                    {items.map((rule) => (
                      <Col xs={24} md={12} xl={8} key={rule.id}>
                        <Card
                          className="h-full rounded-2xl border border-slate-200 shadow-sm"
                          title={
                            <div className="flex items-center gap-2 text-base font-bold text-slate-800">
                              <CheckCircleOutlined className="text-emerald-600" />
                              {rule?.benefits?.benefit_name || "-"}
                            </div>
                          }
                        >
                          <p className="min-h-[48px] text-sm text-slate-500">
                            {rule?.benefits?.description || rule?.rule_note || "-"}
                          </p>

                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <div>
                              <span className="font-semibold">Quota:</span>{" "}
                              {rule.is_unlimited
                                ? "ไม่จำกัด"
                                : rule.quota_amount
                                  ? `${Number(rule.quota_amount).toLocaleString()} ${rule.quota_unit || ""}`
                                  : "-"}
                            </div>

                            <div>
                              <span className="font-semibold">Frequency:</span>{" "}
                              {rule.quota_frequency || "-"}
                            </div>

                            {rule.discount_percent ? (
                              <div>
                                <span className="font-semibold">Discount:</span>{" "}
                                {rule.discount_percent}%
                              </div>
                            ) : null}
                          </div>

                          {canRequest && (
                            <Button
                              block
                              className="mt-5 !rounded-xl"
                              onClick={() =>
                                router.push(`/benefit/requests?benefit_id=${rule.benefit_id}`)
                              }
                            >
                              ขอใช้สิทธิ์
                            </Button>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              ))
            ) : (
              <Card className="rounded-[24px] shadow-sm">
                <Empty description="ยังไม่พบสิทธิ์สวัสดิการที่ตรงกับข้อมูลพนักงานของคุณ" />
              </Card>
            )}

            {(canManageCategory || canManageBenefit || canManageRule || canApprove) && (
              <Card
                variant="borderless"
                className="rounded-[24px] shadow-sm"
                title={
                  <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                    <SettingOutlined />
                    เมนูผู้ดูแลระบบ Benefit
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {canManageCategory && (
                    <BenefitAdminButton
                      icon={<GiftOutlined />}
                      title="หมวดหมู่"
                      onClick={() => router.push("/benefit/categories")}
                    />
                  )}

                  {canManageBenefit && (
                    <BenefitAdminButton
                      icon={<FileDoneOutlined />}
                      title="สวัสดิการ"
                      onClick={() => router.push("/benefit/benefits")}
                    />
                  )}

                  {canManageRule && (
                    <BenefitAdminButton
                      icon={<SafetyCertificateOutlined />}
                      title="Rules"
                      onClick={() => router.push("/benefit/rules")}
                    />
                  )}

                  {canApprove && (
                    <BenefitAdminButton
                      icon={<CheckCircleOutlined />}
                      title="อนุมัติ"
                      onClick={() => router.push("/benefit/approvals")}
                    />
                  )}
                </div>
              </Card>
            )}
          </>
        )}
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