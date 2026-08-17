import {
  X,
  CheckCircle,
  CalendarDays,
  Award,
  Users,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type Employee = {
  initials: string;
  name: string;
  grade: string;
  title: string;
  tags: { label: string; className: string }[];
  quarter: string;
  score: number;
  scoreClass: string;
  evaluatorName?: string;
  completedDate?: string;
};

type ExecutiveSlideOverProps = {
  open: boolean;
  employee: Employee | null;
  evaluationId?: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
};

export default function ExecutiveSlideOver({
  open,
  employee,
  evaluationId,
  onClose,
  onApprove,
  onReject,
}: ExecutiveSlideOverProps) {
  const name = employee?.name ?? "";
  const title = employee?.title ?? "";
  const quarter = employee?.quarter ?? "";
  const score = employee?.score ?? 0;
  const scoreClass = employee?.scoreClass ?? "text-slate-500";
  const grade = employee?.grade ?? "-";

  const colorMap: Record<string, string> = {
    "text-emerald-600": "bg-emerald-600",
    "text-amber-600": "bg-amber-600",
    "text-fuchsia-600": "bg-fuchsia-600",
    "text-yellow-600": "bg-yellow-600",
    "text-blue-600": "bg-blue-600",
    "text-violet-600": "bg-violet-600",
  };

  const scoreBgClass = colorMap[scoreClass] ?? "bg-slate-500";
  const tags = employee?.tags ?? [];
  const department = tags[0]?.label || "ไม่ระบุแผนก";
  const typeValue = tags[1]?.label || "ทั่วไป";

  return (
    <div className={`fixed inset-0 z-50 ${open ? "visible" : "invisible"}`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[440px] bg-slate-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              รายละเอียดพนักงาน
            </p>
            <h2 className="text-xl font-bold text-slate-800 leading-none">
              {name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Score Summary Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500">คะแนนประเมินรวม</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-4xl font-black ${scoreClass}`}>
                    {score}%
                  </span>
                </div>
              </div>
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${scoreClass} border-current bg-white shadow-lg shadow-current/5 text-2xl font-black`}
              >
                {grade}
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${scoreBgClass}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-400">
                  {score} / 100 คะแนน
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">
                    {score >= 80 ? "ผ่านเกณฑ์" : "รอพิจารณา"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section - Grid Layout */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2">
              ข้อมูลทั่วไป
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <CompactDetailRow icon={Award} label="แผนก" value={department} />
              <CompactDetailRow icon={ClipboardList} label="ตำแหน่ง" value={title} />
              
              <div className="grid grid-cols-2 gap-3">
                <CompactDetailRow icon={CalendarDays} label="รอบประเมิน" value={quarter} />
                <CompactDetailRow icon={ClipboardList} label="ประเภท" value={typeValue} />
              </div>

              <CompactDetailRow icon={Users} label="ผู้ประเมิน" value={employee?.evaluatorName || "ไม่ระบุ"} />
              <CompactDetailRow icon={CalendarDays} label="วันที่ประเมิน" value={employee?.completedDate || "-"} />
            </div>
          </div>

          {/* Link to Full Details Card */}
          {evaluationId && (
            <Link
              href={`/roadmap/evaluatemgr?evaluationId=${evaluationId}&readonly=true`}
              onClick={onClose}
              className="flex items-center justify-between w-full p-4 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors text-slate-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">View Details..</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          )}
        </div>

        {/* Sticky Footer - Colors restored as requested */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={onApprove}
            className="cursor-pointer flex-1 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold shadow-xl shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-600 active:scale-95 transition-all"
          >
            อนุมัติ
          </button>

          <button
            type="button"
            onClick={onReject}
            className="cursor-pointer flex-1 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 text-white text-sm font-bold shadow-xl shadow-red-500/20 hover:from-red-500 hover:to-rose-600 active:scale-95 transition-all"
          >
            ไม่อนุมัติ
          </button>
        </div>
      </div>
    </div>
  );
}

function CompactDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-slate-200">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-slate-700 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}