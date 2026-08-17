"use client";

import {
  Typography,
} from "antd";

import {
  AppstoreOutlined,
} from "@ant-design/icons";

import PortalShell from "./components/portal/PortalShell";

const {
  Title,
  Text,
} = Typography;

export default function AdminPage() {
  return (
    <PortalShell>
      <div className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          {/* =================================================
              Welcome
          ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white lg:px-9 lg:py-10">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative z-10 max-w-3xl">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-300">
                  <AppstoreOutlined />

                  <span>
                    HR Central Platform
                  </span>
                </div>

                <Title
                  level={2}
                  className="!mb-3 !text-white"
                >
                  HR System
                </Title>

                <Text className="block max-w-2xl text-base leading-relaxed !text-slate-300">
                  เลือกระบบที่ต้องการใช้งานจากเมนูด้านซ้าย
                  ระบบแต่ละตัวจะเชื่อมไปยังหน้าจริงของระบบนั้น
                  โดยไม่กระทบโครงสร้างภายในของ Employee Master
                </Text>
              </div>
            </div>
          </section>

          {/* =================================================
              Information
          ================================================= */}

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-400">
                Employee
              </div>

              <div className="mt-2 text-lg font-bold text-slate-800">
                Employee Management
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-500">
                เข้า Dashboard, รายชื่อพนักงาน,
                เพิ่มพนักงาน และหน้าตั้งค่าที่กำหนดไว้
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-400">
                HR Services
              </div>

              <div className="mt-2 text-lg font-bold text-slate-800">
                Benefit / Leave / HRM
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-500">
                ใช้ Portal เป็นจุดเชื่อมเข้าสู่ระบบย่อย
                โดยแต่ละระบบยังใช้ Layout ของตัวเอง
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-400">
                Payroll & Others
              </div>

              <div className="mt-2 text-lg font-bold text-slate-800">
                Connected Systems
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-500">
                Payroll, Recruitment, Asset, Roadmap
                และระบบอื่นสามารถเพิ่ม Link ได้จากไฟล์ Portal Menu
              </div>
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}