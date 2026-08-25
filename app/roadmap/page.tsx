"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  CheckCircle,
  Calendar,
} from "lucide-react";
import StatCard from "./components/StatCard";
import EvaluationChart from "./components/EvaluationChart";
import RecentEvaluations from "./components/RecentEvaluations";

const MONTHS = [
  { val: "all", label: "แสดงทั้งหมด (ทั้งปี)" },
  { val: "1", label: "มกราคม" },
  { val: "2", label: "กุมภาพันธ์" },
  { val: "3", label: "มีนาคม" },
  { val: "4", label: "เมษายน" },
  { val: "5", label: "พฤษภาคม" },
  { val: "6", label: "มิถุนายน" },
  { val: "7", label: "กรกฎาคม" },
  { val: "8", label: "สิงหาคม" },
  { val: "9", label: "กันยายน" },
  { val: "10", label: "ตุลาคม" },
  { val: "11", label: "พฤศจิกายน" },
  { val: "12", label: "ธันวาคม" },
];

type OverviewApiData = {
  stats: {
    totalEmployees: number;
    evaluations: number;
    completed: number;
    promotions: number;
    evalPercent?: number;
  };
  chartData: Array<{ name: string; Total: number; Completed: number }>;
  recentEvaluations: any[];
  branchSummary: any[];
};

export default function OverviewPage() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true);
  const [apiData, setApiData] = useState<OverviewApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState(
    new Date().getFullYear().toString(),
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/roadmap/api?month=${filterMonth}&year=${filterYear}`,
        );
        const json = await res.json();
        if (json.success) {
          setApiData(json);
        } else {
          setApiData(null);
          console.error("API error:", json.error);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setApiData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filterMonth, filterYear]);

  const stats = apiData
    ? [
        {
          title: "TOTAL EMPLOYEES",
          value: apiData.stats.totalEmployees.toLocaleString(),
          percentage: 0, // ยอดสะสมอาจไม่ต้องโชว์ %
          icon: <Users />,
          color: "#EF4444",
        },
        {
          title: "EVALUATIONS",
          value: apiData.stats.evaluations.toLocaleString(),
          percentage: apiData.stats.evalPercent ?? 0, // ใช้ % ความสำเร็จรวม
          icon: <ClipboardCheck />,
          color: "#8B5CF6",
        },
        {
          title: "COMPLETED",
          value: apiData.stats.completed.toLocaleString(),
          percentage: apiData.stats.evalPercent ?? 0,
          icon: <CheckCircle />,
          color: "#10B981",
        },
        {
          title: "PROMOTIONS",
          value: apiData.stats.promotions.toLocaleString(),
          percentage: 0,
          icon: <TrendingUp />,
          color: "#F97316",
        },
      ]
    : [];

  const currentYearNum = new Date().getFullYear();
  const yearOptions = [
    currentYearNum - 2,
    currentYearNum - 1,
    currentYearNum,
    currentYearNum + 1,
  ];

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
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white"
              >
                ดู Overview ต่อ
              </button>
              <button
                type="button"
                onClick={() => router.push("/roadmap/employee")}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white"
              >
                ไปที่เมนู Employee
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900">Overview</h1>
            <p className="mt-2 text-sm text-slate-700">
              ภาพรวมผลการประเมินประจำปี {filterYear}{" "}
              {filterMonth !== "all"
                ? `(เดือน${MONTHS.find((m) => m.val === filterMonth)?.label})`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="w-[1px] h-6 bg-slate-200 mx-1" />

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y.toString()}>
                  {(y +543).toString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-slate-100 animate-pulse"
                />
              ))
            : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EvaluationChart data={apiData?.chartData ?? []} />
          </div>
          <div>
            <RecentEvaluations
              data={apiData?.branchSummary ?? []}
              month={filterMonth}
              year={filterYear}
            />
          </div>
        </div>
      </div>
    </>
  );
}
