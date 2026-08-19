"use client";

import { useRouter } from "next/navigation";
import RecruitJobOpenTable from '@/app/recruitment/components/recruit-job-open-table';
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

export default function RecruitmentPage() {
  const router = useRouter();

  const { isChecking, canView, canCreate } = usePageGuard({
    module: "recruitment.job.openings",
    unauthorizedRedirect: "/recruitment",
  });

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
      <div className="h-full w-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center rounded-3xl bg-white p-6 shadow-sm">
            <div className="justify-self-center md:justify-self-start">
              <h1 className="text-2xl font-bold text-slate-800">  Job Openings </h1>
              <p className="mt-2 text-slate-500"> หน้าจัดการการเปิดรับสมัครงาน </p>
            </div>
            { canCreate && (
              <div className="justify-self-center md:justify-self-end">
                <button
                  type="button"
                  onClick={() => router.push("/recruitment/setting/job_openings/create")}
                  className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
                  style={{ backgroundColor: "green" }}
                >
                  <span>+</span>
                  <span>เปิดรายการรับสมัครพนักงาน</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 w-full">
          <RecruitJobOpenTable />
        </div>
      </div>
  );
}