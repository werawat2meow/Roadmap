"use client";

export default function BenefitMatrix({
  levels = [],
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-9 gap-2">
          {levels.map((item) => (
            <div
              key={item.level}
              className={`${item.color} rounded-t-2xl p-4 text-center text-white`}
            >
              <div className="text-2xl font-bold">
                {item.level}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-9 gap-2 rounded-b-2xl border border-slate-200 bg-white p-2">
          {levels.map((item) => (
            <div
              key={item.level}
              className="rounded-2xl bg-slate-50 p-4 text-center"
            >
              <div className="text-xs text-slate-400">
                วันหยุดพักผ่อน
              </div>

              <div className="mt-1 text-lg font-bold text-slate-800">
                {item.leave} วัน
              </div>

              <div className="mt-4 text-xs text-slate-400">
                เงินกู้พนักงาน
              </div>

              <div className="mt-1 text-sm font-semibold text-emerald-700">
                {item.loan}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}