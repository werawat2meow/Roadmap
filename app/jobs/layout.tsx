
import type { ReactNode } from "react";
import LanguageHeader from "@/app/jobs/components/LanguageHeader";
import { LanguageProvider } from "@/app/jobs/contexts/LanguageContext";
import "./job.css";

export const metadata = {
  title: "Recruitment System",
  description: "Recruitment Management System",
};

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