"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Clock3,
  CalendarDays,
  CalendarX2,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OverviewData = {
  summary: {
    employeeCount: number;
    pendingCount: number;
    onLeaveTodayCount: number;
    restrictedDateCount: number;
    approvedLeaveDays: number;
  };
  monthlyUsage: {
    month: number;
    name: string;
    total: number;
  }[];
  departments: {
    name: string;
    employeeCount: number;
    onLeaveToday: number;
    leaveDays: number;
    pendingCount: number;
  }[];
  todayLeaves: {
    id: number;
    employeeCode: string;
    employeeName: string;
    department: string;
    kindLabel: string;
  }[];
  upcomingBlackouts: {
    id: number;
    startDate: string;
    endDate: string;
    reason: string;
    targets: {
      type: string;
      name: string;
    }[];
  }[];
};

const emptyData: OverviewData = {
  summary: {
    employeeCount: 0,
    pendingCount: 0,
    onLeaveTodayCount: 0,
    restrictedDateCount: 0,
    approvedLeaveDays: 0,
  },
  monthlyUsage: [],
  departments: [],
  todayLeaves: [],
  upcomingBlackouts: [],
};

function formatThaiDate(dateValue: string) {
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);

  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function LeaveDashboardPage() {
  const [data, setData] = useState<OverviewData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/leave/api/overview", {
        cache: "no-store",
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setData(json.data);
    } catch (error: any) {
      setError(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const summary = data.summary;

  return (
    <div className="min-h-screen w-full bg-slate-50/70 p-6 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-600">
              Leave Management
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900">
              ภาพรวมการลา
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              สรุปสถานะการลาและข้อมูลสำคัญของพนักงาน
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOverview()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            รีเฟรชข้อมูล
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="พนักงานทั้งหมด"
            value={summary.employeeCount}
            icon={<Users size={23} />}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
          />

          <StatCard
            label="รออนุมัติ"
            value={summary.pendingCount}
            icon={<Clock3 size={23} />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />

          <StatCard
            label="ลาวันนี้"
            value={summary.onLeaveTodayCount}
            icon={<CalendarDays size={23} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />

          <StatCard
            label="วันที่จำกัดการลา"
            value={summary.restrictedDateCount}
            icon={<CalendarX2 size={23} />}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                การใช้สิทธิ์ลารายเดือน
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                รวมจำนวนวันลาที่ได้รับอนุมัติในปีปัจจุบัน
              </p>
            </div>

            <div className="h-[340px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  กำลังโหลดข้อมูล...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthlyUsage}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="total"
                      name="จำนวนวันลา"
                      fill="#2dd4bf"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">ลาวันนี้</h2>
            <p className="mt-1 text-sm text-slate-500">
              รายชื่อพนักงานที่มีใบลาอนุมัติในวันนี้
            </p>

            <div className="mt-5 space-y-3">
              {data.todayLeaves.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                  วันนี้ไม่มีพนักงานลา
                </p>
              ) : (
                data.todayLeaves.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.employeeName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.employeeCode} · {item.department}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {item.kindLabel}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">สรุปตามแผนก</h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-3 py-3">แผนก</th>
                    <th className="px-3 py-3 text-center">พนักงาน</th>
                    <th className="px-3 py-3 text-center">ลาวันนี้</th>
                    <th className="px-3 py-3 text-center">วันลาอนุมัติ</th>
                    <th className="px-3 py-3 text-center">รออนุมัติ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.departments.map((department) => (
                    <tr
                      key={department.name}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {department.name}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">
                        {department.employeeCount}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">
                        {department.onLeaveToday}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">
                        {department.leaveDays}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">
                        {department.pendingCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              วันที่จำกัดการลาที่กำลังจะถึง
            </h2>

            <div className="mt-5 space-y-3">
              {data.upcomingBlackouts.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                  ไม่มีวันที่จำกัดการลา
                </p>
              ) : (
                data.upcomingBlackouts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3"
                  >
                    <p className="font-semibold text-rose-800">
                      {formatThaiDate(String(item.startDate))}
                      {item.endDate &&
                        String(item.endDate).slice(0, 10) !==
                          String(item.startDate).slice(0, 10) &&
                        ` - ${formatThaiDate(String(item.endDate))}`}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-rose-600">{item.reason}</span>

                      {item.targets.length === 0 ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-rose-200">
                          ทุกหน่วยงาน
                        </span>
                      ) : (
                        item.targets.map((target, index) => (
                          <span
                            key={`${target.type}-${target.name}-${index}`}
                            className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-rose-200"
                          >
                            {target.type === "ORG"
                              ? "สังกัด"
                              : target.type === "DEPARTMENT"
                                ? "แผนก"
                                : target.type === "DIVISION"
                                  ? "ฝ่าย"
                                  : "หน่วย"}{" "}
                            {target.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

function StatCard({ label, value, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-slate-900">
          {value.toLocaleString()}
        </p>
      </div>

      <div
        className={`${iconBg} ${iconColor} flex h-14 w-14 items-center justify-center rounded-2xl`}
      >
        {icon}
      </div>
    </div>
  );
}
