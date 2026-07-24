"use client";

type Props = {
  quarter: string;
  scope: string;
  onQuarterChange: (value: string) => void;
  onScopeChange: (value: string) => void;
};

export default function ReportsHeader({
  quarter,
  scope,
  onQuarterChange,
  onScopeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-4xl font-black text-slate-900">Reports</h1>
        <p className="mt-2 text-sm text-slate-700">
          สรุปข้อมูลและรายงานภาพรวมขององค์กร
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 cursor-pointer"
        >
          Export
        </button>
      </div>
    </div>
  );
}
