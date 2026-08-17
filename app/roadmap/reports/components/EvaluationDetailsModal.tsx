'use client';

type EvaluationRecord = {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  division: string;
  unit: string;
  level: string;
  evaluationType: string;
  latestDate: string;
  score: number | null;
  status: string;
  evaluationCount: number;
};

type Props = {
  open: boolean;
  record: EvaluationRecord | null;
  onClose: () => void;
};

export default function EvaluationDetailsModal({ open, record, onClose }: Props) {
  if (!open || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold">{record.name}</h3>
            <p className="text-sm text-slate-500">{record.department} / {record.division}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Level</p>
            <p className="text-lg font-semibold">{record.level}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Evaluation Type</p>
            <p className="text-lg font-semibold">{record.evaluationType}</p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-900">ประวัติการประเมิน</h4>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">วันที่ล่าสุด: {record.latestDate}</p>
            <p className="text-sm text-slate-600">คะแนน: {record.score}</p>
            <p className="text-sm text-slate-600">สถานะ: {record.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}