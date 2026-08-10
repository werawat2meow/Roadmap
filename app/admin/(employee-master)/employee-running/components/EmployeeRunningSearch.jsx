"use client";

import {
  Button,
  InputNumber,
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

const monthOptions = [
  {
    label: "ทุกเดือน",
    value: "",
  },
  {
    label: "ไม่แยกเดือน",
    value: "0",
  },
  {
    label: "มกราคม",
    value: "1",
  },
  {
    label: "กุมภาพันธ์",
    value: "2",
  },
  {
    label: "มีนาคม",
    value: "3",
  },
  {
    label: "เมษายน",
    value: "4",
  },
  {
    label: "พฤษภาคม",
    value: "5",
  },
  {
    label: "มิถุนายน",
    value: "6",
  },
  {
    label: "กรกฎาคม",
    value: "7",
  },
  {
    label: "สิงหาคม",
    value: "8",
  },
  {
    label: "กันยายน",
    value: "9",
  },
  {
    label: "ตุลาคม",
    value: "10",
  },
  {
    label: "พฤศจิกายน",
    value: "11",
  },
  {
    label: "ธันวาคม",
    value: "12",
  },
];

/* =========================================================
   Helpers
========================================================= */

function getCompanyLabel(company) {
  const companyName =
    company?.company_name_th ||
    company?.company_name_en ||
    "-";

  if (company?.company_code) {
    return `${company.company_code} - ${companyName}`;
  }

  return companyName;
}

function getSettingLabel(setting) {
  const codeName =
    setting?.code_name || "-";

  const pattern =
    setting?.code_pattern || "";

  if (pattern) {
    return `${codeName} (${pattern})`;
  }

  return codeName;
}

/* =========================================================
   Component
========================================================= */

export default function EmployeeRunningSearch({
  search = "",

  companyId = "",

  settingId = "",

  runningYear = "",

  runningMonth = "",

  status = "",

  companies = [],

  settings = [],

  loading = false,

  companyLoading = false,

  settingLoading = false,

  onSearchChange,

  onCompanyChange,

  onSettingChange,

  onRunningYearChange,

  onRunningMonthChange,

  onStatusChange,

  onClear,

  onRefresh,
}) {
  const companyOptions =
    companies.map((company) => ({
      value: company.id,
      label: getCompanyLabel(company),
    }));

  const filteredSettings =
    companyId
      ? settings.filter(
          (setting) =>
            setting.company_id === companyId
        )
      : settings;

  const settingOptions =
    filteredSettings.map((setting) => ({
      value: setting.id,
      label: getSettingLabel(setting),
    }));

  return (
    <MasterSearchBar
      value={search}
      loading={loading}
      placeholder="ค้นหารหัสพนักงานล่าสุด หรือหมายเหตุ..."
      onChange={onSearchChange}
      onRefresh={onRefresh}
      rightContent={
        <Space wrap>
          <Select
            showSearch
            allowClear
            loading={companyLoading}
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
            showSearch
            allowClear
            loading={settingLoading}
            value={settingId || undefined}
            options={settingOptions}
            placeholder="ทุกรูปแบบรหัส"
            className="min-w-[220px]"
            optionFilterProp="label"
            onChange={(value) =>
              onSettingChange?.(value || "")
            }
          />

          <InputNumber
            min={0}
            max={9999}
            precision={0}
            value={
              runningYear === ""
                ? null
                : Number(runningYear)
            }
            placeholder="ปี Running"
            className="w-[130px]"
            onChange={(value) =>
              onRunningYearChange?.(
                value === null ||
                  value === undefined
                  ? ""
                  : String(value)
              )
            }
          />

          <Select
            allowClear
            value={
              runningMonth || undefined
            }
            options={monthOptions}
            placeholder="ทุกเดือน"
            className="min-w-[150px]"
            onChange={(value) =>
              onRunningMonthChange?.(
                value || ""
              )
            }
          />

          <Select
            allowClear
            value={status || undefined}
            options={statusOptions}
            placeholder="ทุกสถานะ"
            className="min-w-[130px]"
            onChange={(value) =>
              onStatusChange?.(value || "")
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