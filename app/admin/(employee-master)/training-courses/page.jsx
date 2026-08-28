"use client";

import { Typography } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function DataExportComingSoonPage() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-6">
          <RocketOutlined className="!text-white text-4xl" />
        </div>

        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-4">
          หลักสูตรอบรม
        </div>

        <Title level={2} className="!mb-2 !text-slate-800">
          Coming Soon
        </Title>
        <Text className="text-slate-500 block max-w-sm mx-auto mb-8">
          ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา เร็ว ๆ นี้คุณจะสามารถส่งออกข้อมูลพนักงานได้จากหน้านี้
        </Text>

      </div>
    </div>
  );
}