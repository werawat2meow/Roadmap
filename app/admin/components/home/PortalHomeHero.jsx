"use client";

import {
  Typography,
} from "antd";

import {
  AppstoreOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const {
  Title,
  Text,
} = Typography;

export default function PortalHomeHero({
  user,
}) {
  const displayName =
    user?.full_name ||
    user?.username ||
    "ผู้ใช้งาน";

  const roleName =
    user?.role_name ||
    user?.role ||
    "User";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-7 text-white lg:px-9 lg:py-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="absolute -bottom-28 left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-300">
              <AppstoreOutlined />

              <span>
                HR Central Platform
              </span>
            </div>

            <Title
              level={2}
              className="!mb-1 !text-white"
            >
              สวัสดี {displayName}
            </Title>

            <Text className="block max-w-3xl !text-slate-300">
              เริ่มจากสิ่งที่ระบบแนะนำ
              หรือค้นหาเมนูที่ต้องการใช้งานได้ทันที
              โดยข้อมูลและเมนูจะแสดงตามสิทธิ์และ Scope ของคุณ
            </Text>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <SafetyCertificateOutlined />
              บทบาทปัจจุบัน
            </div>

            <div className="mt-1 text-base font-semibold text-white">
              {roleName}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
