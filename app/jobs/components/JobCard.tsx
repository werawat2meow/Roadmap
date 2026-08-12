"use client";

import { Job } from "@/app/jobs/types/job";
import { useRouter } from "next/navigation";
import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

interface Props { job: Job; }

export default function JobCard({ job }: Props) {
  const router = useRouter();
  const { locale } = useLanguage();

  const salary = job.salary_note
    ? job.salary_note
    : `${job.salary_min?.toLocaleString()} – ${job.salary_max?.toLocaleString()}`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(20,23,31,0.08)] ring-1 ring-[#D9D2C0] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(20,23,31,0.22)]">

      {/* Signature top accent — gold for standard roles, muted crimson for urgent */}
      <div
        className={`h-[3px] w-full bg-gradient-to-r ${
          job.urgent
            ? "from-[#7A1B1F] via-[#7A1B1F] to-transparent"
            : "from-[#8C6F2E] via-[#8C6F2E] to-transparent"
        }`}
      />

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight text-[#14171F]">
            {String(job.position_name?.trim() || job.job_name)}
          </h2>
          {job.urgent && (
            <span className="urgent-badge relative mt-0.5 inline-flex shrink-0 items-center gap-1 overflow-hidden rounded-full bg-[#7A1B1F] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.75 2.25c.4 3.2-.6 5.1-2.1 6.7-1.5 1.6-3.15 3-3.15 5.55a4.5 4.5 0 009 0c0-1.28-.4-2.2-.94-3.08.72.1 1.5.6 2.1 1.53.86 1.33 1.24 2.6 1.24 3.55a6.75 6.75 0 01-13.5 0c0-4.34 2.6-6.2 4.53-8.32 1.4-1.55 2.34-2.98 2.82-5.93z" />
              </svg>
              ด่วน
            </span>
          )}
        </div>
 
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm text-[#3F434B]">
            <svg className="h-3.5 w-3.5 text-[#8C6F2E]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{job.branch_name}</span>
          </p>
 
          <button
            type="button"
            onClick={() => router.push(`/jobs/similar/${job.department_id}`)}
            className="cursor-pointer rounded-full border border-[#D9D2C0] bg-[#F5F3EE] px-3 py-1 text-xs font-medium text-[#5B5E66] transition-colors hover:border-[#8C6F2E]/60 hover:bg-white hover:text-[#8C6F2E]"
          >
            ตำแหน่งอื่นในสายงานนี้ →
          </button>
        </div>
 
        <div className="mt-4 h-px w-full bg-gradient-to-r from-[#8C6F2E]/50 via-[#D9D2C0] to-transparent" />
      </div>

      {/* Info strip */}
      <div className="mx-6 mb-5 grid grid-cols-1 gap-3 rounded-xl bg-[#F5F3EE] px-4 py-4 text-sm ring-1 ring-[#D9D2C0] md:grid-cols-3">
        <InfoItem
          label={getUIText(uiText.workplace, locale)}
          value={job.workplace}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m-1 4h1m4-4h1m-1 4h1M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4" />
          }
        />
        <InfoItem
          label={getUIText(uiText.salary, locale)}
          value={salary}
          valueClassName="text-[#0B5445]"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m3.5-9a2.5 2.5 0 00-2.5-1H11a2 2 0 000 4h2a2 2 0 010 4h-2.5a2.5 2.5 0 01-2.5-1" />
          }
        />
        <InfoItem
          label={getUIText(uiText.openings, locale)}
          value={String(job.opening_count)}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m5-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8" />
          }
        />
      </div>

      {job.remark?.[locale] && (
        <div className="mx-6 mb-5 rounded-lg border-l-2 border-[#8C6F2E] bg-[#8C6F2E]/[0.06] py-3 pl-4 pr-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8C6F2E]">
            {getUIText(uiText.shortDetail, locale)}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#22242B]">
            {job.remark[locale]}
          </p>
        </div>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <div className="mx-6 mb-5 rounded-lg border-l-2 border-[#8C6F2E] bg-[#8C6F2E]/[0.06] py-3 pl-4 pr-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8C6F2E]">
            {getUIText(uiText.jobDetails, locale)}
          </p>
          <ul className="mb-5">
            {job.requirements.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-[#22242B]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0B5445]/10 text-[#0B5445]">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="leading-relaxed">{getText(item, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto flex items-center justify-end gap-3 border-t border-[#D9D2C0] bg-[#F5F3EE]/70 px-6 py-4">
        {/* <button
          type="button"
          onClick={() => router.push(`/jobs/similar/${job.department_id}`)}
          className="cursor-pointer rounded-lg border border-[#C2BAA5] px-4 py-2.5 text-sm font-medium text-[#22242B] transition-colors hover:border-[#8C6F2E]/60 hover:bg-white"
        >
          ตำแหน่งที่คล้ายกัน
        </button> */}

        {/* <button
          type="button"
          onClick={() => router.push(`/jobs/${job.id}`)}
          className="group/cta relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-lg bg-[#14171F] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#8C6F2E]"
        >
          <span className="shine-text">ดูรายละเอียด</span>
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button> */}

        {/* <button 
          className="btn"
          type="button"
          onClick={() => router.push(`/jobs/${job.id}`)}
        >
          <i className="animation"></i>
          <span >ดูรายละเอียด</span>
          <i className="animation"></i>
        </button> */}

         <div className="item button-parrot"
         >
          <button 
            className="button_click_me"
            type="button"
            onClick={() => router.push(`/jobs/${job.id}`)}
          >ดูรายละเอียด
            <div className="parrot"></div>
            <div className="parrot"></div>
            <div className="parrot"></div>
            <div className="parrot"></div>
            <div className="parrot"></div>
            <div className="parrot"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  valueClassName = "text-[#14171F]",
}: {
  label: string;
  value?: string | number | null;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg className="h-3.5 w-3.5 shrink-0 text-[#8C6F2E]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        {icon}
      </svg>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#5B5E66]">
        {label}
      </span>
      <span className={`truncate text-sm font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}