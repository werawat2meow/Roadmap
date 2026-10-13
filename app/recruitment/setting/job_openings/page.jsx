"use client";

import { useRouter } from "next/navigation";
import RecruitJobOpenTable from '@/app/recruitment/components/recruit-job-open-table';
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import AntIcon from "@/components/AntIcon";

export default function RecruitmentPage() {
  const router = useRouter();

  const { isChecking, canView, canCreate } = usePageGuard({
    module: "recruitment.job.openings",
    unauthorizedRedirect: "/recruitment",
  });

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <div className="min-h-full w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <AntIcon name="SolutionOutlined" style={{ fontSize: 20 }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Recruitment management</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">รายการเปิดรับสมัครงาน</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">จัดการตำแหน่งงานที่เปิดรับ จำนวนอัตรา ช่วงเวลารับสมัคร และลิงก์สำหรับเผยแพร่</p>
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={() => router.push("/recruitment/setting/job_openings/create")}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                <AntIcon name="PlusOutlined" />
                เปิดรับสมัครตำแหน่งใหม่
              </button>
            )}
          </div>
        </section>

        <section>
          <RecruitJobOpenTable />
        </section>
      </div>
    </div>
  );
}
