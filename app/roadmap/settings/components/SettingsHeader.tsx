'use client';

type Props = {
  onAdd?: () => void;
  description?: string;
};

export default function SettingsHeader({ onAdd, description }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-4xl font-black text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          {description ?? 'จัดการหัวข้อและตัวชี้วัดการประเมิน'}
        </p>
      </div>

      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span className="mr-2 text-base font-bold">+</span>
          เพิ่มหมวดหมู่
        </button>
      ) : null}
    </div>
  );
}