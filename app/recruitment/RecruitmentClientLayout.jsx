"use client";

import PortalLayout from "@/app/components/portal/PortalLayout";

export default function RecruitmentClientLayout({ children }) {
  return (
    <PortalLayout>
      {children}
    </PortalLayout>
  );
}