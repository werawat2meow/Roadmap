"use client";

import {
  Button,
  Select,
  Space,
} from "antd";

import {
  ClearOutlined,
} from "@ant-design/icons";

import MasterSearchBar from "@/app/admin/(employee-master)/components/master/MasterSearchBar";

/* =========================================================
   Options
========================================================= */

const statusOptions = [
  {
    label: "ทุกสถานะ",
    value: "",
  },
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

const resetPolicyOptions = [
  {
    label: "ทุกนโยบาย Reset",
    value: "",
  },
  {
    label: "ไม่รีเซ็ต",
    value: "never",
  },
  {
    label: "รีเซ็ตรายปี",
    value: "yearly",
  },
  {
    label: "รีเซ็ตรายเดือน",
    value: "monthly",
  },
];

const defaultOptions = [
  {
    label: "ทั้งหมด",
    value: "",
  },
  {
    label: "รูปแบบหลัก",
    value: "true",
  },
  {
    label: "รูปแบบทั่วไป",
    value: "false",
  },
];

/* =========================================================
   Component
========================================================= */

export default function EmployeeCodeSettingSearch({
  search = "",

  companyId = "",

  status = "",

  resetPolicy = "",

  isDefault = "",

  companies = [],

  loading = false,

  onSearchChange,

  onCompanyChange,

  onStatusChange,

  onResetPolicyChange,

  onDefaultChange,

  onClear,

  onRefresh,
}) {
  const companyOptions = [
    {
      label: "ทุกบริษัท",
      value: "",
    },

    ...companies.map((company) => ({
      value: company.id,

      label: company.company_code
        ? `${company.company_code} - ${
            company.company_name_th ||
            company.company_name_en ||
            "-"
          }`
        : company.company_name_th ||
          company.company_name_en ||
          "-",
    })),
  ];

  return (
    <MasterSearchBar
      value={search}
      loading={loading}
      placeholder="ค้นหาชื่อรูปแบบ, Pattern หรือหมายเหตุ..."
      onChange={onSearchChange}
      onRefresh={onRefresh}
      rightContent={
        <Space wrap>
          <Select
            showSearch
            allowClear
            value={companyId || undefined}
            options={companyOptions}
            placeholder="ทุกบริษัท"
            className="min-w-[220px]"
            optionFilterProp="label"
            onChange={(value) =>
              onCompanyChange?.(value || "")
            }
          />

          <Select
            allowClear
            value={status || undefined}
            options={statusOptions}
            placeholder="ทุกสถานะ"
            className="min-w-[140px]"
            onChange={(value) =>
              onStatusChange?.(value || "")
            }
          />

          <Select
            allowClear
            value={resetPolicy || undefined}
            options={resetPolicyOptions}
            placeholder="นโยบาย Reset"
            className="min-w-[180px]"
            onChange={(value) =>
              onResetPolicyChange?.(
                value || ""
              )
            }
          />

          <Select
            allowClear
            value={isDefault || undefined}
            options={defaultOptions}
            placeholder="ประเภทรูปแบบ"
            className="min-w-[150px]"
            onChange={(value) =>
              onDefaultChange?.(value || "")
            }
          />

          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
          >
            ล้างตัวกรอง
          </Button>
        </Space>
      }
    />
  );
}