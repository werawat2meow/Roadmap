import RecruitmentClientLayout from "@/app/recruitment/components/RecruitmentClientLayout";

export const metadata = {
  title: "Recruitment System",
  description: "Recruitment Management System",
};

export default function RecruitmentLayout({ children }) {
  return <RecruitmentClientLayout>{children}</RecruitmentClientLayout>;
}