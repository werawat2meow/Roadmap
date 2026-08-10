"use client";

import {
  Button,
  Space,
} from "antd";

import {
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FilterOutlined,
  SettingOutlined,
} from "@ant-design/icons";

export default function MasterToolbar({
  loading = false,

  canCreate = false,

  createText = "เพิ่มข้อมูล",

  onCreate,

  onRefresh,

  onImport,

  onExport,

  onPrint,

  onFilter,

  onSetting,

  extra,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

      <Space wrap>

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
            {createText}
          </Button>
        )}

      </Space>

      <Space wrap>

        {onImport && (
          <Button
            icon={<UploadOutlined />}
            onClick={onImport}
          >
            Import
          </Button>
        )}

        {onExport && (
          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
          >
            Export
          </Button>
        )}

        {onPrint && (
          <Button
            icon={<PrinterOutlined />}
            onClick={onPrint}
          >
            Print
          </Button>
        )}

        {onFilter && (
          <Button
            icon={<FilterOutlined />}
            onClick={onFilter}
          >
            Filter
          </Button>
        )}

        {onSetting && (
          <Button
            icon={<SettingOutlined />}
            onClick={onSetting}
          >
            Columns
          </Button>
        )}

        {extra}

      </Space>

    </div>
  );
}