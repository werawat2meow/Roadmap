"use client";

import { Button, Input, Select, Space } from "antd";
import {
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  STATUS_OPTIONS,
  TAX_IDENTITY_OPTIONS,
} from "./statutoryProfileOptions";

export default function EmployeeStatutoryProfileSearch({
  search,
  onSearchChange,
  status,
  onStatusChange,
  identityType,
  onIdentityTypeChange,
  socialRegistered,
  onSocialRegisteredChange,
  onCreate,
  onRefresh,
  onImport,
  onDownloadTemplate,
  onExport,
  canCreate = false,
  canImport = false,
  canExport = false,
  loading = false,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <Input
          allowClear
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          prefix={<SearchOutlined />}
          placeholder="ค้นหา รหัสพนักงาน / ชื่อ / บัตรประชาชน / Passport"
          className="w-full sm:max-w-[360px]"
        />

        <Select
          allowClear
          value={status || undefined}
          onChange={(value) => onStatusChange?.(value || "")}
          placeholder="สถานะ"
          options={STATUS_OPTIONS}
          className="min-w-[140px]"
        />

        <Select
          allowClear
          value={identityType || undefined}
          onChange={(value) => onIdentityTypeChange?.(value || "")}
          placeholder="Tax Identity"
          options={TAX_IDENTITY_OPTIONS}
          className="min-w-[220px]"
        />

        <Select
          allowClear
          value={socialRegistered || undefined}
          onChange={(value) => onSocialRegisteredChange?.(value || "")}
          placeholder="ประกันสังคม"
          className="min-w-[170px]"
          options={[
            { value: "true", label: "ขึ้นทะเบียนแล้ว" },
            { value: "false", label: "ไม่ขึ้นทะเบียน" },
          ]}
        />
      </div>

      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          รีเฟรช
        </Button>

        {canImport ? (
          <>
            <Button icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
              Template CSV
            </Button>
            <Button icon={<ImportOutlined />} onClick={onImport}>
              Import CSV
            </Button>
          </>
        ) : null}

        {canExport ? (
          <Button icon={<ExportOutlined />} onClick={onExport}>
            Export CSV
          </Button>
        ) : null}

        {canCreate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            เพิ่มข้อมูล
          </Button>
        ) : null}
      </Space>
    </div>
  );
}
