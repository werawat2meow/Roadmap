"use client";

import Link from "next/link";

export default function RecruitmentPage() {
    return (
      <div className="flex h-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Report Recruitment System
              </h1>

              <p className="mt-2 text-slate-500">
                หน้านี้เป็นหน้าเริ่มต้นของ Report Recruitment
              </p>
              <Link href="/recruitment/report/activity_logs" className="mt-4 inline-block font-medium text-blue-700 hover:underline">
                รายงานกิจกรรมการใช้งาน (Activity logs)
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}
