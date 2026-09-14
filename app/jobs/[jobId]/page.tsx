"use client";

import { useEffect, useState } from "react";
import { Card, Divider, Skeleton, Alert } from "antd";
import { useParams } from "next/navigation";
import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type MultiLang = Record<string, string>; // e.g. { th: "...", en: "..." }

interface JobDetail {
  id: string;
  employmentType?: string | null;
  experienceLevel?: string | null;
  companyLogo?: string | null;
  companyName?: string | null;
  positionTitle?: string | null;
  description: MultiLang;
  requirements: MultiLang[];
  responsibilities: MultiLang[];
  benefits: MultiLang[];
  type_of_work?: string | null;
  type_name?: string | null;
  workplace?: string | null;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  opening_count?: number | string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const router = useRouter();

  const { locale } = useLanguage();
  const params = useParams();
  const jobId = params?.jobId as string | undefined;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/jobs/api/${jobId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        const data: JobDetail = await res.json();
        
        setJob(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card>
            <Skeleton avatar active paragraph={{ rows: 2 }} />
          </Card>
          <Card>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !job) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-5xl">
          <Alert
            type="error"
            showIcon
            message="ไม่พบข้อมูลงาน"
            description={error ?? "ไม่สามารถโหลดข้อมูลได้"}
          />
        </div>
      </div>
    );
  }

  
    
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        
        {/* Header / Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
          
          {/* decoration */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative p-6 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                
                {/* Company Logo */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white p-3 shadow-lg">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.companyName ?? "Company Logo"}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-400">
                      {job.companyName?.charAt(0)?.toUpperCase() ?? "J"}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-300">
                    {job.companyName}
                  </p>

                  <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
                    {job.positionTitle}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.type_name && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur">
                        💼 {job.type_name}
                      </span>
                    )}

                    {job.workplace && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur">
                        📍 {job.workplace}
                      </span>
                    )}

                    {job.opening_count && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur">
                        👥 {job.opening_count} ตำแหน่ง
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push("/jobs/register/" + job.id)}
                className="
                  shrink-0
                  rounded-xl
                  bg-emerald-500
                  px-7
                  py-3.5
                  text-base
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-emerald-500/20
                  transition
                  hover:-translate-y-0.5
                  hover:bg-emerald-600
                  hover:shadow-xl
                "
              >
                {getUIText(uiText.apply, locale)}
              </button>
            </div>
          </div>
        </div>

        {/* Job Summary */}
        <div className="relative z-10 -mt-4 grid gap-4 px-3 sm:grid-cols-2 lg:grid-cols-4">
          {job.type_name && (
            <InfoCard
              icon="💼"
              label={getUIText(uiText.workType, locale)}
              value={job.type_name}
            />
          )}

          {job.workplace && (
            <InfoCard
              icon="📍"
              label={getUIText(uiText.workplace, locale)}
              value={job.workplace}
            />
          )}

          {(job.salary_min || job.salary_max) && (
            <InfoCard
              icon="💰"
              label={getUIText(uiText.salary, locale)}
              value={
                job.salary_min && job.salary_max
                  ? `${Number(job.salary_min).toLocaleString()} - ${Number(
                      job.salary_max
                    ).toLocaleString()} ${getUIText(uiText.type_salary, locale)}`
                  : "-"
              }
            />
          )}

          {job.opening_count && (
            <InfoCard
              icon="👥"
              label={getUIText(uiText.openings, locale)}
              value={`${job.opening_count} ตำแหน่ง`}
            />
          )}
        </div>

        {/* Content */}
        <div className="mt-8 space-y-6">
          
          {/* About */}
          {getText(job.description, locale) && (
            <SectionCard
              title={getUIText(uiText.aboutPosition, locale)}
              icon="📝"
            >
              <p className="whitespace-pre-line text-[15px] leading-8 text-slate-600">
                {getText(job.description, locale)}
              </p>
            </SectionCard>
          )}

          {/* Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <SectionCard
              title={getUIText(uiText.responsibilities, locale)}
              icon="🎯"
            >
              <div className="grid gap-3">
                {job.responsibilities.map((item, idx) => (
                  <ListItem key={idx}>
                    {getText(item, locale)}
                  </ListItem>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Qualifications */}
          {job.requirements?.length > 0 && (
            <SectionCard
              title={getUIText(uiText.qualifications, locale)}
              icon="⭐"
            >
              <div className="grid gap-3">
                {job.requirements.map((item, idx) => (
                  <ListItem key={idx}>
                    {getText(item, locale)}
                  </ListItem>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Benefits */}
          {job.benefits?.length > 0 && (
            <SectionCard
              title={getUIText(uiText.benefits, locale)}
              icon="🎁"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {job.benefits.map((item, idx) => (
                  <ListItem key={idx}>
                    {getText(item, locale)}
                  </ListItem>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-3xl bg-slate-900 px-6 py-8 text-center shadow-xl md:px-10">
          <h2 className="text-2xl font-bold text-white">
            {getUIText(uiText.bottomCtaTitle, locale)}
          </h2>

          <p className="mt-2 text-slate-400">
            {getUIText(uiText.bottomCtaDescription, locale)}
          </p>

          <button
            onClick={() => router.push("/jobs/register/" + job.id)}
            className="
              mt-6
              rounded-xl
              bg-emerald-500
              px-8
              py-3
              font-semibold
              text-white
              transition
              hover:bg-emerald-600
            "
          >
            {getUIText(uiText.apply, locale)}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">
            {icon}
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8 md:py-7">
        {children}
      </div>
    </div>
  );
}

function ListItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
        ✓
      </div>

      <span className="text-[15px] leading-7 text-slate-600">
        {children}
      </span>
    </div>
  );
}