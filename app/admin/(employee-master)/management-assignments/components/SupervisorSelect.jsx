"use client";

import { Select } from "antd";

export default function SupervisorSelect({
  managementLevel,
  requiredSupervisorLevel,
  employeeId,
  value,
  options,
  onChange,
}) {
  if (managementLevel === "P12") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
        ระดับ P12 เป็นระดับสูงสุด ไม่ต้องกำหนดผู้บังคับบัญชา
      </div>
    );
  }

  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-slate-700">

        ผู้บังคับบัญชา

        <span className="ml-1 text-red-500">
          *
        </span>

      </label>

      <Select
        showSearch
        allowClear
        className="w-full"
        size="large"
        disabled={
          !employeeId ||
          !requiredSupervisorLevel
        }
        value={value || undefined}
        placeholder={
          requiredSupervisorLevel
            ? `เลือกผู้บังคับบัญชาระดับ ${requiredSupervisorLevel}`
            : "กรุณาเลือกพนักงานก่อน"
        }
        onChange={(v) => onChange(v || "")}
        options={options}
        optionFilterProp="label"
      />

      {employeeId &&
        requiredSupervisorLevel &&
        options.length === 0 && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            ยังไม่มีผู้บริหารระดับ{" "}
            <strong>
              {requiredSupervisorLevel}
            </strong>
          </div>
        )}

    </div>
  );
}