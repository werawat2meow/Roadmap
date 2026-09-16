"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  swalSuccess,
  swalError,
} from "../components/Swal";

import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
} from "antd";

import {
  UserOutlined,
  LockOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  ApartmentOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
} from "@ant-design/icons";

import Image from "next/image";

import {useAuth,} from "@/contexts/AuthContext";

const {Title,Text,} = Typography;

/* =========================================================
   Helpers
========================================================= */

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return {};
  }
}

/* =========================================================
   Load Current User

   ใช้ /api/auth/me เป็น source of truth หลัง Login
   เพราะ refreshUser() อาจไม่ได้ return user กลับมา
========================================================= */

async function loadCurrentUser() {
  const response =
    await fetch(
      "/api/auth/me",
      {
        method:
          "GET",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const json =
    await readJsonResponse(
      response
    );

  if (
    !response.ok
  ) {
    throw new Error(
      json?.error ||
        json?.message ||
        "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้"
    );
  }

  /*
   * รองรับ Response Shape ได้หลายแบบ
   */
  return (
    json?.user ||
    json?.data?.user ||
    json?.data ||
    json
  );
}

/* =========================================================
   Login Destination
========================================================= */

function getLoginDestination(
  user
) {
  const roleCode =
    String(
      user?.role ||
        user?.role_code ||
        ""
    )
      .trim()
      .toUpperCase();

  const permissions =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  /* =======================================================
     1. Employee Portal

     พนักงานทั่วไปให้เข้า Employee Portal ก่อน

     สำคัญ:
     เช็ก Role ก่อน Permission เพราะ Access Assignment
     ของระบบอาจมี Permission จากหลาย Assignment รวมกัน
  ======================================================= */

  const isEmployeeRole =
    [
      "EMPLOYEE",
      "GENERAL_EMPLOYEE",
    ].includes(
      roleCode
    );

  if (
    isEmployeeRole
  ) {
    if (
      permissions.includes(
        "ep.portal.view"
      )
    ) {
      return "/employee";
    }

    /*
     * Role เป็น Employee แต่ยังไม่ได้ Permission Portal
     */
    return null;
  }

  /* =======================================================
     2. HR / Admin Portal
  ======================================================= */

  const canAccessAdmin =
    permissions.some(
      (permission) =>
        permission.startsWith(
          "ems."
        ) ||
        permission.startsWith(
          "policy."
        ) ||
        permission.startsWith(
          "system."
        ) ||
        permission.startsWith(
          "data."
        )
    );

  if (
    canAccessAdmin
  ) {
    return "/admin";
  }

  /* =======================================================
     3. Employee Portal By Permission

     เผื่อ Role Code ในอนาคตไม่ใช่ EMPLOYEE
  ======================================================= */

  const canAccessEmployeePortal =
    permissions.includes(
      "ep.portal.view"
    );

  if (
    canAccessEmployeePortal
  ) {
    return "/employee";
  }

  return null;
}

/* =========================================================
   Component
========================================================= */

export default function LoginPage() {
  const router =
    useRouter();

  const {
    refreshUser,
  } =
    useAuth();

  const [
    form,
  ] =
    Form.useForm();

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     Submit
  ======================================================= */

  const handleSubmit =
    async (
      values
    ) => {
      if (loading) {
        return;
      }

      setLoading(
        true
      );

      setError(
        ""
      );

      try {
        /* ===============================================
           Username

           ลบ space / tab / newline ทั้งหมด
        =============================================== */

        const username =
          String(
            values.username ||
              ""
          ).replace(
            /\s+/g,
            ""
          );

        /* ===============================================
           Login
        =============================================== */

        const response =
          await fetch(
            "/api/auth/login",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  username,

                  password:
                    values.password,
                }),
            }
          );

        const data =
          await readJsonResponse(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Login failed"
          );
        }

        /* ===============================================
           Refresh Auth Context
        =============================================== */

        await refreshUser();

        /* ===============================================
           Load Current User

           ใช้ข้อมูลหลัง Login จริง ๆ
        =============================================== */

        const currentUser =
          await loadCurrentUser();

        if (
          !currentUser
        ) {
          throw new Error(
            "ไม่พบข้อมูลผู้ใช้งานหลัง Login"
          );
        }

        /* ===============================================
           Find Destination
        =============================================== */

        const destination =
          getLoginDestination(
            currentUser
          );

        if (
          !destination
        ) {
          throw new Error(
            "บัญชีผู้ใช้งานยังไม่ได้รับสิทธิ์เข้าใช้งาน Portal"
          );
        }

        /* ===============================================
           Success
        =============================================== */

        await swalSuccess(
          "Login สำเร็จ"
        );

        /* ===============================================
           Redirect

           EMPLOYEE
             → /employee

           HR / ADMIN
             → /admin
        =============================================== */

        router.replace(
          destination
        );

        router.refresh();
      } catch (err) {
        const message =
          err?.message ||
          "Something went wrong";

        await swalError(
          message
        );

        setError(
          message
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#F3F6FA] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(480px,0.92fr)]">
        {/* =================================================
            Enterprise Brand Panel
        ================================================= */}
        <section className="relative hidden overflow-hidden bg-[#123A63] px-10 py-10 text-white lg:flex xl:px-14 xl:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_32%)]" />
          <div className="absolute -left-28 bottom-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -left-12 bottom-28 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute right-10 top-16 h-24 w-24 rounded-3xl border border-white/10 bg-white/[0.03] rotate-12" />

          <div className="relative z-10 flex w-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-lg shadow-black/10">
                  <Image
                    src="/hanuman-logo.jpg"
                    alt="Hanuman World"
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                    priority
                    unoptimized
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
                    Enterprise Platform
                  </p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight">
                    HRMS Enterprise
                  </h1>
                </div>
              </div>

              <div className="mt-16 max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-sky-100 backdrop-blur-sm">
                  <SafetyCertificateOutlined />
                  Secure Human Resource Management System
                </div>

                <h2 className="max-w-xl text-4xl font-bold leading-[1.18] tracking-tight xl:text-5xl">
                  จัดการข้อมูลบุคลากร
                  <span className="block text-sky-300">
                    และโครงสร้างองค์กรอย่างเป็นระบบ
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 xl:text-lg">
                  ศูนย์กลางการบริหาร Employee Master, Organization Structure,
                  Access Control และข้อมูลสำคัญด้านทรัพยากรบุคคลภายในองค์กร
                </p>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <ApartmentOutlined className="text-xl text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Organization</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    โครงสร้างบริษัทและสายงาน
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <TeamOutlined className="text-xl text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Employee</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    ข้อมูลพนักงานส่วนกลาง
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <SafetyCertificateOutlined className="text-xl text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Access Control</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Role, Permission และ Scope
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <DatabaseOutlined className="text-xl text-sky-300" />
                  <p className="mt-3 text-sm font-semibold">Central Data</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    ข้อมูลพร้อมต่อยอดทุกโมดูล
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-300">
              <span>HRMS Enterprise • Employee Management Platform</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Secure Access
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            Login Panel
        ================================================= */}
        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#123A63] lg:hidden" />

          <div className="w-full max-w-[470px]">
            {/* Mobile Brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <Image
                  src="/hanuman-logo.jpg"
                  alt="Hanuman World"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                  unoptimized
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Enterprise Platform
                </p>
                <p className="text-lg font-bold text-[#123A63]">
                  HRMS Enterprise
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 xl:p-10">
              <div className="mb-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2F9] text-lg text-[#123A63]">
                  <SafetyCertificateOutlined />
                </div>

                <Title
                  level={2}
                  className="!mb-2 !text-[30px] !font-bold !tracking-tight !text-slate-900"
                >
                  เข้าสู่ระบบ
                </Title>

                <Text className="!text-[15px] !leading-6 !text-slate-500">
                  เข้าสู่ระบบ HRMS Enterprise เพื่อใช้งานตามสิทธิ์และขอบเขตงานที่ได้รับมอบหมาย
                </Text>
              </div>

              {error ? (
                <Alert
                  title={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError("")}
                  className="!mb-6 !rounded-xl !border-red-100"
                />
              ) : null}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                size="large"
                requiredMark={false}
              >
                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      Username
                    </span>
                  }
                  name="username"
                  normalize={(value) =>
                    String(value || "").replace(/\s+/g, "")
                  }
                  rules={[
                    {
                      required: true,
                      message: "กรุณากรอก Username",
                    },
                  ]}
                  className="!mb-5"
                >
                  <Input
                    prefix={
                      <UserOutlined className="mr-1 text-slate-400" />
                    }
                    placeholder="กรอก Username"
                    autoComplete="username"
                    spellCheck={false}
                    className="!h-12 !rounded-xl !border-slate-200 !bg-slate-50/70 !px-4 hover:!border-[#7894B1] focus:!border-[#123A63]"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-sm font-semibold text-slate-700">
                      Password
                    </span>
                  }
                  name="password"
                  normalize={(value) =>
                    String(value || "").replace(/\s+/g, "")
                  }
                  rules={[
                    {
                      required: true,
                      message: "กรุณากรอก Password",
                    },
                  ]}
                  className="!mb-5"
                >
                  <Input.Password
                    prefix={
                      <LockOutlined className="mr-1 text-slate-400" />
                    }
                    placeholder="กรอก Password"
                    autoComplete="current-password"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    className="!h-12 !rounded-xl !border-slate-200 !bg-slate-50/70 !px-4 hover:!border-[#7894B1] focus:!border-[#123A63]"
                  />
                </Form.Item>

                <div className="mb-6 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500">
                  <CheckCircleFilled className="mt-0.5 text-emerald-500" />
                  <span>
                    ระบบจะตรวจสอบ Role, Permission และ Scope ก่อนนำคุณเข้าสู่ Portal ที่ได้รับอนุญาต
                  </span>
                </div>

                <Form.Item className="!mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    icon={!loading ? <ArrowRightOutlined /> : null}
                    iconPlacement="end"
                    className="!h-12 !rounded-xl !border-[#123A63] !bg-[#123A63] !text-sm !font-semibold !shadow-none hover:!border-[#0F3154] hover:!bg-[#0F3154]"
                  >
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <div className="mt-6 text-center text-xs leading-5 text-slate-400">
              <p>สำหรับผู้ใช้งานภายในองค์กรเท่านั้น</p>
              <p className="mt-1">
                © {new Date().getFullYear()} HRMS Enterprise. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
