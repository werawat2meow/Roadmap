"use client";

type EvaluatemgrRecord = {
  id: string;
  employee_id: string;
  status: string;
  created_at: string;
  totalScore: number | null;
  companyScore: number | null;
  departmentScore: number | null;
  expectationScore: number | null;
  examScore: number | null;
  maxScore: number | null;
  managerComment: string | null;
  evaluationType?: string | null;
  extra_data?: any;
  rm_evaluation_scores?: Array<{
    category_item_id: string;
    score: number | null;
    remark: string | null;
    is_included: boolean;
  }>;
  rm_evaluation_reviewers?: { manager_id: string }[];
  employee?: {
    id: string;
    first_name_th: string;
    last_name_th: string;
    employee_code?: string;
  };
};

type SelectionModalProps = {
  records: EvaluatemgrRecord[];
  onSelect: (record: EvaluatemgrRecord) => void;
  onClose: () => void;
};

const labelStyles: Record<string, string> = {
  Probation:
    "text-white bg-gradient-to-r from-sky-400 to-blue-700 shadow-sm font-bold",
  Performance:
    "text-amber-950 bg-gradient-to-r from-yellow-300 to-orange-500 shadow-sm font-bold",
  Promote:
    "text-white bg-gradient-to-r from-lime-400 to-emerald-700 shadow-sm font-bold",
  Progression:
    "text-white bg-gradient-to-r from-orange-400 to-rose-600 shadow-sm font-bold",
};

export default function SelectionModal({
  records,
  onSelect,
  onClose,
}: SelectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <h2 className="text-xl font-bold text-black">
            เลือกรายชื่อพนักงานที่ต้องการประเมิน
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full border border-red-500 bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600"
          >
            ปิด
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              ยังไม่มีพนักงานที่ต้องประเมิน
            </div>
          ) : (
            records.map((record) => (
              <button
                key={record.id}
                onClick={() => onSelect(record)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {record.employee
                        ? `${record.employee.first_name_th} ${record.employee.last_name_th}`
                        : record.employee_id}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${labelStyles[record.evaluationType || "Probation"]}`}
                    >
                      {record.evaluationType || "Probation"}
                    </span>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {new Date(record.created_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
