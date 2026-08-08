"use client";

import { useState } from "react";

import RecruitmentOpenFormPage from "@/app/recruitment/components/RecruitmentOpenFormPage";

export default function RecruitJobOpenCreatePage() {

  const [initialData] = useState(null);

  return (
    <RecruitmentOpenFormPage
      mode="create"
      initialData={initialData}
    />
  );
}