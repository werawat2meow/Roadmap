"use client";

import { Card } from "antd";
import {
  AppstoreOutlined,
  TableOutlined,
  UserSwitchOutlined,
  FormOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

export default function BenefitAdminPage() {
  const cards = [
    {
      title: "Master Setup",
      desc: "ตั้งค่าข้อมูลพื้นฐานของสวัสดิการ เช่น ประเภท หมวดหมู่ กฎ และปีงบประมาณ",
      icon: <AppstoreOutlined />,
    },
    {
      title: "Benefit Matrix",
      desc: "กำหนดสิทธิ์สวัสดิการตามตำแหน่ง ประเภทพนักงาน อายุงาน และเงื่อนไขต่าง ๆ",
      icon: <TableOutlined />,
    },
    {
      title: "Entitlements",
      desc: "สร้างสิทธิ์รายบุคคล คำนวณวงเงิน ใช้ไป และยอดคงเหลือ",
      icon: <UserSwitchOutlined />,
    },
    {
      title: "Requests",
      desc: "จัดการคำขอใช้สิทธิ์สวัสดิการของพนักงาน",
      icon: <FormOutlined />,
    },
    {
      title: "Approvals",
      desc: "อนุมัติหรือปฏิเสธคำขอ พร้อมกำหนด Workflow การอนุมัติ",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "Usage",
      desc: "บันทึกการใช้งานจริง และตัดยอดคงเหลือของสิทธิ์",
      icon: <WalletOutlined />,
    },
    {
      title: "Reports",
      desc: "Dashboard และรายงานภาพรวมการใช้สวัสดิการ",
      icon: <BarChartOutlined />,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="text-2xl font-bold text-slate-800">
          Benefit Management
        </div>
        <div className="text-sm text-slate-500">
          ระบบจัดการสวัสดิการพนักงานแบบ Enterprise
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <Card
            key={item.title}
            className="rounded-3xl border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
              {item.icon}
            </div>

            <div className="mb-1 text-base font-bold text-slate-800">
              {item.title}
            </div>

            <div className="text-sm leading-6 text-slate-500">{item.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}


/*
Master Setup
🔜 Fiscal Year
🔜 Running Numbers
🔜 Attachment Requirements
*/