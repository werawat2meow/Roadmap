"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AimOutlined, CheckOutlined, EnvironmentOutlined, FileTextOutlined, GiftOutlined, SolutionOutlined, StarOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Skeleton } from "antd";
import { useParams, useRouter } from "next/navigation";
import { uiText } from "@/app/jobs/components/translations";
import { getText } from "@/app/jobs/lib/i18n";
import { getUIText } from "@/app/jobs/lib/ui";
import { useLanguage } from "@/contexts/LanguageContext";

type MultiLang = Record<string, string>;

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

export default function JobDetailPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-[1180px] space-y-5">
          <div className="rounded-2xl bg-[#10233f] p-6 md:p-10"><Skeleton active avatar paragraph={{ rows: 2 }} /></div>
          <div className="rounded-2xl border border-[#e8ecf2] bg-white p-6"><Skeleton active paragraph={{ rows: 2 }} /></div>
          <div className="rounded-2xl border border-[#e8ecf2] bg-white p-6"><Skeleton active paragraph={{ rows: 6 }} /></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <Alert type="error" showIcon message={getUIText(uiText.jobNotFound, locale)} description={error ?? getUIText(uiText.loadJobError, locale)} />
        </div>
      </div>
    );
  }

  const workType = job.type_name ?? job.employmentType ?? job.type_of_work ?? "-";
  const workplace = job.workplace ?? "-";
  const openingCount = job.opening_count ?? 0;
  const positionTitle = job.positionTitle ?? "-";
  const companyInitial = job.companyName?.trim().charAt(0).toUpperCase() ?? "J";
  const openingValue = `${openingCount} ${getUIText(uiText.openingUnit, locale)}`;
  const goToApplication = () => router.push(`/jobs/register/${job.id}`);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-6 md:py-9 lg:py-10">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b31] via-[#142946] to-[#17375f] px-5 py-7 shadow-[0_12px_30px_rgba(15,35,63,0.12)] md:px-8 md:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white p-2.5 shadow-sm md:h-[88px] md:w-[88px]">
                {job.companyLogo && !logoError ? (
                  // The API returns logos from arbitrary external domains, so a native image preserves existing URL support.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.companyLogo} alt={job.companyName ?? "Company logo"} className="h-full w-full object-contain" onError={() => setLogoError(true)} />
                ) : (
                  <span className="text-2xl font-bold text-slate-500">{companyInitial}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-wide text-slate-300">{job.companyName}</p>
                <h1 className="mt-1 text-[30px] font-bold leading-tight text-white md:text-[34px] lg:text-4xl">{positionTitle}</h1>
                <div className="mt-4 flex flex-wrap gap-2">
                  <HeroTag icon={<SolutionOutlined />} text={workType} />
                  <HeroTag icon={<EnvironmentOutlined />} text={workplace} />
                  <HeroTag icon={<TeamOutlined />} text={openingValue} />
                </div>
              </div>
            </div>
            <button type="button" onClick={goToApplication} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-emerald-500 px-7 py-3 text-base font-semibold text-white shadow-[0_8px_20px_rgba(16,185,129,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300/30 md:w-auto md:min-w-[260px] md:self-end lg:min-w-0 lg:self-auto">
              {getUIText(uiText.apply, locale)}
            </button>
          </div>
        </section>

        <section className="relative z-10 mx-2 -mt-1 grid overflow-hidden rounded-2xl border border-[#e8ecf2] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:mx-4 sm:-mt-3 md:grid-cols-3">
          <SummaryItem icon={<SolutionOutlined />} label={getUIText(uiText.workType, locale)} value={workType} />
          <SummaryItem icon={<EnvironmentOutlined />} label={getUIText(uiText.workplace, locale)} value={workplace} />
          <SummaryItem icon={<TeamOutlined />} label={getUIText(uiText.openings, locale)} value={openingValue} />
        </section>

        <div className="mt-6 space-y-5 md:mt-7">
          {getText(job.description, locale) && (
            <SectionCard title={getUIText(uiText.aboutPosition, locale)} icon={<FileTextOutlined />}>
              <p className="whitespace-pre-line text-base leading-[1.8] text-slate-600">{getText(job.description, locale)}</p>
            </SectionCard>
          )}
          {job.responsibilities?.length > 0 && (
            <SectionCard title={getUIText(uiText.responsibilities, locale)} icon={<AimOutlined />}>
              <div className="grid gap-3">{job.responsibilities.map((item, index) => <ListItem key={index}>{getText(item, locale)}</ListItem>)}</div>
            </SectionCard>
          )}
          {job.requirements?.length > 0 && (
            <SectionCard title={getUIText(uiText.qualifications, locale)} icon={<StarOutlined />}>
              <div className="grid gap-x-10 gap-y-3 lg:grid-cols-2">{job.requirements.map((item, index) => <ListItem key={index}>{getText(item, locale)}</ListItem>)}</div>
            </SectionCard>
          )}
          {job.benefits?.length > 0 && (
            <SectionCard title={getUIText(uiText.benefits, locale)} icon={<GiftOutlined />}>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{job.benefits.map((item, index) => <ListItem key={index} surface>{getText(item, locale)}</ListItem>)}</div>
            </SectionCard>
          )}
        </div>

        <section className="mt-7 rounded-2xl bg-gradient-to-br from-[#0d1b31] to-[#17375f] px-5 py-8 text-center shadow-[0_12px_28px_rgba(15,35,63,0.12)] md:px-10 md:py-10">
          <h2 className="text-[22px] font-bold text-white md:text-2xl">{getUIText(uiText.bottomCtaTitle, locale)}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-base leading-7 text-slate-300">
            {getUIText(uiText.bottomCtaPositionPrefix, locale)} {positionTitle}<span className="mx-1.5 text-slate-500">•</span>{getUIText(uiText.bottomCtaTime, locale)}
          </p>
          <button type="button" onClick={goToApplication} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-8 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300/30 sm:w-auto">
            {getUIText(uiText.applyThisPosition, locale)}
          </button>
        </section>
      </main>
    </div>
  );
}

function HeroTag({ icon, text }: { icon: ReactNode; text: ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-100"><span className="text-slate-300">{icon}</span>{text}</span>;
}

function SummaryItem({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#e8ecf2] px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 md:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-[#31557b]">{icon}</span>
      <div className="min-w-0"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-0.5 break-words text-base font-semibold text-slate-900">{value}</p></div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e8ecf2] bg-white px-5 py-6 shadow-[0_4px_14px_rgba(15,23,42,0.035)] md:px-8 md:py-7">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-[#31557b]">{icon}</span><h2 className="text-xl font-bold text-slate-900 md:text-[22px]">{title}</h2></div>
      {children}
    </section>
  );
}

function ListItem({ children, surface = false }: { children: ReactNode; surface?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl ${surface ? "bg-slate-50 px-4 py-3.5" : "py-1"}`}>
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] text-emerald-600"><CheckOutlined /></span>
      <span className="min-w-0 text-base leading-[1.75] text-slate-600">{children}</span>
    </div>
  );
}
