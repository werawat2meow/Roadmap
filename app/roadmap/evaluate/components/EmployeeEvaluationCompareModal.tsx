"use client";

import { X } from "lucide-react";

type CompareRecord = {
  id: string;
  created_at: string;
  evaluationType?: string | null;
  totalScore: number | null;
  currentSalary?: number | null;
  newSalary?: number | null;
  new_designation?: string | null;
  new_level?: string | null;
  status: string;
  evaluation_period?: string | null;
  evaluation_period_continued?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  records: CompareRecord[];
};

export default function EmployeeEvaluationCompareModal({
  open,
  onClose,
  records,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-900">เปรียบเทียบการประเมิน</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-rose-500 px-3 py-1 text-sm font-semibold text-white"
          >
            <X size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">ครั้งที่</th>
                <th className="py-2 pr-4">วันที่</th>
                <th className="py-2 pr-4">ประเภท</th>
                <th className="py-2 pr-4">คะแนนรวม</th>
                <th className="py-2 pr-4">เงินเดือนเดิม</th>
                <th className="py-2 pr-4">เงินเดือนใหม่</th>
                <th className="py-2 pr-4">ตำแหน่งใหม่</th>
                <th className="py-2 pr-4">Level ใหม่</th>
                <th className="py-2 pr-4">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{index + 1}</td>
                  <td className="py-3 pr-4">{new Date(record.created_at).toLocaleDateString("th-TH")}</td>
                  <td className="py-3 pr-4">{record.evaluationType || "-"}</td>
                  <td className="py-3 pr-4">{record.totalScore ?? "-"}</td>
                  <td className="py-3 pr-4">{record.currentSalary ?? "-"}</td>
                  <td className="py-3 pr-4">{record.newSalary ?? "-"}</td>
                  <td className="py-3 pr-4">{record.new_designation || "-"}</td>
                  <td className="py-3 pr-4">{record.new_level || "-"}</td>
                  <td className="py-3 pr-4">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}