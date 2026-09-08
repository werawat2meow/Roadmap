"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  Flex,
  Tour,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  BellOutlined,
  BarChartOutlined,
  CompassOutlined,
  SearchOutlined,
  SettingOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import { hasPermission } from "@/lib/permissions";

const { Text } = Typography;

const TOUR_VERSION = "v3";

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

  return `hrms:dashboard:guided-tour:${TOUR_VERSION}:${userKey}`;
}

function getTarget(name) {
  if (typeof document === "undefined") {
    return null;
  }

  return document.querySelector(
    `[data-dashboard-tour="${name}"]`
  );
}

export default function DashboardGuidedTour({
  user,
  canViewEmployees = false,
  openSignal = 0,
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const canViewSetupCenter = hasPermission(
    user,
    "system.setup_center.view"
  );

  const storageKey = useMemo(
    () => getUserStorageKey(user),
    [user]
  );

  const rememberCompleted = useCallback(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      storageKey,
      "completed"
    );
  }, [storageKey]);

  const handleSkip = useCallback(() => {
    rememberCompleted();
    setOpen(false);
  }, [rememberCompleted]);

  const handleFinish = useCallback(() => {
    rememberCompleted();
    setOpen(false);
  }, [rememberCompleted]);

  const skipButton = (
    <Button
      type="link"
      size="small"
      onClick={handleSkip}
      style={{ paddingInline: 0 }}
    >
      ข้ามการแนะนำ
    </Button>
  );

  const steps = useMemo(() => {
    const result = [
      {
        title: "ยินดีต้อนรับสู่ HR Workspace",
        icon: <CompassOutlined />,
        target: null,
        description: (
          <Flex vertical gap={10}>
            <Text>
              Dashboard เป็นหน้าหลักสำหรับใช้งาน HRMS
              โดยรวมงานตาม Role, Permission และจุดตั้งค่าที่จำเป็นไว้ในหน้าเดียว
              เพื่อให้ใช้งานได้แม้ลด Sidebar เหลือเพียง Overview
            </Text>
            {skipButton}
          </Flex>
        ),
      },
      {
        title: "ภาพรวม Dashboard",
        icon: <CompassOutlined />,
        target: () => getTarget("overview"),
        placement: "bottom",
        description: (
          <Flex vertical gap={10}>
            <Text>
              ส่วนบนใช้บอกว่าคุณกำลังอยู่ใน HR Workspace และเป็นจุดสำหรับ Refresh,
              Export และเปิดคำแนะนำนี้ใหม่ได้ทุกเมื่อ
            </Text>
            {skipButton}
          </Flex>
        ),
      },
      ...(canViewEmployees
        ? [
            {
              title: "การแจ้งเตือนที่ต้องติดตาม",
              icon: <BellOutlined />,
              target: () => getTarget("notifications"),
              placement: "bottom",
              description: (
                <Flex vertical gap={10}>
                  <Text>
                    กระดิ่งจะแสดงจำนวนพนักงานที่อยู่ในสถานะทดลองงานภายใน Scope ของคุณ
                    กดเพื่อดูรายการที่ต้องติดตาม และเปิดหน้าพนักงานเพื่อดำเนินการต่อได้ทันที
                  </Text>
                  {skipButton}
                </Flex>
              ),
            },
          ]
        : []),
      {
        title: "งานของคุณตาม Role + Permission",
        icon: <SolutionOutlined />,
        target: () => getTarget("workspace"),
        placement: "bottom",
        description: (
          <Flex vertical gap={10}>
            <Text>
              ระบบจะจัดงานที่เกี่ยวข้องกับ Role ของผู้ใช้งานขึ้นมาก่อน
              และกรองทุกปุ่มด้วย Permission จริงของบัญชีนี้
            </Text>
            {skipButton}
          </Flex>
        ),
      },
      {
        title: "ค้นหาหน้าที่ต้องการ",
        icon: <SearchOutlined />,
        target: () => getTarget("search"),
        placement: "bottom",
        description: (
          <Flex vertical gap={10}>
            <Text>
              ถ้าจำไม่ได้ว่าเมนูอยู่ตรงไหน ให้ค้นหาคำ เช่น พนักงาน, ภาษี,
              Payroll, ตำแหน่ง, Role หรือสัมภาษณ์ ระบบจะแสดงเฉพาะหน้าที่คุณมีสิทธิ์ใช้
            </Text>
            {skipButton}
          </Flex>
        ),
      },
      {
        title: "งานหลักของคุณ",
        icon: <SolutionOutlined />,
        target: () => getTarget("primary-work"),
        placement: "top",
        description: (
          <Flex vertical gap={10}>
            <Text>
              ส่วนนี้คือทางลัดงานที่ Role นี้ใช้บ่อย เช่น ข้อมูลพนักงาน,
              ค่าตอบแทน, ภาษี/ประกันสังคม, Recruitment หรือ User Access
              ตามหน้าที่ของแต่ละคน
            </Text>
            {skipButton}
          </Flex>
        ),
      },
      {
        title: "งานที่ใช้เป็นประจำทั้งหมด",
        icon: <ApartmentOutlined />,
        target: () => getTarget("daily-work"),
        placement: "top",
        description: (
          <Flex vertical gap={10}>
            <Text>
              เมนูงานปฏิบัติการที่คุณมี Permission จะอยู่ตรงนี้ทั้งหมด
              เช่น การครองตำแหน่งองค์กร, Employee Compensation,
              ภาษี/ประกันสังคม, Payroll, Leave, Training และงาน HR อื่น ๆ
              จึงไม่หายเมื่อเอา Sidebar ออก
            </Text>
            {skipButton}
          </Flex>
        ),
      },
      {
        title: "ตั้งค่าพื้นฐาน HRMS",
        icon: <SettingOutlined />,
        target: () => getTarget("setup-guide"),
        placement: "top",
        description: (
          <Flex vertical gap={10}>
            <Text>
              ส่วนนี้เป็น Master / Setup ที่ทำครั้งแรก หรือกลับมาแก้เมื่อข้อมูลเปลี่ยน
              เช่น บริษัท, สังกัด, ตำแหน่ง, Salary Band, Payroll Setup,
              Tax Rate และ Permission สามารถกด “เปิด” เพื่อดูรายการได้
            </Text>
            {skipButton}
          </Flex>
        ),
      },
    ];

    if (canViewSetupCenter) {
      result.push({
        title: "ความพร้อมและลำดับการตั้งค่าระบบ",
        icon: <SettingOutlined />,
        target: () => getTarget("setup-readiness"),
        placement: "top",
        description: (
          <Flex vertical gap={10}>
            <Text>
              ระบบคำนวณเปอร์เซ็นต์ความพร้อมจาก Required Master และแนะนำลำดับ
              ตั้งแต่ขั้นแรกถึงขั้นสุดท้าย พร้อมชี้ “ขั้นตอนถัดไป” ที่ยังต้องทำ
              โดยข้อมูลนี้ใช้จาก Setup Center ชุดเดียวกัน
            </Text>
            {skipButton}
          </Flex>
        ),
      });
    }

    result.push(
      {
        title: "Role + Permission + Scope",
        icon: <SafetyCertificateOutlined />,
        target: () => getTarget("scope"),
        placement: "top",
        description: (
          <Flex vertical gap={10}>
            <Text>
              Role ใช้จัดลำดับงาน, Permission กำหนดว่าปุ่มไหนมองเห็นและเข้าได้
              ส่วน Scope กำหนดว่าหลังเข้าเมนูแล้วคุณเห็นข้อมูลของบริษัท สังกัด
              แผนก หรือหน่วยงานใด
            </Text>
            {skipButton}
          </Flex>
        ),
      }
    );

    if (canViewEmployees) {
      result.push({
        title: "ภาพรวม Workforce",
        icon: <BarChartOutlined />,
        target: () => getTarget("workforce-summary"),
        placement: "top",
        description: (
          <Flex vertical gap={10}>
            <Text>
              หากมีสิทธิ์ดูข้อมูลพนักงาน ส่วนนี้จะแสดง KPI ตาม Scope ของผู้ใช้
              เช่นจำนวนพนักงาน กำลังทำงาน ทดลองงาน เข้าใหม่ ลาออก และบัญชีผู้ใช้งาน
            </Text>
            {skipButton}
          </Flex>
        ),
      });
    }

    result.push({
      title: "พร้อมเริ่มใช้งาน",
      icon: <CompassOutlined />,
      target: null,
      description: (
        <Flex vertical gap={10}>
          <Text>
            ใช้ Dashboard เป็นหน้าหลักได้เลย ถ้าหาเมนูไม่เจอให้ใช้ช่องค้นหา
            และสามารถกด “แนะนำการใช้งาน” ด้านบนเพื่อเปิดคำแนะนำนี้ใหม่ได้ทุกเมื่อ
          </Text>
        </Flex>
      ),
    });

    return result;
  }, [canViewEmployees, canViewSetupCenter, skipButton]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    const completed =
      window.localStorage.getItem(storageKey) ===
      "completed";

    if (completed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrent(0);
      setOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [storageKey, user]);

  useEffect(() => {
    if (!openSignal) return;

    setCurrent(0);

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [openSignal]);

  return (
    <Tour
      open={open}
      current={current}
      steps={steps}
      onChange={setCurrent}
      onClose={handleSkip}
      onFinish={handleFinish}
      mask
      arrow
      scrollIntoViewOptions={{
        behavior: "smooth",
        block: "center",
      }}
    />
  );
}
