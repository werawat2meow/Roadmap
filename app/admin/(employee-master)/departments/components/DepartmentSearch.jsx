"use client";

export default function DepartmentSearch({ value, onChange }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        placeholder="ค้นหารหัสแผนก / ชื่อแผนก / ชื่อหรือรหัสสังกัด"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}
