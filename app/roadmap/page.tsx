"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Target, ClipboardCheck, TrendingUp } from "lucide-react";
import StatCard from "./components/StatCard";
import EvaluationChart from "./components/EvaluationChart";
import RecentEvaluations from "./components/RecentEvaluations";

// Mock data for Stat Cards
const stats = [
  {
    title: "TOTAL EMPLOYEES",
    value: "1,284",
    percentage: 12,
    icon: <Users />,
    color: "#EF4444",
  },
  {
    title: "ACTIVE KPIS",
    value: "156",
    percentage: 8,
    icon: <Target />,
    color: "#F97316",
  },
  {
    title: "EVALUATIONS",
    value: "342",
    percentage: 23,
    icon: <ClipboardCheck />,
    color: "#8B5CF6",
  },
  {
    title: "PROMOTIONS",
    value: "28",
    percentage: 5,
    icon: <TrendingUp />,
    color: "#10B981",
  },
];

export default function OverviewPage() {
  // This would come from user data
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true);

  const handleGoToEmployee = () => {
    router.push("/roadmap/employee");
  };

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900">
              เริ่มต้นประเมินพนักงาน
            </h2>
            <p className="mt-3 text-slate-600">
              หากต้องการทำแบบฟอร์มประเมิน ให้คลิกที่เมนู Employee
              เพื่อเลือกพนักงานและประเมิน
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
              >
                ดู Overview ต่อ
              </button>

              <button
                type="button"
                onClick={handleGoToEmployee}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-emerald-600 hover:to-teal-700"
              >
                ไปที่เมนู Employee
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900">Overview</h1>
          <p className="mt-2 text-sm text-slate-700">
            ภาพรวมผลการประเมินพนักงานที่ดำเนินการเสร็จสิ้นแล้ว
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EvaluationChart />
          </div>
          <div>
            <RecentEvaluations />
          </div>
        </div>
      </div>
    </>
  );
}
