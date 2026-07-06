import { X, CheckCircle, CalendarDays, Award, Users, ClipboardList } from 'lucide-react';

type Employee = {
  initials: string;
  name: string;
  title: string;
  tags: { label: string; className: string }[];
  quarter: string;
  score: number;
  scoreClass: string;
};

type ExecutiveSlideOverProps = {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
};

export default function ExecutiveSlideOver({ open, employee, onClose, onApprove, onReject }: ExecutiveSlideOverProps) {
  const initials = employee?.initials ?? '';
  const name = employee?.name ?? '';
  const title = employee?.title ?? '';
  const quarter = employee?.quarter ?? '';
  const score = employee?.score ?? 0;
  const scoreClass = employee?.scoreClass ?? 'text-slate-500';
  const colorMap = {
    'text-emerald-600': 'bg-emerald-600',
    'text-amber-600': 'bg-amber-600',
    'text-fuchsia-600': 'bg-fuchsia-600',
    'text-yellow-600': 'bg-yellow-600',
    'text-blue-600': 'bg-blue-600',
    'text-violet-600': 'bg-violet-600',
  };

  const scoreBgClass = colorMap[scoreClass] ?? 'bg-slate-500';
  const tags = employee?.tags ?? [];

  const department = tags.some((t) => t.label === 'HR') ? 'HR' : title;
  const typeValue = tags.some((t) => t.label === 'Probation') ? 'Probation' : 'Performance';

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl transition-all duration-300 ease-out ${open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">รายละเอียดพนักงาน</p>
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">คะแนนรวม</p>
                <p className={`mt-2 text-4xl font-semibold ${scoreClass}`}>{score}%</p>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${scoreClass} border-current text-lg font-semibold`}>
                {initials}
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${scoreBgClass}`} style={{ width: `${score}%` }} />
            </div>

            <p className="mt-3 text-sm text-slate-500">75 / 100 คะแนน</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              ผ่านเกณฑ์
            </div>
          </div>

          <div className="space-y-4">
            <DetailRow icon={Award} label="แผนก" value={department} />
            <DetailRow icon={ClipboardList} label="ตำแหน่ง" value={title} />
            <DetailRow icon={CalendarDays} label="รอบการประเมิน" value={quarter} />
            <DetailRow icon={ClipboardList} label="ประเภท" value={typeValue} />
            <DetailRow icon={Users} label="ผู้ประเมิน" value="Jennifer Smith" />
            <DetailRow icon={CalendarDays} label="วันที่เสร็จสิ้น" value="2024-06-16" />
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onApprove}
              className="cursor-pointer flex-1 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-semibold shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98]"
            >
              อนุมัติ
            </button>

            <button
              type="button"
              onClick={onReject}
              className="cursor-pointer flex-1 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 text-white text-sm font-semibold shadow-xl shadow-red-500/25 transition-all duration-200 hover:from-red-400 hover:to-rose-600 active:scale-[0.98]"
            >
              ไม่อนุมัติ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof X; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs uppercase text-gray-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}