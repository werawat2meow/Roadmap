"use client";

type Props = {
  quarter: string;
  scope: string;
  onQuarterChange: (value: string) => void;
  onScopeChange: (value: string) => void;
  onExport: () => void;
};

export default function ReportsHeader({
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-4xl font-black text-slate-900">Reports</h1>
        <p className="mt-2 text-sm text-slate-700">
          สรุปข้อมูลและรายงานภาพรวมขององค์กร
        </p>
      </div>
    </div>
  );
}