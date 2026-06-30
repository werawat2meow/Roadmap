"use client";

import { Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";

export default function EmployeeMasterMobileHeader({ onOpen }) {
  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#123A63] px-4 text-white lg:hidden">
      <div>
        <div className="font-bold">Employee Master</div>
        <div className="text-xs text-white/70">Admin Management</div>
      </div>

      <Button
        type="text"
        shape="circle"
        icon={<MenuOutlined />}
        onClick={onOpen}
        className="text-white hover:!bg-white/10 hover:!text-white"
      />
    </div>
  );
}