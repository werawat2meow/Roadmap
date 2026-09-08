"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Alert,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeploymentUnitOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { hasPermission } from "@/lib/permissions";

const { Text, Title } = Typography;

function getStatusMeta(status) {
  if (status === "ready") {
    return {
      color: "success",
      label: "พร้อม",
      icon: <CheckCircleOutlined />,
    };
  }

  if (status === "in_progress") {
    return {
      color: "processing",
      label: "กำลังตั้งค่า",
      icon: <ClockCircleOutlined />,
    };
  }

  return {
    color: "default",
    label: "ยังไม่เริ่ม",
    icon: <ClockCircleOutlined />,
  };
}

export default function DashboardSetupJourney({
  user,
  compact = false,
}) {
  const router = useRouter();

  const canViewSetupCenter = hasPermission(
    user,
    "system.setup_center.view"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupData, setSetupData] = useState(null);

  const loadReadiness = useCallback(async () => {
    if (!user || !canViewSetupCenter) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/setup-center", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "ไม่สามารถโหลดความพร้อมของระบบได้"
        );
      }

      setSetupData(result?.data || null);
    } catch (loadError) {
      console.error(
        "LOAD_DASHBOARD_SETUP_READINESS_ERROR:",
        loadError
      );

      setError(
        loadError?.message ||
          "ไม่สามารถโหลดความพร้อมของระบบได้"
      );
    } finally {
      setLoading(false);
    }
  }, [user, canViewSetupCenter]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  const steps = setupData?.steps || [];
  const readiness = setupData?.readiness || {};

  const firstStep = steps[0] || null;
  const lastStep = steps[steps.length - 1] || null;

  const currentStepIndex = useMemo(() => {
    if (!steps.length) return -1;

    const index = steps.findIndex(
      (step) => step.status !== "ready"
    );

    return index >= 0 ? index : steps.length - 1;
  }, [steps]);

  const nextAction = readiness?.next_required_action || null;

  const canOpenNext = nextAction
    ? !nextAction.permission ||
      hasPermission(user, nextAction.permission)
    : false;

  const overallPercent = Number(
    readiness?.overall_percent || 0
  );

  if (!canViewSetupCenter) {
    return null;
  }

  if (loading && !setupData) {
    return (
      <div data-dashboard-tour="setup-readiness">
        <Skeleton active paragraph={{ rows: compact ? 2 : 4 }} />
      </div>
    );
  }

  if (error && !setupData) {
    return (
      <Alert
        data-dashboard-tour="setup-readiness"
        type="warning"
        showIcon
        title="โหลดความพร้อมของระบบไม่ได้"
        description={error}
        action={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadReadiness}
          >
            ลองใหม่
          </Button>
        }
      />
    );
  }

  if (compact) {
    return (
      <div
        data-dashboard-tour="setup-readiness"
        className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-white p-4"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Progress
              type="dashboard"
              percent={overallPercent}
              size={92}
            />

            <div>
              <div className="font-semibold text-slate-900">
                ความพร้อมของระบบ HRMS
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Required Master พร้อม {readiness?.required_ready || 0} / {readiness?.required_total || 0}
              </div>

              <Space size={[6, 6]} wrap className="mt-2">
                <Tag color={readiness?.p0_ready ? "success" : "warning"}>
                  P0 {readiness?.p0_ready ? "พร้อม" : "ยังไม่ครบ"}
                </Tag>
                <Tag color={readiness?.employee_ready ? "success" : "processing"}>
                  เพิ่มพนักงาน {readiness?.employee_ready ? "พร้อม" : "ยังไม่พร้อม"}
                </Tag>
              </Space>
            </div>
          </div>

          <div className="min-w-0 xl:max-w-[620px]">
            {nextAction ? (
              <>
                <div className="text-xs text-slate-400">
                  ขั้นตอนถัดไปที่ระบบแนะนำ
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  ขั้นตอนที่ {nextAction.step_order} — {nextAction.step_title}: {nextAction.label}
                </div>
                <div className="mt-2">
                  <Button
                    type="primary"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    iconPlacement="end"
                    disabled={!canOpenNext}
                    onClick={() => router.push(nextAction.href)}
                  >
                    ทำขั้นตอนถัดไป
                  </Button>
                </div>
              </>
            ) : (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Required Setup ครบแล้ว
              </Tag>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-dashboard-tour="setup-readiness"
      className="space-y-4"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card className="h-full rounded-2xl border-blue-100 bg-blue-50/40">
            <div className="flex items-center gap-4">
              <Progress
                type="dashboard"
                percent={overallPercent}
                size={118}
              />

              <div>
                <Title level={5} className="!mb-1">
                  ความพร้อมของระบบ
                </Title>
                <Text type="secondary">
                  ตรวจจาก Required Master ที่มีข้อมูลอย่างน้อย 1 รายการ
                </Text>

                <Space size={[6, 6]} wrap className="mt-3">
                  <Tag color={readiness?.p0_ready ? "success" : "warning"}>
                    P0 {readiness?.p0_ready ? "พร้อม" : "ยังไม่ครบ"}
                  </Tag>
                  <Tag color={readiness?.employee_ready ? "success" : "processing"}>
                    เพิ่มพนักงาน {readiness?.employee_ready ? "พร้อม" : "ยังไม่พร้อม"}
                  </Tag>
                </Space>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-full rounded-2xl">
            <Text type="secondary">Required พร้อมแล้ว</Text>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              <CheckCircleOutlined className="mr-2" />
              {readiness?.required_ready || 0} / {readiness?.required_total || 0}
            </div>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="h-full rounded-2xl">
            <Text type="secondary">สถานะ P0</Text>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              <DeploymentUnitOutlined className="mr-2" />
              {readiness?.p0_ready ? "พร้อม" : "กำลังตั้งค่า"}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={5}>
          <Card className="h-full rounded-2xl">
            <Text type="secondary">Employee Readiness</Text>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              <TeamOutlined className="mr-2" />
              {readiness?.employee_ready ? "เพิ่มได้" : "ยังขาด Master"}
            </div>
          </Card>
        </Col>
      </Row>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Space size={8} wrap>
              {nextAction?.priority ? (
                <Tag
                  color={
                    nextAction.priority === "P0"
                      ? "red"
                      : nextAction.priority === "P1"
                        ? "orange"
                        : "blue"
                  }
                >
                  {nextAction.priority}
                </Tag>
              ) : null}
              <Text type="secondary">
                {nextAction
                  ? `ขั้นตอนที่ ${nextAction.step_order} — ${nextAction.step_title}`
                  : "Required Setup"}
              </Text>
            </Space>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              {nextAction
                ? `ขั้นตอนถัดไป: ${nextAction.label}`
                : "Required Setup ครบแล้ว"}
            </div>

            {nextAction && !canOpenNext ? (
              <div className="mt-1 text-xs text-amber-800">
                บัญชีนี้ไม่มี Permission สำหรับเปิดขั้นตอนนี้
              </div>
            ) : null}
          </div>

          {nextAction ? (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
              disabled={!canOpenNext}
              onClick={() => router.push(nextAction.href)}
            >
              ทำขั้นตอนถัดไป
            </Button>
          ) : (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              พร้อมใช้งาน
            </Tag>
          )}
        </div>
      </div>

      {steps.length ? (
        <div>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-slate-900">
                ลำดับแนะนำการตั้งค่า: ขั้นแรก → ขั้นสุดท้าย
              </div>
              <div className="mt-1 text-xs text-slate-500">
                ใช้เป็นแนวทางตอนเริ่มระบบครั้งแรก ไม่ใช่งานที่ต้องทำซ้ำทุกวัน
              </div>
            </div>

            <Space size={8} wrap>
              {firstStep ? (
                <Tag color="blue">
                  ขั้นแรก: {firstStep.order}. {firstStep.title}
                </Tag>
              ) : null}
              {lastStep ? (
                <Tag color="purple">
                  ขั้นสุดท้าย: {lastStep.order}. {lastStep.title}
                </Tag>
              ) : null}
            </Space>
          </div>

          <Row gutter={[12, 12]}>
            {steps.map((step, index) => {
              const meta = getStatusMeta(step.status);
              const isCurrent = index === currentStepIndex && step.status !== "ready";
              const firstPendingItem = step.items?.find(
                (item) => item.required && !item.ready
              );
              const openItem = firstPendingItem || step.items?.[0] || null;
              const canOpenStep = openItem
                ? !openItem.permission || hasPermission(user, openItem.permission)
                : false;

              return (
                <Col xs={24} md={12} xl={8} key={step.key}>
                  <Card
                    size="small"
                    className={`h-full rounded-2xl ${
                      isCurrent
                        ? "border-blue-300 bg-blue-50/50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Space size={6} wrap>
                          <Tag color={step.priority === "P0" ? "red" : step.priority === "P1" ? "orange" : "blue"}>
                            {step.priority}
                          </Tag>
                          <Tag color={meta.color} icon={meta.icon}>
                            {meta.label}
                          </Tag>
                          {isCurrent ? <Tag color="processing">ทำต่อจากตรงนี้</Tag> : null}
                        </Space>

                        <div className="mt-2 font-semibold text-slate-900">
                          {step.order}. {step.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {step.description}
                        </div>
                      </div>

                      <Progress
                        type="circle"
                        percent={Number(step.percent || 0)}
                        size={52}
                      />
                    </div>

                    {openItem ? (
                      <Button
                        size="small"
                        className="mt-3"
                        disabled={!canOpenStep}
                        onClick={() => router.push(openItem.href)}
                      >
                        {firstPendingItem
                          ? `ไปตั้งค่า: ${firstPendingItem.label}`
                          : "เปิดดูการตั้งค่า"}
                      </Button>
                    ) : null}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ) : null}
    </div>
  );
}
