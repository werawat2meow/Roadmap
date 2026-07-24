"use client";

export default function ManagementHeader({canCreate,onCreate,}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              สายบังคับบัญชา
            </h1>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
              P12 – P9
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            กำหนดโครงสร้างผู้บริหารและแสดงผลในรูปแบบ Org Chart
          </p>
          <p className="mt-1 text-xs text-slate-400">
            รองรับ Multiple Scope
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <span className="mr-2 text-lg">
              +
            </span>
            เพิ่มสายบังคับบัญชา
          </button>
        )}
      </div>
    </div>
  );
}