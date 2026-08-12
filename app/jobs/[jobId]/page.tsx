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
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 ">          
          <div>
            {/* ── Header Card ── */}
            <Card className="rounded-2xl shadow-sm border-0">
              <div className="flex items-start gap-4">
                <div>
                  <p className="text-sm text-gray-500">{job.companyName}</p>
                  <h1 className="text-3xl font-bold">{job.positionTitle}</h1>
                  <div className="mt-5">
                    <div className="space-y-2">
                      {/* {job.type_of_work && (
                        <p>
                          <span className="font-medium">
                            💼 {getUIText(uiText.workType, locale)}:
                          </span>{" "}
                          {job.type_of_work.charAt(0).toUpperCase() + job.type_of_work.slice(1)}
                        </p>
                      )} */}

                      { job.type_name && (
                        <p>
                          <span className="font-medium">
                            💼 {getUIText(uiText.workType, locale)}:
                          </span>{" "}
                          {/* { getText(job.type_name, locale) } */}
                          { job.type_name }
                        </p>
                      )}

                      {job.workplace && (
                        <p>
                          <span className="font-medium">📍 {getUIText(uiText.workplace, locale)}:</span>{" "}
                          {job.workplace}
                        </p>
                      )}

                      {job.salary_min && job.salary_max && (
                        <p>
                          <span className="font-medium">💰 {getUIText(uiText.salary, locale)}:</span>{" "}
                          {job.salary_min} - {job.salary_max} {getUIText(uiText.type_salary, locale)}
                        </p>
                      )}

                      {job.opening_count && (
                        <p>
                          <span className="font-medium">👥 {getUIText(uiText.openings, locale)}:</span>{" "}
                          {job.opening_count} ตำแหน่ง
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── About Position ── */}
            {getText(job.description, locale) && (
              <div className="pt-6">
                <Card className="rounded-2xl shadow-sm border-0">
                  <h2 className="text-xl font-semibold">{getUIText(uiText.aboutPosition, locale)}</h2>
                  <Divider />
                  <p className="whitespace-pre-line leading-relaxed">
                    {getText(job.description, locale)}
                  </p>
                </Card>
              </div>
            )}

            {/* ── Responsibilities ── */}
            {job.responsibilities.length > 0 && (
              <div className="pt-6">
                <Card className="rounded-2xl shadow-sm border-0">
                  <h2 className="text-xl font-semibold">{getUIText(uiText.responsibilities, locale)}</h2>
                  <Divider />
                  <ul className="space-y-3">
                    {job.responsibilities.map((item, idx) => (
                      <li className="flex gap-3" key={idx}>
                        <span className="text-blue-500 mt-1">✓</span>
                        <span> {getText(item, locale)} </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {/* ── Qualifications / Requirements ── */}
            {job.requirements.length > 0 && (
              <div className="pt-6">
                <Card className="rounded-2xl shadow-sm border-0">
                  <h2 className="text-xl font-semibold">{getUIText(uiText.qualifications, locale)}</h2>
                  <Divider />
                  <ul className="space-y-3">
                    {job.requirements.map((item, idx) => (
                      <li className="flex gap-3" key={idx}>
                        <span className="text-blue-500 mt-1">✓</span>
                        <span> {getText(item, locale)} </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {/* ── Benefits ── */}
            {job.benefits.length > 0 && (
              <div className="pt-6">
                <Card className="rounded-2xl shadow-sm border-0">
                  <h2 className="text-xl font-semibold">{getUIText(uiText.benefits, locale)}</h2>
                  <Divider />
                  <ul className="space-y-3">
                    {job.benefits.map((item, idx) => (
                      <li className="flex gap-3" key={idx}>
                        <span className="text-blue-500 mt-1">✓</span>
                        <span> {getText(item, locale)} </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            <div className="pt-6 flex justify-center">
              <button 
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => router.push('/jobs/register/' + job.id)}
              >
                {getUIText(uiText.apply, locale)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}