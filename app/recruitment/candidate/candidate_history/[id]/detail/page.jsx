"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import CandidateDetail from "@/app/recruitment/components/CandidateDetail";
import LoadingOrb from "@/app/components/LoadingOrb";

export default function Page({ params }) {
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

      const res = await fetch(`/recruitment/api/candidate_detail/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Load candidate detail failed");
      }

      setData(result ?? result ?? null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ยังโหลดอยู่ -> แสดง loading เท่านั้น ห้ามไปต่อ
  if (loading) {
    return <LoadingOrb />;
  }

  // โหลดเสร็จแล้วแต่ไม่มีข้อมูล/error -> หยุดที่นี่ ห้ามไปต่อ
  if (error || !data) {
    return notFound(); // ★ ใส่ return กันไว้ให้ชัวร์ว่า component หยุดทำงานจริง
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
      interviews={data?.interviews}
    />
  );
}