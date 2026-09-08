"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Modal,
  Progress,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  IdcardOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const { Paragraph, Text, Title } = Typography;

const INTRO_VERSION = "v1";

function cleanText(value) {
  return String(value || "").trim();
}

function getUserStorageKey(user) {
  const userKey =
    cleanText(user?.user_account_id) ||
    cleanText(user?.id) ||
    cleanText(user?.username) ||
    cleanText(user?.employee_id) ||
    "default";

  return `hrms:dashboard:intro:${INTRO_VERSION}:${userKey}`;
}

const GUIDE_STEPS = [
  {
    key: "overview",
    title: "Dashboard คือหน้าหลัก",
    icon: <CompassOutlined />,
    description:
      "ใช้ Dashboard เป็นจุดเริ่มต้นของงาน HR แทนการจำว่าเมนูต่าง ๆ อยู่ตรงไหนใน Sidebar",
    detail:
      "ระบบจะแสดงทางลัดตาม Role และ Permission ของผู้ใช้งาน คนละ Role จึงเห็นงานที่ต่างกันได้",
  },
  {
    key: "primary-work",
    title: "เริ่มจากงานหลักของคุณ",
    icon: <IdcardOutlined />,
    description:
      "ส่วน “งานหลักของคุณ” คัดหน้าที่ Role นี้ใช้งานบ่อยขึ้นมาให้ก่อน",
    detail:
      "เช่น HR Officer เห็นงานพนักงาน ภาษี/ประกันสังคม บัญชีธนาคาร Recruitment ส่วน Access Admin จะเห็นงาน User / Role / Scope ตามสิทธิ์ของตัวเอง",
  },
  {
    key: "all-work",
    title: "งานประจำทั้งหมดอยู่ใน Dashboard",
    icon: <ApartmentOutlined />,
    description:
      "ส่วน “งานที่ใช้เป็นประจำทั้งหมด” รวมเมนูปฏิบัติการที่ User คนนี้มี Permission ใช้งาน",
    detail:
      "เช่น การครองตำแหน่งองค์กร ค่าตอบแทนพนักงาน ภาษีและประกันสังคม Recruitment Payroll การลา Training และงานอื่น ๆ จึงไม่หายแม้ Sidebar ถูกลดเหลือ Dashboard",
  },
  {
    key: "setup",
    title: "ตั้งค่าพื้นฐาน ไม่ใช่งานที่ต้องทำทุกวัน",
    icon: <SettingOutlined />,
    description:
      "ส่วน “ตั้งค่าพื้นฐาน HRMS” ถูกย่อไว้ก่อน และกดเปิดเมื่อต้องตั้ง Master หรือมีข้อมูลเปลี่ยนแปลง",
    detail:
      "ตัวอย่างเช่น บริษัท สังกัด แผนก ตำแหน่ง Salary Band Payroll Setup ภาษี และสิทธิ์ เป็นการตั้งค่าครั้งแรกหรือกลับมาแก้เมื่อมีการเปลี่ยนแปลงเท่านั้น",
  },
  {
    key: "search",
    title: "หาเมนูไม่เจอ ใช้ช่องค้นหา",
    icon: <SearchOutlined />,
    description:
      "พิมพ์คำที่ต้องการ เช่น พนักงาน ภาษี Payroll ตำแหน่ง Role หรือสัมภาษณ์",
    detail:
      "ผลค้นหาจะแสดงเฉพาะหน้าที่ User คนนี้มี Permission เปิดใช้งาน ทำให้ Dashboard เป็น Navigation หลักได้โดยไม่ต้องจำโครงสร้างเมนูทั้งหมด",
  },
];

