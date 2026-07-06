type Tag = {
  label: string;
  className: string;
};

type ExecutiveEmployeeCardProps = {
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

export default function ExecutiveEmployeeCard({
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
  return (
    <button
      type="button"
      onClick={onViewDetail}
      className="cursor-pointer group w-full text-left rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${avatarClass} text-lg font-semibold`}
          >
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border ${scoreClass} border-current text-sm font-semibold cursor-default`}
        >
          {score}%
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${tag.className}`}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
        <span>{quarter}</span>
        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
          ดูรายละเอียด
        </span>
      </div>
    </button>
  );
}