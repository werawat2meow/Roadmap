import Link from "next/link";
import WorkflowPanel from "../WorkflowPanel";

export default function OrientationManagePage() {
  return (
    <main className="min-w-0 bg-slate-50 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[1600px]">
        <Link
          href="/recruitment/orientation"
          className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          กลับหน้ารายการ Orientation
        </Link>

        <header className="mb-5 mt-2 rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">
            จัดการ Orientation
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            สร้างและจัดรอบ เลือก “จัดการ” ในรอบที่ต้องการเพื่อเช็กชื่อ บันทึก Site Visit ส่งมอบ และดูประวัติ
          </p>
        </header>

        <WorkflowPanel />
      </div>
    </main>
  );
}
