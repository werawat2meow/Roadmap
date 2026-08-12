import RecruitmentClientLayout from "@/app/recruitment/RecruitmentClientLayout";
import "./recruitment.css";

export const metadata = {
  title: "Recruitment System",
  description: "Recruitment Management System",
};

export default function RecruitmentLayout({ children }) {
  return (
    <RecruitmentClientLayout>
      <div className="p-4">
        {children}
      </div>
    </RecruitmentClientLayout>
  );
}