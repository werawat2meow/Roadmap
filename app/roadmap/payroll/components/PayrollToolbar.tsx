import { Search } from 'lucide-react';
import { PayrollStatusOption } from '../data';

type PayrollToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: PayrollStatusOption;
  statusOptions: readonly PayrollStatusOption[];
  onStatusChange: (value: PayrollStatusOption) => void;
};

export default function PayrollToolbar({ search, onSearchChange, status, statusOptions, onStatusChange }: PayrollToolbarProps) {
    return (
        <div className="grid gap-4 lg:grid-cols-[1.75fr_1fr]">
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="ค้นหาพนักงาน..."
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
            </div>
            <div className="inline-flex flex-wrap items-center gap-3">
                {statusOptions.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onStatusChange(option)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        status === option
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:bg-slate-50'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};