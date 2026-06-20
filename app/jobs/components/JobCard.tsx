"use client";

import Link from "next/link";
import { Job } from "@/app/jobs/types/job";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

interface Props {
  job: Job;
}

export default function JobCard({ job }: Props) {
  const { locale } = useLanguage();

  const salary = job.salary_note
    ? job.salary_note
    : `${job.salary_min?.toLocaleString()} – ${job.salary_max?.toLocaleString()}`;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md ${
        job.urgent ? "border-l-4 border-red-500" : "border-l-4 border-blue-600"
      }`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold leading-snug text-slate-900">
            {job.position_name}
          </h2>
          {job.urgent && (
            <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-200">
              🔥 ด่วน
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <span>📍</span>
          <span>{job.branch_name}</span>
        </p>
      </div>

      {/* Info strip */}
      <div className="mx-5 mb-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-base">🏢</span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">สถานที่</p>
            <p className="font-medium text-slate-700">{job.workLocation}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">เงินเดือน</p>
            <p className="font-semibold text-emerald-600">{salary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
          <span className="text-base">👥</span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">จำนวนที่รับ</p>
            <p className="font-medium text-slate-700">{job.opening_count} ตำแหน่ง</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto px-5 pb-5">
        <Link
          href={`/jobs/${job.id}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          ดูรายละเอียด
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}