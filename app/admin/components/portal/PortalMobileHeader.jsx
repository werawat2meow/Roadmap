"use client";

import {
  Button,
} from "antd";

import {
  AppstoreOutlined,
  MenuOutlined,
} from "@ant-design/icons";

export default function PortalMobileHeader({
  onOpen,
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#224a70] via-[#173a5d] to-[#102f50] px-4 text-white shadow-lg lg:hidden">
      {/* =================================================
          Brand
      ================================================= */}

      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 grid-cols-2 gap-1 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-950/30">
          <span className="rounded-sm bg-white" />
          <span className="rounded-sm bg-white" />
          <span className="rounded-sm bg-white" />
          <span className="rounded-sm bg-white" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-wide text-white">
            HR System
          </div>

          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/50">
            People Management
          </div>
        </div>
      </div>

      {/* =================================================
          Open Sidebar
      ================================================= */}

      <Button
        type="text"
        shape="circle"
        icon={
          <MenuOutlined />
        }
        onClick={() =>
          onOpen?.()
        }
        className="!flex !h-10 !w-10 !items-center !justify-center !bg-white/5 !text-white/80 hover:!bg-white/10 hover:!text-white"
      />
    </div>
  );
}