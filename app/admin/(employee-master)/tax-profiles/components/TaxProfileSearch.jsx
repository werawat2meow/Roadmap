"use client";

import {
  Button,
  Input,
  Select,
  Space,
} from "antd";

import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Option } = Select;

export default function TaxProfileSearch({
  value = "",
  status = "",
  taxYear = "",
  companyId = "",

  companies = [],

  loading = false,

  onSearch,

  onStatusChange,

  onTaxYearChange,

  onCompanyChange,

  onRefresh,
}) {
  return (
    <Space
      wrap
      style={{
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <Space wrap>
        {/* =========================
            Search
        ========================= */}

        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="ค้นหารหัส / ชื่อโปรไฟล์ภาษี"
          style={{
            width: 320,
          }}
          value={value}
          onChange={(e) =>
            onSearch?.(e.target.value)
          }
        />

        {/* =========================
            Company
        ========================= */}

        <Select
          allowClear
          placeholder="บริษัท"
          style={{
            width: 220,
          }}
          value={
            companyId || undefined
          }
          onChange={onCompanyChange}
        >
          {companies.map((item) => (
            <Option
              key={item.id}
              value={item.id}
            >
              {item.company_code} -{" "}
              {item.company_name_th}
            </Option>
          ))}
        </Select>

        {/* =========================
            Tax Year
        ========================= */}

        <Input
          placeholder="ปีภาษี"
          style={{
            width: 140,
          }}
          value={taxYear}
          onChange={(e) =>
            onTaxYearChange?.(
              e.target.value
            )
          }
        />

        {/* =========================
            Status
        ========================= */}

        <Select
          allowClear
          placeholder="สถานะ"
          style={{
            width: 160,
          }}
          value={status || undefined}
          onChange={onStatusChange}
        >
          <Option value="active">
            ใช้งาน
          </Option>

          <Option value="inactive">
            ไม่ใช้งาน
          </Option>
        </Select>
      </Space>

      {/* =========================
          Refresh
      ========================= */}

      <Button
        icon={<ReloadOutlined />}
        loading={loading}
        onClick={onRefresh}
      >
        รีเฟรช
      </Button>
    </Space>
  );
}