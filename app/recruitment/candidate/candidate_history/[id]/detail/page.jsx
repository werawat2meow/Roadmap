"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import CandidateDetail from "@/app/recruitment/components/CandidateDetail";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import { useRouter } from "next/navigation";

export default function Page({ params }) {
  const router = useRouter();

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.candidate.history",
    unauthorizedRedirect: "/recruitment",
  });

  const { id } = use(params);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) fetchCandidateDetail();
  }, [id]);

  async function fetchCandidateDetail() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/recruitment/api/candidate_detail/${id}`, { method: "GET", cache: "no-store",});

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Load candidate detail failed");
      }

      setData(result ?? null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isChecking && !canEdit) {
      router.replace("/recruitment/candidate");
    }
  }, [isChecking, canEdit, router]);

  // ยังโหลดอยู่ (ไม่ว่าจะเช็คสิทธิ์หรือโหลดข้อมูล) -> แสดง loading เท่านั้น ห้ามไปต่อ
  if (isChecking || loading) return <LoadingOrb />;
  if (!canEdit) return null;

  // โหลดเสร็จแล้วแต่ไม่มีข้อมูล/error -> หยุดที่นี่ ห้ามไปต่อ
  if (error || !data) {
    return notFound();
  }

  // ============================
  // Layout
  // ============================
  return (
    <CandidateDetail
      application={data?.application}
      education={data?.education}
      workExperience={data?.workExperience}
      languageSkills={data?.languageSkills}
      systemProgramSkills={data?.systemProgramSkills}
      documents={data?.documents}
      interviews={data?.interviews?.[0]}
    />
  );
}