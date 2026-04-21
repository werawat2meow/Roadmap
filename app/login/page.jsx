"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { swalSuccess, swalError } from "../components/Swal";
import { Form, Input, Button, Alert, Card, Typography } from "antd";
import { UserOutlined, LockOutlined, EyeTwoTone, EyeInvisibleOutlined } from "@ant-design/icons";
import Image from "next/image";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values) => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username.trim(),
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      swalSuccess("Login สำเร็จ");
      localStorage.setItem("employee_user", JSON.stringify(data.user));
      router.push("/admin");
      router.refresh();

    } catch (err) {
      swalError(err.message);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[28px] overflow-hidden shadow-2xl border border-slate-200 bg-white">
        
        {/* Left Section */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-10 relative overflow-hidden">
          {/* background glow */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              HR Administration Platform
            </div>

            <div className="mt-8 space-y-4">
              <Title level={1} className="!text-white !mb-0 !text-4xl !leading-tight">
                Employee
                <br />
                Master System
              </Title>

              <Text className="!text-emerald-50 text-base leading-7 block max-w-md">
                Manage employee profiles, organization structure, and HR administration
                in one centralized system with a clean and modern workflow.
              </Text>
            </div>

            <div className="mt-10 space-y-4">
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Centralized Employee Data</p>
                <p className="text-sm text-emerald-100 mt-1">
                  Keep all employee records in one secure and searchable place.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Organization Structure</p>
                <p className="text-sm text-emerald-100 mt-1">
                  Manage company, department, branch, and employment setup clearly.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Ready for HR Expansion</p>
                <p className="text-sm text-emerald-100 mt-1">
                  Extend toward benefits, attendance, leave, and payroll modules later.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Section */}
        <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
          <Card
            variant="borderless"
            className="w-full max-w-md shadow-none"
            styles={{ body: { padding: 0 } }}
          >
            <div className="flex text-center mb-8 ">
              <Image
                src="/hanuman-logo.jpg"
                alt="Hanuman World"
                width={100}
                height={100}
                className="mx-auto rounded-full object-cover"
                style={{ width: "auto", height: "auto" }}
                loading="eager"
              />
            </div>

            <div className="mb-8">
              <Title level={2} className="!mb-1 !text-slate-800">
                Welcome Back
              </Title>
              <Text className="text-slate-500">
                Please enter your username and password
              </Text>
            </div>

            {error ? (
              <Alert
                title={error}
                type="error"
                showIcon
                className="!mb-5 rounded-xl"
              />
            ) : null}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                label={<span className="font-medium text-slate-700">Username</span>}
                name="username"
                rules={[{ required: true, message: "Please enter username" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="!rounded-2xl !py-2"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-slate-700">Password</span>}
                name="password"
                rules={[{ required: true, message: "Please enter password" }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  className="!rounded-2xl !py-2"
                />
              </Form.Item>

              <Form.Item className="!mb-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="login-btn !h-12 !rounded-2xl !bg-slate-900 hover:!bg-slate-800 !border-slate-900 text-sm font-semibold relative overflow-hidden"
                >
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </Form.Item>
            </Form>
            
          </Card>
        </div>
      </div>
    </div>
  );
}