"use client";

import {
  Button,
  Card,
  Input,
  Space,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function PayrollTypeSearch({
  search,
  setSearch,

  loading,

  canCreate,

  onRefresh,
  onCreate,
}) {
  return (
    <Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="ค้นหารหัส / ชื่อ Payroll Cycle"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="lg:max-w-lg"
        />

        <Space>

          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={onRefresh}
          >
            Refresh
          </Button>

          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreate}
            >
              เพิ่ม Payroll Cycle
            </Button>
          )}

        </Space>

      </div>

    </Card>
  );
}