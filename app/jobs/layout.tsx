
import type { ReactNode } from "react";
import LanguageHeader from "@/app/jobs/components/LanguageHeader";
import { LanguageProvider } from "@/app/jobs/contexts/LanguageContext";


export default function JobsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LanguageProvider>
      <LanguageHeader />

      <main>
        {children}
      </main>
    </LanguageProvider>
  );
}