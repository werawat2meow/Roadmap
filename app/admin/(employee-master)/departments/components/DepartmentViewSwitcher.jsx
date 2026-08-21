"use client";

export default function DepartmentViewSwitcher({ value, onChange }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onChange("matrix")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
          value === "matrix"
            ? "bg-[#123A63] text-white"
            : "border border-slate-300 bg-white text-slate-600"
        }`}
      >
        Matrix View
      </button>

      <button
        type="button"
        onClick={() => onChange("table")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
          value === "table"
            ? "bg-[#123A63] text-white"
            : "border border-slate-300 bg-white text-slate-600"
        }`}
      >
        Table View
      </button>
    </div>
  );
}
