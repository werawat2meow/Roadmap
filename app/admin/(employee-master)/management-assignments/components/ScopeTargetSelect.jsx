"use client";

import { Select } from "antd";
import {
  SCOPE_FIELD_BY_TYPE,
  SCOPE_LABELS,
} from "../utils/scopeUtils";

/* =========================================================
   Option Helpers
========================================================= */

function getOptionValue(item) {
  return (
    item?.value ||
    item?.id ||
    ""
  );
}

function getCompanyLabel(item) {
  return (
    item?.label ||
    item?.company_name_th ||
    item?.company_name_en ||
    item?.company_name ||
    item?.name ||
    "-"
  );
}

function getBranchGroupLabel(item) {
  return (
    item?.label ||
    item?.branch_group_name ||
    item?.group_name ||
    item?.name ||
    "-"
  );
}

function getBranchLabel(item) {
  const code =
    item?.branch_code ||
    item?.code ||
    "";

  const name =
    item?.branch_name ||
    item?.name ||
    item?.label ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function getDepartmentLabel(item) {
  const code =
    item?.department_code ||
    item?.code ||
    "";

  const name =
    item?.department_name ||
    item?.name ||
    item?.label ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function getDivisionLabel(item) {
  const code =
    item?.division_code ||
    item?.code ||
    "";

  const name =
    item?.division_name ||
    item?.name ||
    item?.label ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function getUnitLabel(item) {
  const code =
    item?.unit_code ||
    item?.code ||
    "";

  const name =
    item?.unit_name ||
    item?.name ||
    item?.label ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function mapOptions(items, getLabel) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      value: getOptionValue(item),
      label: getLabel(item),
    }))
    .filter((item) => Boolean(item.value));
}

/* =========================================================
   ScopeTargetSelect
========================================================= */

export default function ScopeTargetSelect({
  scope,
  options,
  loading = false,
  disabled = false,
  onChange,
}) {
  const scopeType =
    scope?.scope_type || "";

  const targetField =
    SCOPE_FIELD_BY_TYPE[scopeType];

  if (!scopeType) {
    return (
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          ขอบเขตที่ดูแล
        </label>

        <div className="flex min-h-10 items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-400">
          กรุณาเลือกประเภทขอบเขตก่อน
        </div>
      </div>
    );
  }

  if (scopeType === "all") {
    return (
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          ขอบเขตที่ดูแล
        </label>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-sm font-bold text-violet-700">
            ทั้งองค์กร
          </p>

          <p className="mt-1 text-xs text-violet-500">
            ผู้บริหารจะมีขอบเขตครอบคลุมทุกบริษัทและทุกหน่วยงาน
          </p>
        </div>
      </div>
    );
  }

  let selectOptions = [];

  if (scopeType === "company") {
    selectOptions = mapOptions(
      options?.companies,
      getCompanyLabel
    );
  }

  if (scopeType === "branch_group") {
    selectOptions = mapOptions(
      options?.branchGroups,
      getBranchGroupLabel
    );
  }

  if (scopeType === "branch") {
    selectOptions = mapOptions(
      options?.branches,
      getBranchLabel
    );
  }

  if (scopeType === "department") {
    selectOptions = mapOptions(
      options?.departments,
      getDepartmentLabel
    );
  }

  if (scopeType === "division") {
    selectOptions = mapOptions(
      options?.divisions,
      getDivisionLabel
    );
  }

  if (scopeType === "unit") {
    selectOptions = mapOptions(
      options?.units,
      getUnitLabel
    );
  }

  const currentValue =
    targetField
      ? scope?.[targetField]
      : "";

  const targetLabel =
    SCOPE_LABELS[scopeType] ||
    "ขอบเขต";

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        เลือก{targetLabel}

        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      <Select
        showSearch
        allowClear
        size="large"
        className="w-full"
        loading={loading}
        disabled={
          disabled ||
          !targetField
        }
        value={currentValue || undefined}
        placeholder={`เลือก${targetLabel}`}
        options={selectOptions}
        optionFilterProp="label"
        filterOption={(input, option) =>
          String(option?.label || "")
            .toLowerCase()
            .includes(
              String(input || "").toLowerCase()
            )
        }
        onChange={(nextValue) => {
          if (!targetField) {
            return;
          }

          onChange(
            targetField,
            nextValue || ""
          );
        }}
        notFoundContent={
          loading
            ? "กำลังโหลด..."
            : `ไม่พบข้อมูล${targetLabel}`
        }
      />
    </div>
  );
}