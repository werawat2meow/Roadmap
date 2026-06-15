'use client';

type Props = {
  activeTab: string;
  onChange: (tab: string) => void;
};

const tabs = ['ทั้งหมด', 'Company', 'Department', 'Expectations'];

export default function SettingsTabs({ activeTab, onChange }: Props) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="inline-flex rounded-full bg-slate-200 p-1">
        {tabs.map((tab) => {
          const selected = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}