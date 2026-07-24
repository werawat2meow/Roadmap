"use client";

export default function PositionSearch({
  value,
  onChange,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        placeholder="ค้นหารหัสตำแหน่ง / ชื่อตำแหน่ง / Position Family"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}