import Link from "next/link";
import CandidateDetailTable from "@/app/recruitment/components/recruit-candidate-detail-table";
import RecruitmentBreadcrumb from "@/app/recruitment/components/RecruitmentBreadcrumb";

function UsersIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.1a7.5 7.5 0 0 0-6 0M18.5 16.3a5.5 5.5 0 0 1 3 2.2M5.5 16.3a5.5 5.5 0 0 0-3 2.2M12 14.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM18 12a2.75 2.75 0 1 0 0-5.5M6 12a2.75 2.75 0 1 1 0-5.5"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function RecruitmentPage() {
  return (
    <main className="relative min-h-full w-full overflow-hidden bg-slate-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-80 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <RecruitmentBreadcrumb
          className="mb-4"
          items={[{ label: "ผู้สมัครงาน" }]}
        />

        <section className="relative overflow-hidden rounded-[28px] border border-slate-800/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-7 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.65)] sm:px-8 sm:py-9 lg:px-10">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[42px] border-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-emerald-400/10 blur-2xl"
          />

          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-300 shadow-inner shadow-white/5 sm:flex">
                <UsersIcon />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Candidate Management
                  </p>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  รายการผู้สมัครงาน
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  ค้นหา กรอง และติดตามสถานะผู้สมัครได้อย่างสะดวกในที่เดียว
                </p>
              </div>
            </div>

            <Link
              href="/recruitment/candidate/create"
              className="group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:w-auto"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white transition-transform duration-200 group-hover:rotate-90">
                <PlusIcon />
              </span>
              เพิ่มผู้สมัครงาน
            </Link>
          </div>
        </section>

        <section aria-label="รายการผู้สมัครงาน" className="mt-5 sm:mt-6">
          <CandidateDetailTable />
        </section>
      </div>
    </main>
  );
}
