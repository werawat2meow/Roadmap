"use client";

import { useState } from "react";
import LanguageHeader from "@/app/jobs/components/LanguageHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState("en");

  return (
    <>
      <LanguageHeader
        onChangeLanguage={(lang) => {
          setLocale(lang);
          console.log("Current Language:", lang);
        }}
      />

      <main>{children}</main>
    </>
  );
}