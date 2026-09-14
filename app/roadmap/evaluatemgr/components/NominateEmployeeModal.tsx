"use client";

import { useState, useEffect } from "react";
import { X, Send, UserCheck, AlertCircle } from "lucide-react";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  role: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  reviewerId: string;
  onSuccess: () => void;
};

export default function NominateEmployeeModal({
  isOpen,
  onClose,
  reviewerId,
  onSuccess,
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [evaluationType, setEvaluationType] = useState<"Promote" | "Performance" | "Progression">("Performance");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchEmployees() {
      setLoading(true);
      try {
        const res = await fetch("/roadmap/api/employees");
        const json = await res.json();
        if (json.success) {
          setEmployees(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load employees", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError("กรุณาเลือกพนักงานที่จะส่งชื่อ");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        employeeId: selectedEmployeeId,
        evaluatorId: reviewerId,
        evaluationType: evaluationType,
        status: "Nominated",
        managerIds: [reviewerId],
        managerComment: note || null,
        extra_data: {
          nominated_at: new Date().toISOString(),
          nomination_note: note,
        },
      };

      const res = await fetch("/roadmap/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "เกิดข้อผิดพลาดในการส่งชื่อ");
      }

      window.alert("ส่งชื่อพนักงานเข้าแผนประเมินเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit nomination");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              เสนอชื่อพนักงานเข้าแผนรอบถัดไป
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดส่งภายในวันที่ 28 (Promote / Performance / Progression)
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-600">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              เลือกพนักงาน *
            </label>
            {loading ? (
              <p className="text-xs text-slate-400">กำลังโหลดรายชื่อพนักงาน...</p>
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="cursor-pointer w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- เลือกพนักงาน --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name} ({emp.department} / {emp.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              ประเภทการประเมิน *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Promote", "Performance", "Progression"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setEvaluationType(type)}
                  className={`rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                    evaluationType === type
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              เหตุผลหรือหมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="ระบุเหตุผลในการเสนอชื่อพนักงาน..."
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={15} />
              {submitting ? "กำลังส่ง..." : "ยืนยันส่งชื่อ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 