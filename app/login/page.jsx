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
  Card,
  Typography,
} from "antd";

import {
  UserOutlined,
  LockOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 px-4 py-8">
      <div className="rb-wrap w-full max-w-5xl">
        <div className="rb-glow" />

        <div className="rb-border" />

        <div className="rb-inner" />

        <div className="relative z-[2] grid grid-cols-1 overflow-hidden rounded-[27px] bg-white shadow-2xl lg:grid-cols-2">
          {/* =================================================
              Left Section
          ================================================= */}

          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-10 text-white lg:flex">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                HR Administration Platform
              </div>

              <div className="mt-8 space-y-4">
                <Title
                  level={1}
                  className="!mb-0 !text-4xl !leading-tight !text-white"
                >
                  Employee System
                </Title>

                <Text className="block max-w-md text-base leading-7 !text-emerald-50">
                  Manage employee profiles,
                  organization structure,
                  and HR administration in
                  one centralized system
                  with a clean and modern
                  workflow.
                </Text>
              </div>

              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Centralized
                    Employee Data
                  </p>

                  <p className="mt-1 text-sm text-emerald-100">
                    Keep all employee
                    records in one secure
                    and searchable place.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Organization
                    Structure
                  </p>

                  <p className="mt-1 text-sm text-emerald-100">
                    Manage company,
                    department, branch,
                    and employment setup
                    clearly.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Ready for HR
                    Expansion
                  </p>

                  <p className="mt-1 text-sm text-emerald-100">
                    Extend toward
                    benefits, attendance,
                    leave, and payroll
                    modules later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              Right Section
          ================================================= */}

          <div className="flex items-center justify-center bg-white p-6 sm:p-10">
            <Card
              variant="borderless"
              className="w-full max-w-md shadow-none"
              styles={{
                body: {
                  padding: 0,
                },
              }}
            >
              {/* =============================================
                  Logo
              ============================================= */}

              <div className="mb-8 flex text-center">
                <Image
                  src="/hanuman-logo.jpg"
                  alt="Hanuman World"
                  width={100}
                  height={100}
                  className="mx-auto rounded-full object-cover"
                  loading="eager"
                  unoptimized
                />
              </div>

              {/* =============================================
                  Header
              ============================================= */}

              <div className="mb-8">
                <Title
                  level={2}
                  className="!mb-1 !text-slate-800"
                >
                  Welcome Back
                </Title>

                <Text className="text-slate-500">
                  Please enter your
                  username and password
                </Text>
              </div>

              {/* =============================================
                  Error
              ============================================= */}

              {error ? (
                <Alert
                  title={
                    error
                  }
                  type="error"
                  showIcon
                  className="!mb-5 rounded-xl"
                />
              ) : null}

              {/* =============================================
                  Form
              ============================================= */}

              <Form
                form={form}
                layout="vertical"
                onFinish={
                  handleSubmit
                }
                autoComplete="off"
                size="large"
              >
                {/* ===========================================
                    Username
                =========================================== */}

                <Form.Item
                  label={
                    <span className="font-medium text-slate-700">
                      Username
                    </span>
                  }
                  name="username"
                  normalize={(
                    value
                  ) =>
                    String(
                      value || ""
                    ).replace(
                      /\s+/g,
                      ""
                    )
                  }
                  rules={[
                    {
                      required:
                        true,

                      message:
                        "Please enter username",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <UserOutlined className="text-slate-400" />
                    }
                    placeholder="Enter username"
                    autoComplete="username"
                    className="!rounded-2xl !py-2"
                  />
                </Form.Item>

                {/* ===========================================
                    Password
                =========================================== */}

                <Form.Item
                  label={
                    <span className="font-medium text-slate-700">
                      Password
                    </span>
                  }
                  name="password"
                  normalize={(
                    value
                  ) =>
                    String(
                      value || ""
                    ).replace(
                      /\s+/g,
                      ""
                    )
                  }
                  rules={[
                    {
                      required:
                        true,

                      message:
                        "Please enter password",
                    },
                  ]}
                >
                  <Input.Password
                    prefix={
                      <LockOutlined className="text-slate-400" />
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                    iconRender={(
                      visible
                    ) =>
                      visible ? (
                        <EyeTwoTone />
                      ) : (
                        <EyeInvisibleOutlined />
                      )
                    }
                    className="!rounded-2xl !py-2"
                  />
                </Form.Item>

                {/* ===========================================
                    Submit
                =========================================== */}

                <Form.Item className="!mb-3">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={
                      loading
                    }
                    block
                    className="login-btn relative !h-12 overflow-hidden !rounded-2xl !border-slate-900 !bg-slate-900 text-sm font-semibold hover:!bg-slate-800"
                  >
                    {loading
                      ? "Signing in..."
                      : "Login"}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * 
 * 
 * HR/Admin Permission → /admin
 * EMPLOYEE / ep.portal.view → /employee
 * 
 */