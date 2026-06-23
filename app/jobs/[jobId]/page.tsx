"use client";

import { useEffect, useState } from "react";
import { Card, Tag, Divider, Skeleton, Alert } from "antd";
import { useParams } from "next/navigation";

import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type MultiLang = Record<string, string>; // e.g. { th: "...", en: "..." }

interface JobDetail {
  id: string;
  employmentType: string | null;
  experienceLevel: string | null;
  companyLogo: string | null;
  companyName: MultiLang;
  positionTitle: MultiLang;
  description: MultiLang;
  requirements: MultiLang[];
  responsibilities: MultiLang[];
  benefits: MultiLang[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
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
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {/* ── Header Card ── */}
            <Card>
              <div className="flex items-start gap-4">

                <div>
                  <p className="text-sm text-gray-500">
                    {job.companyName}
                  </p>

                  <h1 className="text-3xl font-bold">
                    {job.positionTitle}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.type_of_work && (
                      <Tag color="blue">{job.type_of_work}</Tag>
                    )}
                    {job.workLocation && (
                      <Tag color="green">{job.workLocation}</Tag>
                    )}
                    {job.salary_min && (
                      <Tag color="green">{job.salary_min}</Tag>
                    )}
                    {job.salary_max && (
                      <Tag color="green">{job.salary_max}</Tag>
                    )}
                    {job.opening_count && (
                      <Tag color="green">{job.opening_count}</Tag>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* ── About Position ── */}
            {getText(job.description, locale) && (
              <Card className="mt-6">
                <h2 className="text-xl font-semibold">About Position</h2>
                <Divider />
                <p className="whitespace-pre-line leading-relaxed">
                  {getText(job.description, locale)}
                </p>
              </Card>
            )}

            {/* ── Responsibilities ── */}
            {job.responsibilities.length > 0 && (
              <div className="pt-6">
                <Card className="mt-6">
                  <h2 className="text-xl font-semibold">Responsibilities</h2>
                  <Divider />
                  <ul className="list-disc pl-5 space-y-1">
                    {job.responsibilities.map((item, idx) => (
                      <li key={idx}>{getText(item, locale)}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {/* ── Qualifications / Requirements ── */}
            {job.requirements.length > 0 && (
              <div className="pt-6">
                <Card className="mt-6">
                  <h2 className="text-xl font-semibold">Qualifications</h2>
                  <Divider />
                  <ul className="list-disc pl-5 space-y-1">
                    {job.requirements.map((item, idx) => (
                      <li key={idx}>{getText(item, locale)}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {/* ── Benefits ── */}
            {job.benefits.length > 0 && (
              <div className="pt-6">
                <Card className="mt-6">
                  <h2 className="text-xl font-semibold">Benefits</h2>
                  <Divider />
                  <ul className="list-disc pl-5 space-y-1">
                    {job.benefits.map((item, idx) => (
                      <li key={idx}>{getText(item, locale)}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
