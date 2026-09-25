"use client";

import { useState, useEffect } from "react";
import { X, Send, AlertCircle, Search, CheckCircle2 } from "lucide-react";

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
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [evaluationType, setEvaluationType] = useState<
    "Promote" | "Performance" | "Progression"
  >("Performance");
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

  const selectedEmployee = employees.find(
    (emp) => emp.id === selectedEmployeeId,
  );

  const filteredEmployees = employees.filter((emp) => {
    const keyword = employeeSearch.trim().toLowerCase();

    if (!keyword) return true;

    const searchableText = [
      emp.employeeCode,
      emp.name,
      emp.department,
      emp.role,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });

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
            className="cursor-pointer rounded-full bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
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
              <p className="text-xs text-slate-400">
                กำลังโหลดรายชื่อพนักงาน...
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก หรือตำแหน่ง..."
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {selectedEmployee && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <span className="font-bold">เลือกแล้ว:</span>{" "}
                    {selectedEmployee.employeeCode} - {selectedEmployee.name}
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                  {filteredEmployees.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      ไม่พบพนักงานที่ตรงกับคำค้นหา
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = emp.id === selectedEmployeeId;

                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className={`flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                            isSelected
                              ? "bg-blue-50"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {emp.employeeCode} - {emp.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {emp.department || "-"} / {emp.role || "-"}
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCircle2
                              size={18}
                              className="mt-0.5 flex-shrink-0 text-blue-600"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  แสดง {filteredEmployees.length} จากทั้งหมด {employees.length}{" "}
                  คน
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              ประเภทการประเมิน *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Promote", "Performance", "Progression"] as const).map(
                (type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setEvaluationType(type)}
                    className={`cursor-pointer  rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                      evaluationType === type
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ),
              )}
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
              className="cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100 hover:text-red-700"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
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
