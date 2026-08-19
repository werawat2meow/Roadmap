"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, Award, Users, TrendingUp, Star } from "lucide-react";
import ExecutiveStatCard from "./components/ExecutiveStatCard";
import ExecutiveEmployeeCard from "./components/ExecutiveEmployeeCard";
import ExecutiveSlideOver from "./components/ExecutiveSlideOver";

// กำหนด Type ให้ตรงกับที่ API ส่งมา
type Employee = {
  id: string;
  initials: string;
  name: string;
  grade: string;
  title: string;
  quarter: string;
  score: number;
  scoreClass: string;
  avatarClass: string;
  evaluatorName?: string;
  completedDate?: string;
  tags: { label: string; className: string }[];
};

export default function ExecutivePage() {
  // --- ส่วนของ State ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [plan, setPlan] = useState("ทุกแผน");
  const [type, setType] = useState("ทุกประเภท");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // --- ส่วนการดึงข้อมูลจาก API ---
  useEffect(() => {
    async function loadData() {
      try {
        // เปลี่ยนจาก /api/roadmap/executive
        // เป็น /roadmap/api/executive (ตามรูปแบบที่ Log ของคุณบอกว่าสำเร็จ)
        const res = await fetch("/roadmap/api/executive");

        if (!res.ok) throw new Error("Network response was not ok");

        const data = await res.json();
        setEmployees(data.employees || []);
        setStatsData(data.stats);
      } catch (err) {
        console.error("Failed to fetch executive data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- ส่วน Filter (ใช้ข้อมูลจริงจาก State) ---
  const planOptions = useMemo(
    () => [
      "ทุกแผน",
      ...new Set(employees.flatMap((e) => e.tags[0]?.label).filter(Boolean)),
    ],
    [employees],
  );
  const typeOptions = useMemo(
    () => [
      "ทุกประเภท",
      ...new Set(employees.flatMap((e) => e.tags[1]?.label).filter(Boolean)),
    ],
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const textMatch =
        employee.name.toLowerCase().includes(keyword.toLowerCase()) ||
        employee.title.toLowerCase().includes(keyword.toLowerCase());
      const planMatch =
        plan === "ทุกแผน" || employee.tags.some((t) => t.label === plan);
      const typeMatch =
        type === "ทุกประเภท" || employee.tags.some((t) => t.label === type);
      return textMatch && planMatch && typeMatch;
    });
  }, [keyword, plan, type, employees]);

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-slate-600">
        กำลังโหลดข้อมูลระบบ...
      </div>
    );

  // นำข้อมูลจาก statsData มาใส่ในรูปแบบที่ StatCard ต้องการ
  const stats = [
    {
      title: "ประเมินเสร็จสิ้น",
      value: statsData?.completed || 0,
      subtitle: "",
      accentClass: "text-emerald-600",
      iconBgClass: "bg-emerald-50",
      icon: <Award className="h-5 w-5 text-emerald-600" />,
    },
    {
      title: "จากทั้งหมด",
      value: `${statsData?.deptCount || 0} แผนก`,
      subtitle: "",
      accentClass: "text-blue-600",
      iconBgClass: "bg-blue-50",
      icon: <Users className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "คะแนนเฉลี่ย",
      value: `${statsData?.avgScore || 0}%`,
      subtitle: "",
      accentClass: "text-violet-600",
      iconBgClass: "bg-violet-50",
      icon: <TrendingUp className="h-5 w-5 text-violet-600" />,
    },
    {
      title: "Top Performer",
      value: statsData?.topName || "-",
      subtitle: "",
      accentClass: "text-amber-600",
      iconBgClass: "bg-amber-50",
      icon: <Star className="h-5 w-5 text-amber-600" />,
    },
  ];

  const handleStatusUpdate = async (
    action: "approve" | "reject",
    rejectionNote?: string,
  ) => {
    if (!selectedEmployee) return;

    if (action === "reject" && !rejectionNote?.trim()) {
      alert("กรุณากรอกเหตุผลก่อนไม่อนุมัติ");
      return;
    }

    const confirmMsg =
      action === "approve"
        ? "ยืนยันการอนุมัติผลการประเมินนี้?"
        : "ยืนยันการไม่อนุมัติผลการประเมินนี้?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/roadmap/api/executive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationId: selectedEmployee.id,
          action,
          rejectionNote,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(
          action === "approve"
            ? "อนุมัติเรียบร้อยแล้ว"
            : "ปฏิเสธการประเมินเรียบร้อยแล้ว",
        );
        setSelectedEmployee(null);
        setRejectModalOpen(false);
        setRejectionReason("");
        window.location.reload();
      } else {
        alert("เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* ส่วนหัวข้อ */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900">Management</h1>
        <p className="mt-2 text-sm text-slate-700">
          ภาพรวมผลการประเมินพนักงานที่ดำเนินการเสร็จสิ้นแล้ว
        </p>
      </div>

      {/* ส่วนการ์ดสถิติ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <ExecutiveStatCard key={item.title} {...item} />
        ))}
      </div>

      {/* ส่วนตัวกรองและการค้นหา */}
      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.75fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาพนักงาน..."
              className="w-full rounded-[28px] border border-gray-200 bg-gray-50 px-12 py-3 text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="rounded-[28px] border border-gray-200 bg-white px-4 py-3 outline-none"
          >
            {planOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-[28px] border border-gray-200 bg-white px-4 py-3 outline-none"
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          แสดง {filteredEmployees.length} รายการ
        </p>

        {/* รายการพนักงาน (แสดงตามข้อมูลจริงจาก API) */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee, index) => (
            <ExecutiveEmployeeCard
              key={employee.id}
              index={index}
              {...employee}
              onViewDetail={() => setSelectedEmployee(employee)}
            />
          ))}
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  เหตุผลไม่อนุมัติ
                </p>
                <h2 className="text-xl font-bold text-slate-900">
                  กรุณากรอกเหตุผลก่อนดำเนินการ
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason("");
                }}
                className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
              className="w-full min-h-[140px] rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleStatusUpdate("reject", rejectionReason)}
                className="cursor-pointer flex-1 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700"
              >
                ไม่อนุมัติ พร้อมเหตุผล
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason("");
                }}
                className="cursor-pointer flex-1 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ส่วนรายละเอียดพนักงานด้านข้าง */}
      <ExecutiveSlideOver
        open={Boolean(selectedEmployee)}
        employee={selectedEmployee}
        evaluationId={selectedEmployee?.id}
        onClose={() => {
          setSelectedEmployee(null);
          setRejectModalOpen(false);
          setRejectionReason("");
        }}
        onApprove={() => handleStatusUpdate("approve")}
        onReject={() => setRejectModalOpen(true)}
      />
    </div>
  );
}
