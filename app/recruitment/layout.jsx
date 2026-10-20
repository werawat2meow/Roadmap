import { Suspense } from "react";
import RecruitmentActivityTracker from "./components/RecruitmentActivityTracker";
import RecruitmentClientLayout from "@/app/recruitment/RecruitmentClientLayout";
import "./recruitment.css"; 

export const metadata = {
  title: "Recruitment System",
  description: "Recruitment Management System",
  icons: { icon: "/HR.png", type: "image/png" },
};

export default function RecruitmentLayout({ children }) {
  return (
    <RecruitmentClientLayout>
      <Suspense fallback={null}><RecruitmentActivityTracker /></Suspense>
      <div className="p-4">
        {children}
      </div>
    </RecruitmentClientLayout>
  );
}