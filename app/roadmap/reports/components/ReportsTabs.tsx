'use client';

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeTab: string;
  onChange: (tab: string) => void;
};

export default function ReportsTabs({ tabs, activeTab, onChange }: Props) {
    return (
        <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
};