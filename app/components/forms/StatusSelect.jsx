"use client";

export default function StatusSelect({
  label = "สถานะ",
  value = "active",
  disabled = false,
  required = false,
  activeLabel = "ใช้งาน",
  inactiveLabel = "ไม่ใช้งาน",
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          w-full
          rounded-2xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          text-sm
          outline-none
          transition
          focus:border-slate-500
          focus:ring-4
          focus:ring-slate-100
        "
      >
        <option value="active">
          {activeLabel}
        </option>

        <option value="inactive">
          {inactiveLabel}
        </option>
      </select>
    </div>
  );
}