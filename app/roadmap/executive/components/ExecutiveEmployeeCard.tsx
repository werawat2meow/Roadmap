import { ChevronRight, CalendarDays } from "lucide-react";

type Tag = {
  label: string;
  className: string;
};

type ExecutiveEmployeeCardProps = {
  index: number;
  initials: string;
  name: string;
  title: string;
  tags: Tag[];
  quarter: string;
  score: number;
  scoreClass: string;
  avatarClass: string;
  onViewDetail?: () => void;
};

// ชุดสีสำหรับ Evaluation Type (สี Gradient ตาม Modal เดิม)
const labelStyles: Record<string, string> = {
  Probation:
    "text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md",
  Performance:
    "text-white bg-gradient-to-r from-amber-400 to-orange-600 shadow-md",
  Promote: "text-white bg-gradient-to-r from-emerald-400 to-teal-600 shadow-md",
  Progression: "text-white bg-gradient-to-r from-rose-400 to-red-600 shadow-md",
};

export default function ExecutiveEmployeeCard({
  index,
  initials,
  name,
  title,
  tags,
  quarter,
  score,
  scoreClass,
  avatarClass,
  onViewDetail,
}: ExecutiveEmployeeCardProps) {
  // ชุดสีการ์ดแบบอ่อนพิเศษ
  const colorVariants = [
    {
      bg: "bg-blue-50/20",
      border: "border-blue-100/40",
      accent: "text-blue-600",
    },
    {
      bg: "bg-emerald-50/20",
      border: "border-emerald-100/40",
      accent: "text-emerald-600",
    },
    {
      bg: "bg-indigo-50/20",
      border: "border-indigo-100/40",
      accent: "text-indigo-600",
    },
    {
      bg: "bg-violet-50/20",
      border: "border-violet-100/40",
      accent: "text-violet-600",
    },
  ];

  const variant = colorVariants[index % colorVariants.length];

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className={`group relative w-full text-left rounded-[32px] border ${variant.border} ${variant.bg} bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden cursor-pointer`}
    >
      <div
        className={`absolute -right-8 -top-8 w-40 h-40 ${variant.bg} rounded-full opacity-40 blur-3xl transition-all group-hover:scale-125`}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${avatarClass} text-xl font-bold transition-transform group-hover:scale-105`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-slate-800 leading-tight truncate">
              {name}
            </h3>
            <p className="text-[13px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
              {title}
            </p>
          </div>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border-2 ${scoreClass} border-current bg-white shadow-sm transition-transform group-hover:rotate-6 group-hover:scale-110`}
        >
          <span className="text-[14px] font-black leading-none">{score}</span>
          <span className="text-[8px] font-bold opacity-50">%</span>
        </div>
      </div>

      {/* Tags Section: ปรับให้สวยทุกลูก */}
      <div className="mt-6 flex flex-wrap gap-2 relative">
        {tags.map((tag, idx) => {
          // 1. ถ้าเป็นประเภทการประเมิน (Probation, etc.) -> ใช้ Gradient เด่นๆ
          if (labelStyles[tag.label]) {
            return (
              <span
                key={tag.label}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all group-hover:scale-105 ${labelStyles[tag.label]}`}
              >
                {tag.label}
              </span>
            );
          }

          // 2. ถ้าเป็นแผนก (ตัวแรกสุด หรือคำยาวๆ) -> ใช้สไตล์ Badge สะอาดๆ
          if (idx === 0 || tag.label.length > 5) {
            // สไตล์ 1: Modern Vibrant Blue (เน้นจุดเด่น ดูสะอาดตาและมีมิติ)
            return (
              <span
                key={tag.label}
                className="inline-flex items-center rounded-full bg-blue-50/60 border border-blue-200/80 px-3.5 py-1 text-[11px] font-semibold text-blue-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-blue-100/70 hover:border-blue-300 hover:text-blue-700 group-hover:border-blue-300 uppercase tracking-wide"
              >
                {tag.label}
              </span>
            );
          }

          // 3. ถ้าเป็นข้อมูลอื่นๆ (P6, Level) -> สไตล์ Minimal Premium Slate (เรียบหรู ดูแพง)
          return (
            <span
              key={tag.label}
              className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3.5 py-1 text-[11px] font-medium text-slate-600 shadow-xs transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 uppercase tracking-wider"
            >
              {tag.label}
            </span>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative">
        <div className="flex items-center gap-1.5 text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-tight">
            {quarter}
          </span>
        </div>

        <div
          className={`flex items-center gap-1.5 font-bold text-[13px] transition-all ${variant.accent} group-hover:gap-2`}
        >
          <span>ดูรายละเอียด</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </button>
  );
}