export default function DashboardIntroGuide({
  user,
  openSignal = 0,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("welcome");
  const [current, setCurrent] = useState(0);

  const storageKey = useMemo(
    () => getUserStorageKey(user),
    [user]
  );

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const dismissed = window.localStorage.getItem(storageKey) === "dismissed";

    if (!dismissed) {
      setMode("welcome");
      setCurrent(0);
      setOpen(true);
    }
  }, [storageKey, user]);

  useEffect(() => {
    if (!openSignal) return;

    setMode("guide");
    setCurrent(0);
    setOpen(true);
  }, [openSignal]);

  const rememberDismissed = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, "dismissed");
  };

  const handleSkip = () => {
    rememberDismissed();
    setOpen(false);
  };

  const handleStartGuide = () => {
    setMode("guide");
    setCurrent(0);
  };

  const handleFinish = () => {
    rememberDismissed();
    setOpen(false);
  };

  const step = GUIDE_STEPS[current];
  const percent = Math.round(((current + 1) / GUIDE_STEPS.length) * 100);

  return (
    <Modal
      open={open}
      onCancel={handleSkip}
      footer={null}
      width={820}
      centered
      mask={{ closable: false }}
      title={null}
    >
      {mode === "welcome" ? (
        <div className="py-2">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
              <CompassOutlined />
            </div>

            <div className="min-w-0">
              <Space size={8} wrap className="mb-2">
                <Tag color="blue">HR WORKSPACE</Tag>
                <Tag>แนะนำการใช้งาน</Tag>
              </Space>

              <Title level={3} className="!mb-2 !mt-0 !text-slate-900">
                ยินดีต้อนรับสู่ HRMS Dashboard
              </Title>

              <Paragraph className="!mb-0 !text-slate-600">
                หน้านี้เป็นจุดเริ่มต้นสำหรับงาน HR โดยรวมทางลัดตาม Role,
                งานที่ใช้เป็นประจำ และการตั้งค่าพื้นฐานไว้ในที่เดียว
                เพื่อให้ใช้งานได้แม้ไม่ต้องเปิด Sidebar หลายชั้น
              </Paragraph>
            </div>
          </div>

          <Row gutter={[12, 12]} className="mb-5">
            <Col xs={24} md={8}>
              <Card size="small" className="h-full rounded-xl border-slate-200 bg-slate-50">
                <div className="mb-2 text-lg text-blue-600">
                  <IdcardOutlined />
                </div>
                <div className="font-semibold text-slate-800">งานหลักของคุณ</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  ทางลัดที่จัดตาม Role และ Permission
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card size="small" className="h-full rounded-xl border-slate-200 bg-slate-50">
                <div className="mb-2 text-lg text-blue-600">
                  <ApartmentOutlined />
                </div>
                <div className="font-semibold text-slate-800">งานประจำทั้งหมด</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  เมนูงานที่คุณมีสิทธิ์ใช้จะไม่หาย
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card size="small" className="h-full rounded-xl border-slate-200 bg-slate-50">
                <div className="mb-2 text-lg text-blue-600">
                  <SettingOutlined />
                </div>
                <div className="font-semibold text-slate-800">ตั้งค่าพื้นฐาน</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  ทำครั้งแรก แล้วเปิดเมื่อมีการเปลี่ยนแปลง
                </div>
              </Card>
            </Col>
          </Row>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            คุณสามารถกด <strong>“ข้าม”</strong> เพื่อเริ่มใช้งานทันที หรือกด
            <strong> “อธิบายการใช้งาน”</strong> เพื่อดูวิธีใช้ Dashboard แบบสั้น ๆ
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={handleSkip}>ข้าม</Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
              onClick={handleStartGuide}
            >
              อธิบายการใช้งาน
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Dashboard Guide
              </Text>
              <Title level={4} className="!mb-0 !mt-1 !text-slate-900">
                วิธีใช้งาน /admin/dashboard
              </Title>
            </div>

            <Tag color="blue">
              {current + 1} / {GUIDE_STEPS.length}
            </Tag>
          </div>

          <Progress percent={percent} showInfo={false} className="!mb-5" />

          <Steps
            current={current}
            size="small"
            responsive
            items={GUIDE_STEPS.map((item) => ({ title: item.title }))}
            className="!mb-6"
          />

          <Card className="rounded-2xl border-blue-100 bg-blue-50/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-blue-600 shadow-sm">
                {step.icon}
              </div>

              <div className="min-w-0 flex-1">
                <Title level={4} className="!mb-2 !mt-0 !text-slate-900">
                  {step.title}
                </Title>

                <Paragraph className="!mb-2 !text-slate-700">
                  {step.description}
                </Paragraph>

                <Text className="text-sm leading-6 text-slate-500">
                  {step.detail}
                </Text>
              </div>
            </div>
          </Card>

          {current === GUIDE_STEPS.length - 1 ? (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              <CheckCircleOutlined className="mr-2" />
              พร้อมใช้งานแล้ว — หากต้องการดูคำอธิบายอีกครั้ง กดปุ่ม
              <strong> “วิธีใช้งาน”</strong> ที่ส่วนหัวของ Dashboard ได้ตลอดเวลา
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="text" onClick={handleSkip}>
              ข้ามการแนะนำ
            </Button>

            <Space wrap>
              <Button
                icon={<ArrowLeftOutlined />}
                disabled={current === 0}
                onClick={() => setCurrent((value) => Math.max(value - 1, 0))}
              >
                ย้อนกลับ
              </Button>

              {current < GUIDE_STEPS.length - 1 ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                  onClick={() =>
                    setCurrent((value) =>
                      Math.min(value + 1, GUIDE_STEPS.length - 1)
                    )
                  }
                >
                  ถัดไป
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleFinish}
                >
                  เริ่มใช้งาน
                </Button>
              )}
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
}
