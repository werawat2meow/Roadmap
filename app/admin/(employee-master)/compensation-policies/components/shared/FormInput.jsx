"use client";

export default function FormInput({
  label,
  required = false,
  value,
  placeholder,
  type = "text",
  readOnly = false,
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

      <input
        type={type}
        value={value ?? ""}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e)=>onChange?.(e.target.value)}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition
        ${
          readOnly
            ? "border-slate-200 bg-slate-100"
            : "border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        }`}
      />

    </div>
  );
}