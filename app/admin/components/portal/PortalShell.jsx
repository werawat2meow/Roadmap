"use client";

import {
  Typography,
} from "antd";

const {
  Title,
  Text,
} = Typography;

export default function AdminPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Text className="!text-blue-600">
          HR Central Platform
        </Text>

        <Title
          level={2}
          className="!mb-2 !mt-2"
        >
          HR System
        </Title>

        <Text className="!text-slate-500">
          เลือกระบบที่ต้องการใช้งานจากเมนูด้านซ้าย
        </Text>
      </div>
    </div>
  );
}