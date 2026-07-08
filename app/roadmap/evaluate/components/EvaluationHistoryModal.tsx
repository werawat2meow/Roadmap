"use client";

type HistoryRecord = {
  id: string;
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
};

type EvaluationHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  records: HistoryRecord[];
  onEdit: (record: HistoryRecord) => void;
};

export default function EvaluationHistoryModal({
  isOpen,
  onClose,
  records,
  onEdit,
}: EvaluationHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">ประวัติการบันทึก</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            ปิด
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              ยังไม่มีบันทึกประวัติ
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-500">สถานะ</p>
                    <p className="text-base font-semibold">{record.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">เวลา</p>
                    <p className="text-base font-semibold">{new Date(record.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-semibold">รวม</p>
                    <p>{record.totalScore ?? "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Company</p>
                    <p>{record.companyScore ?? "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Department</p>
                    <p>{record.departmentScore ?? "-"}</p>
                  </div>
                </div>
                <button
                  onClick={() => onEdit(record)}
                  className="self-end rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  แก้ไข
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}