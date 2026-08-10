"use client";

import { Card, Input, Space } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

export default function MasterSearchBar({
  value = "",

  onChange,

  placeholder = "ค้นหาข้อมูล...",

  allowClear = true,

  loading = false,

  onRefresh,

  rightContent,
}) {
  return (
    <Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

        <div className="flex-1 min-w-[290px] lg:min-w-[350px]">

          <Input
            allowClear={allowClear}
            size="large"
            prefix={<SearchOutlined />}
            placeholder={placeholder}
            value={value}
            onChange={(e) =>
              onChange?.(e.target.value)
            }
          />

        </div>

        <Space>

          {onRefresh && (
            <ReloadOutlined
              onClick={onRefresh}
              spin={loading}
              className="cursor-pointer text-lg text-slate-500 hover:text-blue-600"
            />
          )}

          {rightContent}

        </Space>

      </div>

    </Card>
  );
}