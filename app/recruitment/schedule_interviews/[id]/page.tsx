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
import { FileText, Download, User, Briefcase, AlertCircle, ExternalLink, X, ZoomIn, ArrowLeft } from "lucide-react";

// ---------- Types ----------

interface Applicant {
  application_id: number;
  first_name: string;
  last_name: string;
  positions: { position_name: string };
  self_presentation_url: string;
  profile_image_url: string;
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
  const [imgFailed, setImgFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!applicationId) return;

    let cancelled = false;

    async function fetchApplicant() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const res = await fetch(`/recruitment/api/schedule_interviews/detail/${applicationId}`);

        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!res.ok) {
          throw new Error("โหลดข้อมูลไม่สำเร็จ");
        }

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

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen]);

  const hasProfileImage = Boolean(data?.applicant.profile_image_url) && !imgFailed;

  return (
    <div className="min-h-full w-full bg-[#FAF9F6]">
      {/*
        Quick font import for the demo. In production, move these to
        next/font (or the root layout) instead of a runtime @import —
        this avoids a render-blocking request and gives you font-display
        control.
      */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Noto+Sans+Thai:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");

        .font-dossier-display {
          font-family: "Noto Serif Thai", serif;
        }
        .font-dossier-body {
          font-family: "Noto Sans Thai", sans-serif;
        }
        .font-dossier-mono {
          font-family: "IBM Plex Mono", ui-monospace, monospace;
        }

        @keyframes dossier-rise {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dossier-animate {
          animation: dossier-rise 0.45s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .dossier-animate {
            animation: none;
          }
        }

        @keyframes dossier-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes dossier-scale-in {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="font-dossier-body mx-auto w-full p-4 ">
        {/* Header / eyebrow */}
        <div className="mb-8 dossier-animate">
          <p className="font-dossier-mono text-[11px] uppercase tracking-[0.18em] text-[#767C6E]">
            แฟ้มใบสมัคร
          </p>
          <h1 className="font-dossier-display mt-2 text-[26px] font-semibold leading-tight text-[#23261F] md:text-[30px]">
            รายละเอียดผู้สมัคร
          </h1>
        </div>

        {loading && <LoadingState />}

        {!loading && notFound && <EmptyState message="ไม่พบข้อมูลผู้สมัครรายนี้ในระบบ" />}

        {!loading && error && <EmptyState message={error} isError />}

        {!loading && data && (
          <div className="space-y-6">
            {/* ข้อมูลผู้สมัคร */}
            <section className="dossier-animate overflow-hidden rounded-2xl border border-[#E4E0D3] bg-white shadow-[0_1px_2px_rgba(35,38,31,0.04)]">
              <div className="flex items-center gap-4 px-5 py-6 md:px-6">
                {/* รูปโปรไฟล์ — stamp-ring avatar */}
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 rounded-full border border-dashed border-[#2F6F4E]/30" />
                  {hasProfileImage ? (
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      aria-label="ดูรูปโปรไฟล์ขนาดใหญ่"
                      className="group relative block h-16 w-16 overflow-hidden rounded-full border border-[#E4E0D3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6F4E]"
                    >
                      <img
                        src={data.applicant.profile_image_url}
                        alt={`${data.applicant.first_name} ${data.applicant.last_name}`}
                        onError={() => setImgFailed(true)}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-[#23261F]/0 opacity-0 transition group-hover:bg-[#23261F]/35 group-hover:opacity-100">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </span>
                    </button>
                  ) : (
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#E4E0D3] bg-[#F1EFE8]">
                      <User className="h-6 w-6 text-[#9CA396]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-dossier-display truncate text-lg font-semibold text-[#23261F] md:text-xl">
                    {data.applicant.first_name} {data.applicant.last_name}
                  </p>
                  
                </div>
              </div>

              <div className="border-t border-[#EFEBE1] px-5 py-4 md:px-6">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-[#9CA396]">ชื่อ-นามสกุล</dt>
                    <dd className="mt-0.5 text-[#23261F]">
                      {data.applicant.first_name} {data.applicant.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-[#9CA396]">ตำแหน่งงานที่สมัคร</dt>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#2F6F4E]/25 bg-[#2F6F4E]/[0.06] px-2.5 py-1 text-xs font-medium text-[#2F6F4E]">
                      <Briefcase className="h-3 w-3" />
                      {data.applicant.positions.position_name}
                    </span>
                  </div>
                </dl>
              </div>
            </section>

            {/* เอกสารแนบ — manifest style */}
            <section
              className="dossier-animate overflow-hidden rounded-2xl border border-[#E4E0D3] bg-white shadow-[0_1px_2px_rgba(35,38,31,0.04)]"
              style={{ animationDelay: "60ms" }}
            >
              <div className="flex items-center justify-between border-b border-[#EFEBE1] px-5 py-4 md:px-6">
                <h2 className="font-dossier-display text-sm font-semibold text-[#23261F]">เอกสารแนบ</h2>
                <span className="font-dossier-mono text-[11px] text-[#9CA396]">
                  {data.documents.length} ไฟล์
                </span>
              </div>

              {data.documents.length === 0 ? (
                <div className="mx-5 my-5 rounded-lg border border-dashed border-[#E4E0D3] px-4 py-6 text-center md:mx-6">
                  <p className="font-dossier-body text-sm italic text-[#9CA396]">
                    ยังไม่มีเอกสารแนบสำหรับผู้สมัครรายนี้
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[#EFEBE1]">
                  {data.documents.map((doc, idx) => (
                    <li
                      key={`${doc.file_name}-${idx}`}
                      className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#FBFAF7] md:px-6"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-[#9CA396]" />
                      <span className="truncate font-dossier-mono text-[13px] text-[#23261F]">
                        {doc.file_name}
                      </span>
                      {/* leader line — index-page style connector */}
                      <span
                        aria-hidden="true"
                        className="mx-1 hidden min-w-[24px] flex-1 border-b border-dotted border-[#D9D4C6] md:block"
                      />
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-md border border-[#E4E0D3] px-3 py-1.5 text-xs font-medium text-[#2F6F4E] transition hover:border-[#2F6F4E]/40 hover:bg-[#2F6F4E]/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6F4E]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        ดาวน์โหลด
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Presentation */}
            {data.applicant.self_presentation_url && (
              <section
                className="dossier-animate overflow-hidden rounded-2xl border border-[#E4E0D3] bg-white shadow-[0_1px_2px_rgba(35,38,31,0.04)]"
                style={{ animationDelay: "100ms" }}
              >
                <a
                  href={data.applicant.self_presentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[#FBFAF7] md:px-6"
                >
                  <FileText className="h-4 w-4 flex-shrink-0 text-[#9CA396]" />
                  <span className="text-sm text-[#23261F]">Presentation</span>
                  <span className="ml-auto flex items-center gap-1.5 rounded-md border border-[#E4E0D3] px-3 py-1.5 text-xs font-medium text-[#2F6F4E] transition group-hover:border-[#2F6F4E]/40 group-hover:bg-[#2F6F4E]/[0.06]">
                    เปิด Presentation
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </a>
              </section>
            )}

            <button
              type="button"
              onClick={() => window.history.back()}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[#E4E0D3] bg-white px-3 py-2 text-sm font-medium text-[#4A4F45] transition hover:border-[#2F6F4E]/40 hover:bg-[#2F6F4E]/[0.06] hover:text-[#2F6F4E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6F4E]"
            >
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </button>
          </div>
        )}
      </div>

      {lightboxOpen && data && hasProfileImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="รูปโปรไฟล์ผู้สมัคร"
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C16]/80 p-6 backdrop-blur-sm"
          style={{ animation: "dossier-fade 0.18s ease-out both" }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="ปิด"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-w-[min(90vw,480px)]"
            style={{ animation: "dossier-scale-in 0.2s ease-out both" }}
          >
            <img
              src={data.applicant.profile_image_url}
              alt={`${data.applicant.first_name} ${data.applicant.last_name}`}
              className="max-h-[70vh] w-full rounded-2xl border border-white/10 object-contain shadow-2xl"
            />
            <figcaption className="font-dossier-body mt-3 text-center text-sm text-white/70">
              {data.applicant.first_name} {data.applicant.last_name}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

// ---------- Small presentational components ----------

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-[#E4E0D3] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#F1EFE8]" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-[#F1EFE8]" />
            <div className="h-3 w-24 rounded-full bg-[#F1EFE8]" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#E4E0D3] bg-white p-6 shadow-sm">
        <div className="h-4 w-28 rounded bg-[#F1EFE8]" />
        <div className="mt-4 space-y-3">
          <div className="h-3 w-full rounded bg-[#F1EFE8]" />
          <div className="h-3 w-3/4 rounded bg-[#F1EFE8]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <div className="dossier-animate flex items-center gap-3 rounded-2xl border border-dashed border-[#E4E0D3] bg-white px-5 py-8 shadow-sm">
      <AlertCircle className={`h-5 w-5 flex-shrink-0 ${isError ? "text-[#B3492F]" : "text-[#9CA396]"}`} />
      <p className="font-dossier-body text-sm text-[#23261F]">{message}</p>
    </div>
  );
}