"use client";

export default function SortOrderField({
  label = "ลำดับ",
  value = 0,
  disabled = false,
  required = false,
  min = 0,
  max = 9999,
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

      <input
        type="number"
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        onChange={(e) =>
          onChange?.(
            Number(e.target.value || 0)
          )
        }
        className="
          w-full
          rounded-2xl
          border
          border-slate-300
          px-4
          py-3
          text-sm
          outline-none
          transition
          focus:border-slate-500
          focus:ring-4
          focus:ring-slate-100
        "
      />
    </div>
  );
}