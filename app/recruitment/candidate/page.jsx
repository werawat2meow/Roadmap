"use client";

import { useRouter } from "next/navigation";
import CandidateDetailTbale from '@/app/recruitment/components/recruit-candidate-detail-table';


export default function RecruitmentPage() {

  const router = useRouter();

  return (
  
    <div className="h-full w-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Candidate Detail
            </h1>
          </div>

          <div className="justify-self-center md:justify-self-end">
            <button
              type="button"
              onClick={() => router.push("/recruitment/candidate/create")}
              className="rounded-lg px-4 py-2 text-white font-medium shadow-sm transition-colors cursor-pointer"
              style={{ backgroundColor: "green" }}
            >
              <span>+</span>
              <span>เพิ่มรายการ ผู้สมัครงาน</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 w-full">
        <CandidateDetailTbale />
      </div>
    </div>
  );
}