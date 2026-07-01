"use client";

import Link from "next/link";
import { Job } from "@/app/jobs/types/job";
import { useRouter } from "next/navigation";

interface Props {
  job: Job;
}

export default function JobCard({ job }: Props) {
  
  const router = useRouter();

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
            {job.position_name?.trim() || job.job_name }
          </h2>
          {job.urgent && (
            <span className="blink rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
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
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">สถานที่ทำงาน</p>
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
        {/* <Link
          href={`/jobs/${job.id}`}
          className="flex items-center justify-end gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold  transition-colors"
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
        </Link> */}

        <div className="flex justify-end p-5">
          <button
            type="button"
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="job-detail-link group relative flex items-center justify-end gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 cursor-pointer"
          >
            ดูรายละเอียด
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}