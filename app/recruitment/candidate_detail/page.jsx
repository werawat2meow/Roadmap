"use client";

// import { useRouter } from "next/navigation";
import CandidateDetailTbale from '@/app/recruitment/components/recruit-candidate-detail-table';

export default function RecruitmentPage() {
    return (
    
      <div className="h-full w-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Candidate Detail
              </h1>

              {/* <p className="mt-2 text-slate-500">
                หน้านี้เป็นหน้าเริ่มต้นของระบบ Recruitment
              </p> */}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 w-full">
          <CandidateDetailTbale />
        </div>
      </div>
  );
}