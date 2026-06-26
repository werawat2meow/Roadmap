'use client';

type Props = {
  title: string;
  value: string;
  label: string;
  colorClass?: string;
};

export default function ReportCard({ title, value, label, colorClass = 'bg-blue-50 text-blue-700' }: Props) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-2xl px-3 py-2 text-xs font-semibold ${colorClass}`}>
        {title}
      </div>
      <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-700">{label}</p>
    </div>
  );
}