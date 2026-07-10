"use client";

import { X, Clock, Edit2, Trash2 } from "lucide-react";

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
  onDelete: (record: HistoryRecord) => void;
};

export default function EvaluationHistoryModal({
  isOpen,
  onClose,
  records,
  onEdit,
  onDelete,
}: EvaluationHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header ส่วนหัวของ Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            ประวัติการบันทึก
          </h2>

          {/* 🔴 ปุ่มปิด: สีแดงไล่เฉดสี */}
          <button
            onClick={onClose}
            className="group flex items-center gap-1.5 rounded-full border border-rose-300 bg-gradient-to-b from-rose-400 to-red-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:from-rose-500 hover:to-red-600 hover:border-red-500 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <X size={14} className="transition group-hover:rotate-90" />
            <span>ปิด</span>
          </button>
        </div>

        {/* Content ส่วนเนื้อหารายการประวัติ */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {records.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
              <p className="text-base font-medium text-slate-400">
                ยังไม่มีบันทึกประวัติในระบบ
              </p>
            </div>
          ) : (
            records.map((record) => {
              const isDraft = record.status?.toLowerCase() === "draft";

              return (
                <div
                  key={record.id}
                  className="group relative flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50"
                >
                  {/* แถวบน: แสดงสถานะ และ วันที่/เวลา */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">
                        สถานะ:
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                          isDraft
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10"
                            : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        {new Date(record.created_at).toLocaleString("th-TH", {
                          hour12: false,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* แถวกลาง: แสดงผลคะแนน */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-blue-50/40 p-3 text-center transition group-hover:bg-blue-50/80">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        รวม
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-slate-800">
                        {record.totalScore ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs font-semibold text-slate-500 tracking-wide">
                        Company
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-700">
                        {record.companyScore ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs font-semibold text-slate-500 tracking-wide">
                        Department
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-700">
                        {record.departmentScore ?? "-"}
                      </p>
                    </div>
                  </div>

                  {/* 🟡 แถวล่าง: ปุ่มแก้ไข สีเหลืองมีเฉด (Gradient) */}
                  <div className="flex items-center gap-2 self-end mt-2">
                    {/* ปุ่มแก้ไขข้อมูล (สีเหลือง) */}
                    <button
                      onClick={() => onEdit(record)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-gradient-to-b from-yellow-300 to-amber-400 px-4 py-2 text-xs font-bold text-amber-950 shadow-sm hover:from-yellow-400 hover:to-amber-500 hover:border-amber-400 transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>แก้ไขข้อมูล</span>
                    </button>

                    {/* 🔴 ปุ่มลบข้อมูล (เปลี่ยนเป็นสีแดงมีเฉด Gradient) */}
                    <button
                      onClick={() => onDelete(record)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-gradient-to-b from-rose-400 to-red-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-rose-500 hover:to-red-600 hover:border-red-500 transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>ลบข้อมูล</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
