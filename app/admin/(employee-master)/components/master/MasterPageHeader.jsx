"use client";

import { Button, Space } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

export default function MasterPageHeader({
  icon,
  title,
  subtitle,

  loading = false,

  canRefresh = true,
  canCreate = true,

  createText = "เพิ่มข้อมูล",

  onRefresh,
  onCreate,

  extra,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}

        <div>

          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">

            {icon}

            {title}

          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">
              {subtitle}
            </p>
          )}

        </div>

        {/* Right */}

        <Space wrap>

          {extra}

          {canRefresh && (
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          )}

          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreate}
            >
              {createText}
            </Button>
          )}

        </Space>

      </div>
    </motion.div>
  );
}