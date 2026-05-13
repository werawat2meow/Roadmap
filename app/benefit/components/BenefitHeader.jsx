"use client";

import { Card, Tag, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

export default function BenefitHeader({title,subtitle,user,badges = [],children,}) {
  return (
    <Card
      variant="borderless"
      className="overflow-hidden rounded-[32px] shadow-sm"
      styles={{ body: { padding: 0 } }}
    >
      <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 text-white lg:px-8 lg:py-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-lime-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Tag
                  key={badge}
                  className="m-0 rounded-full border-0 bg-white/15 px-4 py-1 text-white"
                >
                  {badge}
                </Tag>
              ))}
            </div>

            <h1 className="text-3xl font-bold">
              {title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-100 lg:text-base">
              {subtitle}
            </p>

            {children && (
              <div className="mt-6 flex flex-wrap gap-3">
                {children}
              </div>
            )}
          </div>

          <div className="flex min-w-[280px] items-center gap-4 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <Avatar
              size={72}
              src={
                user?.employee_photo_url ||
                undefined
              }
              icon={
                !user?.employee_photo_url ? (
                  <UserOutlined />
                ) : null
              }
              className="!bg-emerald-500"
            />

            <div>
              <div className="text-xl font-bold">
                {user?.full_name ||
                  user?.username ||
                  "-"}
              </div>

              <div className="mt-1 text-sm text-emerald-100">
                {user?.role_name ||
                  user?.role_code ||
                  "User"}
              </div>

              <div className="mt-3">
                <Tag className="m-0 rounded-full border-0 bg-white/15 text-white">
                  Active Benefit Member
                </Tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}