"use client";

import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Employee } from "../../types";

type EmployeeInfoCardProps = {
  employee: Employee;
  evaluationType?: string;
};

const labelStyles: Record<string, string> = {
  Probation: "text-white bg-gradient-to-r from-sky-400 to-blue-700 shadow-sm font-bold",
  /* 🎨 ขยับให้ซ้ายสว่างเป็นเหลืองมะนาว แล้วขวาไล่ดิ่งลงส้มเข้ม เห็นเฉดส้ม-เหลืองชัดเจน */
  Performance: "text-amber-950 bg-gradient-to-r from-yellow-300 to-orange-500 shadow-sm font-bold", 
  /* 🎨 ซ้ายใช้เขียวตองอ่อนสว่าง ขวาใช้เขียวป่าลึกเข้ม ๆ ตัดเฉดมิติมรกตจัดเต็ม */
  Promote: "text-white bg-gradient-to-r from-lime-400 to-emerald-700 shadow-sm font-bold",
  /* 🎨 ซ้ายส้มแมนดารินสว่าง ขวาถีบลงสีแดงโรสเข้มสะใจ เห็นความสลัวไล่เฉดคม ๆ */
  Progression: "text-white bg-gradient-to-r from-orange-400 to-rose-600 shadow-sm font-bold",
};

export default function EmployeeInfoCard({
  employee,
  evaluationType = "Probation",
}: EmployeeInfoCardProps) {
  const badgeClass = labelStyles[evaluationType] || "bg-slate-100 text-slate-700";
  const avatarText = employee.avatar
    ? ""
    : employee.name
      ? employee.name.slice(0, 2).toUpperCase()
      : "??";

  return (
    <div className="bg-white p-4 xl:p-5 rounded-[28px] border border-slate-200 shadow-sm shadow-slate-200/40 mb-5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-xl font-bold text-slate-700">
            {employee.avatar && employee.avatar.startsWith("http") ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              avatarText
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {employee.name}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={16} className="text-blue-500" />
              <span className="truncate">
                {employee.department || "ไม่มีแผนก"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-[22px] border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Employee ID
              </span>
              <span className="font-semibold text-slate-800">
                {employee.employeeCode}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                สังกัด
              </span>
              <span className="font-semibold text-slate-800">
                {employee.branch || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                แผนก
              </span>
              <span className="font-semibold text-slate-800">
                {employee.department || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                ฝ่าย
              </span>
              <span className="font-semibold text-slate-800">
                {employee.division || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                หน่วย
              </span>
              <span className="font-semibold text-slate-800">
                {employee.unit || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Position
              </span>
              <span className="font-semibold text-slate-800 truncate">
                {employee.role || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Start Date
              </span>
              <span className="font-semibold text-slate-800">
                {employee.hireDate || "-"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Level
              </span>
              <span className="font-semibold text-blue-600 font-mono">
                {employee.level || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-end justify-between gap-4 min-w-[170px]">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badgeClass}`}
              >
                {evaluationType}
              </span>
            </div>
          </div>
          <Link
            href="/roadmap/employee"
            className="inline-flex items-center justify-center px-4 py-2.5 min-w-[150px] whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/10 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
          >
            <Users size={16} className="mr-2" />
            Change Employee
          </Link>
        </div>
      </div>
    </div>
  );
}
