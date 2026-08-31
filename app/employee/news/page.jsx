"use client";

import {
  Empty,
  Tag,
  Typography,
} from "antd";

import {
  PushpinOutlined,
} from "@ant-design/icons";

import {
  useAuth,
} from "@/contexts/AuthContext";

import {
  hasEmployeePortalPermission,
} from "../lib/employeePortalAccess";

import {
  mockNews,
} from "../_mock/employeePortalMockData";

const {
  Title,
  Text,
} = Typography;

export default function EmployeeNewsPage() {
  const {
    user,
  } =
    useAuth();

  if (
    !hasEmployeePortalPermission(
      user,
      "ep.news.view"
    )
  ) {
    return (
      <Empty description="คุณไม่มีสิทธิ์ดูข่าวสาร" />
    );
  }

  return (
    <div>
      <div className="mb-5">
        <Title
          level={3}
          className="!mb-1"
        >
          ข่าวสารบริษัท
        </Title>

        <Text className="!text-slate-500">
          ข่าว ประกาศ และข้อมูลสำคัญสำหรับพนักงาน
        </Text>
      </div>

      <div className="space-y-4">
        {mockNews.map(
          (item) => (
            <article
              key={
                item.id
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag color="blue">
                  {item.category}
                </Tag>

                {item.is_pinned && (
                  <Tag
                    color="gold"
                    icon={
                      <PushpinOutlined />
                    }
                  >
                    ปักหมุด
                  </Tag>
                )}

                <span className="ml-auto text-xs text-slate-400">
                  {item.date}
                </span>
              </div>

              <div className="mt-3 text-lg font-bold text-slate-800">
                {item.title}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-slate-500">
                {item.summary}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">
                Draft Data — ภายหลังจะเชื่อมข่าวสารจริงจากฐานข้อมูล
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
}
