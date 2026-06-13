"use client";
import LanguageForm from "@/app/recruitment/components/LanguageForm";

export default async function languagePage({ params }) {
    const { id } = await params;
  return <LanguageForm languageId={id} />;
}