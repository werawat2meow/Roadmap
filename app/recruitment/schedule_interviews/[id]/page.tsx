// app/recruitment/schedule_interviews/[application_id]/page.tsx
//
// หน้าแสดงรายละเอียดผู้สมัคร
// URL: /recruitment/schedule_interviews/[application_id]
//
// ดึงข้อมูลผ่าน API: GET /api/recruitment/applications/[application_id]
// (API route ไปดึงข้อมูลจริงจาก Supabase: recruit_job_applications + recruit_job_documents)

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Download, User, Briefcase, AlertCircle } from "lucide-react";
import { Button, } from "antd";

// ---------- Types ----------

interface Applicant {
  application_id: number;
  first_name: string;
  last_name: string;
  positions: { position_name: string; };
  self_presentation_url: string;
}

interface JobDocument {
  file_name: string;
  file_url: string;
}

interface ApplicantResponse {
  applicant: Applicant;
  documents: JobDocument[];
}

// ---------- Page ----------

export default function ApplicantDetailPage() {
  const params = useParams<{ id: string }>();
  const applicationId = params.id;

  const [data, setData] = useState<ApplicantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;

    let cancelled = false;

    async function fetchApplicant() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const res = await fetch(
          `/recruitment/api/schedule_interviews/detail/${applicationId}`
        );

        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!res.ok) { throw new Error("โหลดข้อมูลไม่สำเร็จ"); }

        const json: ApplicantResponse = await res.json();     
        
        if (!cancelled) setData(json);
        
      } catch (err) {
        if (!cancelled) setError("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchApplicant();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  return (
    <div className="h-full w-full">
      <div className="p-4 md:p-6 w-full">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">
          รายละเอียดผู้สมัคร
        </h1>

        {loading && <LoadingState />}

        {!loading && notFound && (
          <EmptyState message="ไม่พบข้อมูลผู้สมัครรายนี้" />
        )}

        {!loading && error && <EmptyState message={error} isError />}

        {!loading && data && (
          <>
            {/* ข้อมูลผู้สมัคร */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                <InfoRow
                  icon={<User className="h-4 w-4 text-slate-400" />}
                  label="ชื่อ-นามสกุล"
                  value={`${data.applicant.first_name} ${data.applicant.last_name}`}
                />
                <InfoRow
                  icon={<Briefcase className="h-4 w-4 text-slate-400" />}
                  label="ตำแหน่งงานที่สมัคร"
                  value={data.applicant.positions.position_name}
                />
              </div>
            </div>

            {/* เอกสารแนบ */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-medium text-slate-700">
                  เอกสารแนบ
                </h2>
              </div>

              {data.documents.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">
                  ยังไม่มีเอกสารแนบสำหรับผู้สมัครรายนี้
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.documents.map((doc, idx) => (
                    <li
                      key={`${doc.file_name}-${idx}`}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="truncate text-sm text-slate-700">
                          {doc.file_name}
                        </span>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        ดาวน์โหลด
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            { data.applicant.self_presentation_url && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div>
                  <ul className="divide-y divide-slate-100">
                    <li className="flex items-center justify-between px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="truncate text-sm text-slate-700">
                          {"Presentation"}
                        </span>
                      </div>
                      <Button
                        className="ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        href={data.applicant.self_presentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        เปิด Presentation
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Small presentational components ----------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {icon}
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-40 rounded bg-slate-100" />
        <div className="h-4 w-56 rounded bg-slate-100" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-32 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyState({
  message,
  isError = false,
}: {
  message: string;
  isError?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
      <AlertCircle
        className={`h-5 w-5 flex-shrink-0 ${
          isError ? "text-red-400" : "text-slate-400"
        }`}
      />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}