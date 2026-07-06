"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";
import RecruitmentOpenFormPage from "@/app/recruitment/components/RecruitmentOpenFormPage";

export default function RecruitJobOpenEditPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch(
        `/recruitment/api/job_openings/${id}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setInitialData(result.data);
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingOrb />
      </div>
    );
  }

  return (
    <RecruitmentOpenFormPage
      mode="edit"
      initialData={initialData}
    />
  );
}