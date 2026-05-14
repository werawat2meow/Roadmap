export default function BenefitInfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-base font-bold text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}