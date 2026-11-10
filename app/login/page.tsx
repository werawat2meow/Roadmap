"use client";

import {
  useState,
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { authSuccess, authError } from "@/components/AuthSwal";

import {
  Form,
  Input,
  Button,
  Alert,
  Checkbox,
} from "antd";

import {
  UserOutlined,
  LockOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

import Image from "next/image";
import styles from "./login.module.css";

import {useAuth,} from "@/contexts/AuthContext";


/* =========================================================
   Remember Me — Local Storage Keys
========================================================= */

const REMEMBER_KEY = "hrms_remember_me";
const REMEMBER_USERNAME_KEY = "hrms_remember_username";
const REMEMBER_PASSWORD_KEY = "hrms_remember_password";

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
     Remember Me — Load Saved Credentials On Mount
  ======================================================= */

  useEffect(() => {
    try {
      const remembered =
        window.localStorage.getItem(
          REMEMBER_KEY
        ) === "1";

      if (remembered) {
        const savedUsername =
          window.localStorage.getItem(
            REMEMBER_USERNAME_KEY
          ) || "";

        const savedPassword =
          window.localStorage.getItem(
            REMEMBER_PASSWORD_KEY
          ) || "";

        form.setFieldsValue({
          username: savedUsername,
          password: savedPassword,
          rememberMe: true,
        });
      }
    } catch {
      /*
       * เผื่อ localStorage ใช้งานไม่ได้ (Private Mode ฯลฯ)
       * ไม่ต้องทำอะไร ปล่อยให้ฟอร์มว่างตามปกติ
       */
    }
  }, [form]);

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
           Remember Me — Save Or Clear Credentials
        =============================================== */

        try {
          if (values.rememberMe) {
            window.localStorage.setItem(
              REMEMBER_KEY,
              "1"
            );

            window.localStorage.setItem(
              REMEMBER_USERNAME_KEY,
              username
            );

            window.localStorage.setItem(
              REMEMBER_PASSWORD_KEY,
              values.password || ""
            );
          } else {
            window.localStorage.removeItem(
              REMEMBER_KEY
            );

            window.localStorage.removeItem(
              REMEMBER_USERNAME_KEY
            );

            window.localStorage.removeItem(
              REMEMBER_PASSWORD_KEY
            );
          }
        } catch {
          /*
           * localStorage ใช้งานไม่ได้ ข้ามไป
           * ไม่กระทบขั้นตอนการ Login
           */
        }

        /* ===============================================
           Success
        =============================================== */

        await authSuccess("Login สำเร็จ");

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

        await authError(message);

        setError(
          message
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* Login presentation. Authentication and redirect stay above. */
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-heading">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50 shadow-[0_0_28px_rgba(255,211,126,0.3)]">
          <Image src="/hanuman-logo.jpg" alt="Hanuman World" width={56} height={56}
            className="h-full w-full object-cover" priority />
        </div>
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
            HRMS Enterprise
          </p>
          <h1 id="login-heading" className="text-[28px] font-bold tracking-tight text-white">
            ยินดีต้อนรับกลับ
          </h1>
          <p className="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-white/70">
            เข้าสู่ระบบเพื่อใช้งานตามสิทธิ์และขอบเขตงานที่ได้รับมอบหมาย
          </p>
        </div>
        {error ? (
          <Alert title={error} type="error" showIcon closable
            onClose={() => setError("")} className="!mb-5 !rounded-xl" />
        ) : null}
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off"
          size="large" requiredMark={false} initialValues={{ rememberMe: false }}>
          <Form.Item label={<span className="text-sm font-semibold text-white">Username</span>}
            name="username" normalize={(value) => String(value || "").replace(/\s+/g, "")}
            rules={[{ required: true, message: "กรุณากรอก Username" }]}
            className={["!mb-5", styles.field].join(" ")}>
            <Input prefix={<UserOutlined className="mr-1" />} placeholder="กรอก Username"
              autoComplete="username" spellCheck={false} />
          </Form.Item>
          <Form.Item label={<span className="text-sm font-semibold text-white">Password</span>}
            name="password" normalize={(value) => String(value || "").replace(/\s+/g, "")}
            rules={[{ required: true, message: "กรุณากรอก Password" }]}
            className={["!mb-3", styles.field].join(" ")}>
            <Input.Password prefix={<LockOutlined className="mr-1" />}
              placeholder="กรอก Password" autoComplete="current-password"
              iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />} />
          </Form.Item>
          <Form.Item name="rememberMe" valuePropName="checked"
            className={["!mb-6", styles.remember].join(" ")}>
            <Checkbox>จำรหัสผ่าน</Checkbox>
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={loading} block
              icon={!loading ? <ArrowRightOutlined /> : null} iconPlacement="end"
              className={styles.submit}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </Form.Item>
        </Form>
        <p className="mt-7 text-center text-xs text-white/55">
          สำหรับผู้ใช้งานภายในองค์กรเท่านั้น
        </p>
      </section>
    </main>
  );
}
