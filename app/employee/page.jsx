"use client";

import {
  Typography,
} from "antd";

import {
  CalendarOutlined,
  CarryOutOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  IdcardOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import EmployeeServiceCard from "./components/EmployeeServiceCard";

import {
  canAccessManagerSelfService,
  hasEmployeePortalPermission,
} from "./lib/employeePortalAccess";

import {
  mockEmployeeProfile,
  mockNews,
  mockRequests,
} from "./_mock/employeePortalMockData";

const {
  Title,
  Text,
} = Typography;

/* =========================================================
   Component
========================================================= */

export default function EmployeePortalHomePage() {
  const router =
    useRouter();

  const {
    user,
  } =
    useAuth();

  /* =======================================================
     Employee
  ======================================================= */

  const displayName =
    user?.full_name ||
    mockEmployeeProfile
      .full_name;

  const employeeCode =
    user?.employee_code ||
    mockEmployeeProfile
      .employee_code;

  const roleName =
    user?.role_name ||
    user?.role_code ||
    user?.role ||
    "Employee";

  /* =======================================================
     Request Summary
  ======================================================= */

  const pendingCount =
    mockRequests.filter(
      (item) =>
        item.status ===
        "pending"
    ).length;

  /* =======================================================
     Employee Services

     Permission:
     ep.*
  ======================================================= */

  const employeeServices = [
    /* =====================================================
       News
    ===================================================== */

    {
      key:
        "news",

      permission:
        "ep.news.view",

      title:
        "ข่าวสารบริษัท",

      description:
        "ติดตามข่าว ประกาศ และข้อมูลสำคัญจากบริษัท",

      meta:
        `${mockNews.length} ข่าวล่าสุด`,

      href:
        "/employee/news",

      icon:
        <ReadOutlined />,
    },

    /* =====================================================
       Profile
    ===================================================== */

    {
      key:
        "profile",

      permission:
        "ep.profile.view",

      title:
        "ข้อมูลส่วนตัว",

      description:
        "ตรวจสอบข้อมูลพนักงานและข้อมูลการทำงานของคุณ",

      meta:
        "ข้อมูลของฉัน",

      href:
        "/employee/profile",

      icon:
        <IdcardOutlined />,
    },

    /* =====================================================
       Attendance
    ===================================================== */

    {
      key:
        "attendance",

      permission:
        "ep.attendance.view",

      title:
        "เวลาเข้า-ออกงาน",

      description:
        "ตรวจสอบเวลาเข้า-ออกงานและประวัติการลงเวลาของคุณ",

      meta:
        "Attendance ของฉัน",

      href:
        "/employee/attendance",

      icon:
        <FieldTimeOutlined />,
    },

    /* =====================================================
       Leave Balance
    ===================================================== */

    {
      key:
        "leave-balances",

      permission:
        "ep.leave_balances.view",

      title:
        "สิทธิ์การลา",

      description:
        "ตรวจสอบสิทธิ์วันลา จำนวนที่ใช้ และวันลาคงเหลือ",

      meta:
        "พักร้อน / ป่วย / กิจ",

      href:
        "/employee/leave-balances",

      icon:
        <CarryOutOutlined />,
    },

    /* =====================================================
       Leave Request
    ===================================================== */

    {
      key:
        "leave",

      permission:
        "ep.leave_requests.view",

      title:
        "ขออนุมัติการลา",

      description:
        "ส่งคำขอลางานและระบุช่วงวันที่ที่ต้องการลา",

      meta:
        "ส่งคำขอของฉัน",

      href:
        "/employee/leave",

      icon:
        <CalendarOutlined />,
    },

    /* =====================================================
       Request Tracking
    ===================================================== */

    {
      key:
        "requests",

      permission:
        "ep.request_tracking.view",

      title:
        "ติดตามคำขอ",

      description:
        "ตรวจสอบสถานะคำขอที่ส่งไว้และผลการอนุมัติ",

      meta:
        pendingCount > 0
          ? `รออนุมัติ ${pendingCount} รายการ`
          : "ไม่มีรายการรออนุมัติ",

      href:
        "/employee/requests",

      icon:
        <ClockCircleOutlined />,
    },
  ].filter(
    (item) =>
      hasEmployeePortalPermission(
        user,
        item.permission
      )
  );

  /* =======================================================
     Manager Services

     Permission:
     mss.*

     จะไม่แสดงสำหรับ EMPLOYEE ธรรมดา
  ======================================================= */

  const managerServices = [
    {
      key:
        "my-team",

      permission:
        "mss.team.view",

      title:
        "ทีมของฉัน",

      description:
        "ดูข้อมูลสมาชิกในทีมและโครงสร้างผู้ใต้บังคับบัญชา",

      meta:
        "Manager Self Service",

      href:
        "/employee/team",

      icon:
        <TeamOutlined />,
    },

    {
      key:
        "team-approvals",

      permission:
        "mss.approvals.view",

      title:
        "อนุมัติคำขอ",

      description:
        "ตรวจสอบและดำเนินการคำขอที่รอการอนุมัติจากทีม",

      meta:
        "Approval Queue",

      href:
        "/employee/team-approvals",

      icon:
        <CheckCircleOutlined />,
    },
  ].filter(
    (item) =>
      hasEmployeePortalPermission(
        user,
        item.permission
      )
  );

  const showManagerServices =
    canAccessManagerSelfService(
      user
    ) &&
    managerServices.length > 0;

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div>
      {/* ===============================================
          Welcome
      =============================================== */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-blue-700
          via-blue-600
          to-indigo-700
          px-5
          py-6
          text-white
          shadow-sm

          sm:px-7
          sm:py-7
        "
      >
        <Text className="!text-sm !font-medium !text-blue-100">
          Employee Portal
        </Text>

        <Title
          level={2}
          className="!mb-1 !mt-2 !text-white"
        >
          สวัสดี{" "}
          {displayName}
        </Title>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Text className="!text-blue-100">
            รหัสพนักงาน{" "}
            {employeeCode}
          </Text>

          <span className="hidden text-blue-300 sm:inline">
            •
          </span>

          <Text className="!text-blue-100">
            {roleName}
          </Text>
        </div>

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-white/10
            bg-white/10
            px-4
            py-3
            text-sm
            text-blue-50
            backdrop-blur
          "
        >
          เลือกบริการที่ต้องการใช้งานได้จากด้านล่าง
        </div>
      </section>

      {/* ===============================================
          Employee Services
      =============================================== */}

      <section className="mt-7">
        <div className="mb-4">
          <Title
            level={4}
            className="!mb-1"
          >
            บริการของฉัน
          </Title>

          <Text className="!text-slate-500">
            ข้อมูลและบริการสำหรับพนักงาน
          </Text>
        </div>

        {employeeServices.length > 0 ? (
          <div
            className="
              grid
              grid-cols-1
              gap-4

              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {employeeServices.map(
              (item) => (
                <EmployeeServiceCard
                  key={
                    item.key
                  }
                  icon={
                    item.icon
                  }
                  title={
                    item.title
                  }
                  description={
                    item.description
                  }
                  meta={
                    item.meta
                  }
                  onClick={() =>
                    router.push(
                      item.href
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              text-center
              text-sm
              text-slate-400
            "
          >
            ยังไม่มีบริการที่คุณสามารถเข้าใช้งานได้
          </div>
        )}
      </section>

      {/* ===============================================
          Manager Self Service

          แสดงเฉพาะ User ที่มี mss.*
      =============================================== */}

      {showManagerServices && (
        <section className="mt-8">
          <div className="mb-4">
            <Title
              level={4}
              className="!mb-1"
            >
              สำหรับหัวหน้างาน
            </Title>

            <Text className="!text-slate-500">
              ดูข้อมูลทีมและรายการที่รอการอนุมัติ
            </Text>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4

              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {managerServices.map(
              (item) => (
                <EmployeeServiceCard
                  key={
                    item.key
                  }
                  icon={
                    item.icon
                  }
                  title={
                    item.title
                  }
                  description={
                    item.description
                  }
                  meta={
                    item.meta
                  }
                  onClick={() =>
                    router.push(
                      item.href
                    )
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* ===============================================
          Latest News
      =============================================== */}

      {hasEmployeePortalPermission(
        user,
        "ep.news.view"
      ) && (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <Title
                level={4}
                className="!mb-1"
              >
                ข่าวสารล่าสุด
              </Title>

              <Text className="!text-slate-500">
                ข่าวและประกาศจากบริษัท
              </Text>
            </div>

            <button
              type="button"
              className="
                shrink-0
                text-sm
                font-semibold
                text-blue-600

                hover:text-blue-700
              "
              onClick={() =>
                router.push(
                  "/employee/news"
                )
              }
            >
              ดูทั้งหมด
            </button>
          </div>

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-sm
            "
          >
            {mockNews
              .slice(
                0,
                3
              )
              .map(
                (
                  item,
                  index
                ) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    className={[
                      "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50",

                      index > 0
                        ? "border-t border-slate-100"
                        : "",
                    ].join(
                      " "
                    )}
                    onClick={() =>
                      router.push(
                        "/employee/news"
                      )
                    }
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800">
                        {item.title}
                      </div>

                      <div className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {item.summary}
                      </div>
                    </div>

                    <div className="shrink-0 text-xs text-slate-400">
                      {item.date}
                    </div>
                  </button>
                )
              )}
          </div>
        </section>
      )}

      {/* ===============================================
          Draft Notice

          ตอนต่อ API จริงสามารถลบออกได้
      =============================================== */}

      <section
        className="
          mt-8
          rounded-2xl
          border
          border-dashed
          border-slate-200
          bg-slate-50
          px-4
          py-3
          text-xs
          leading-relaxed
          text-slate-400
        "
      >
        Employee Portal อยู่ในช่วง Draft
        ข้อมูลข่าวสาร การลา และรายการติดตามบางส่วนยังเป็นข้อมูลตัวอย่าง
        ก่อนเชื่อม API และ Workflow จริง
      </section>
    </div>
  );
}