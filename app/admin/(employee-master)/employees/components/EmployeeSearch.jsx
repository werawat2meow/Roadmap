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
   OPTIONS
========================================================= */

const statusOptions = [
  {
    label: "ทุกสถานะระบบ",
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
  {
    label: "ลาออก",
    value: "resigned",
  },
];

const accountOptions = [
  {
    label: "บัญชีผู้ใช้ทั้งหมด",
    value: "",
  },
  {
    label: "มีบัญชีผู้ใช้",
    value: "true",
  },
  {
    label: "ไม่มีบัญชีผู้ใช้",
    value: "false",
  },
];

/* =========================================================
   HELPERS
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

function getBranchGroupLabel(item) {
  if (!item) {
    return "-";
  }

  if (item.group_code) {
    return `${item.group_code} - ${item.group_name || "-"}`;
  }

  return item.group_name || "-";
}

function getBranchLabel(item) {
  if (!item) {
    return "-";
  }

  if (item.branch_code) {
    return `${item.branch_code} - ${item.branch_name || "-"}`;
  }

  return item.branch_name || "-";
}

function getDepartmentLabel(item) {
  if (!item) {
    return "-";
  }

  if (item.department_code) {
    return `${item.department_code} - ${
      item.department_name || "-"
    }`;
  }

  return item.department_name || "-";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EmployeeSearch({
  search = "",

  companyId = "",
  branchGroupId = "",
  branchId = "",
  departmentId = "",

  employeeStatusId = "",
  employmentTypeId = "",

  status = "",
  hasUserAccount = "",

  companies = [],
  branchGroups = [],
  branches = [],
  departments = [],
  employeeStatuses = [],
  employmentTypes = [],

  loading = false,
  masterLoading = false,

  onSearchChange,

  onCompanyChange,
  onBranchGroupChange,
  onBranchChange,
  onDepartmentChange,

  onEmployeeStatusChange,
  onEmploymentTypeChange,

  onStatusChange,
  onHasUserAccountChange,

  onClear,
  onRefresh,
}) {
  const companyOptions =
    companies.map((item) => ({
      value: item.id,
      label: getCompanyLabel(item),
    }));

  const branchGroupOptions =
    branchGroups.map((item) => ({
      value: item.id,
      label: getBranchGroupLabel(item),
    }));

  const filteredBranches =
    companyId
      ? branches.filter(
          (item) =>
            item.company_id === companyId
        )
      : branches;

  const branchOptions =
    filteredBranches.map((item) => ({
      value: item.id,
      label: getBranchLabel(item),
    }));

  const departmentOptions =
    departments.map((item) => ({
      value: item.id,
      label: getDepartmentLabel(item),
    }));

  const employeeStatusOptions =
    employeeStatuses.map((item) => ({
      value: item.id,
      label:
        item.status_code
          ? `${item.status_code} - ${item.status_name || "-"}`
          : item.status_name || "-",
    }));

  const employmentTypeOptions =
    employmentTypes.map((item) => ({
      value: item.id,
      label: item.type_code? `${item.type_code} - ${item.type_name || "-"}` : item.employment_type_name || "-",
    }));
    
  return (
    <MasterSearchBar
      value={search}
      loading={loading}
      placeholder="ค้นหารหัสพนักงาน ชื่อ นามสกุล เบอร์โทร อีเมล เลขบัตรประชาชน..."
      onChange={onSearchChange}
      onRefresh={onRefresh}
      rightContent={
        <Space wrap>
          <Select
            showSearch
            allowClear
            loading={masterLoading}
            value={companyId || undefined}
            options={companyOptions}
            placeholder="ทุกบริษัท"
            className="min-w-[220px]"
            optionFilterProp="label"
            onChange={(value) =>
              onCompanyChange?.(
                value || ""
              )
            }
          />

          <Select
            showSearch
            allowClear
            loading={masterLoading}
            value={
              branchGroupId ||
              undefined
            }
            options={branchGroupOptions}
            placeholder="ทุกกรุ๊ปสังกัด"
            className="min-w-[200px]"
            optionFilterProp="label"
            onChange={(value) =>
              onBranchGroupChange?.(
                value || ""
              )
            }
          />

          <Select
            showSearch
            allowClear
            loading={masterLoading}
            value={branchId || undefined}
            options={branchOptions}
            placeholder="ทุกสังกัด"
            className="min-w-[200px]"
            optionFilterProp="label"
            onChange={(value) =>
              onBranchChange?.(
                value || ""
              )
            }
          />

          <Select
            showSearch
            allowClear
            loading={masterLoading}
            value={
              departmentId ||
              undefined
            }
            options={departmentOptions}
            placeholder="ทุกแผนก"
            className="min-w-[200px]"
            optionFilterProp="label"
            onChange={(value) =>
              onDepartmentChange?.(
                value || ""
              )
            }
          />

          <Select
            showSearch
            allowClear
            loading={masterLoading}
            value={
              employmentTypeId ||
              undefined
            }
            options={
              employmentTypeOptions
            }
            placeholder="ทุกประเภทการจ้าง"
            className="min-w-[190px]"
            optionFilterProp="label"
            onChange={(value) =>
              onEmploymentTypeChange?.(
                value || ""
              )
            }
          />

          <Select
            showSearch
            allowClear
            loading={masterLoading}
            value={
              employeeStatusId ||
              undefined
            }
            options={
              employeeStatusOptions
            }
            placeholder="ทุกสถานะพนักงาน"
            className="min-w-[190px]"
            optionFilterProp="label"
            onChange={(value) =>
              onEmployeeStatusChange?.(
                value || ""
              )
            }
          />

          <Select
            allowClear
            value={status || undefined}
            options={statusOptions}
            placeholder="สถานะระบบ"
            className="min-w-[140px]"
            onChange={(value) =>
              onStatusChange?.(
                value || ""
              )
            }
          />

          <Select
            allowClear
            value={
              hasUserAccount ||
              undefined
            }
            options={accountOptions}
            placeholder="บัญชีผู้ใช้"
            className="min-w-[160px]"
            onChange={(value) =>
              onHasUserAccountChange?.(
                value || ""
              )
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