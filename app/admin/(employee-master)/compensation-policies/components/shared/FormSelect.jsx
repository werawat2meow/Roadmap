"use client";

export default function FormSelect({
  label,
  required = false,
  value,
  options = [],
  placeholder = "Select",
  onChange,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">

        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}

      </label>

      <select
        value={value ?? ""}
        onChange={(e)=>onChange?.(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
      >

        <option value="">
          {placeholder}
        </option>

        {options.map((item)=>(
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}

      </select>

    </div>
  );
}