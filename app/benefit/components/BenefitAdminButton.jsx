export default function BenefitAdminButton({ icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
        {icon}
      </div>

      <div className="font-bold text-slate-800">{title}</div>

      <div className="mt-1 text-sm text-slate-400">
        เปิดเมนูจัดการ
      </div>
    </button>
  );
}