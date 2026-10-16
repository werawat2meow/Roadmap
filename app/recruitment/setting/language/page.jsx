"use client";

import { useRouter } from "next/navigation";
import LanguageTable from "@/app/recruitment/components/LanguageTable";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import AntIcon from "@/components/AntIcon";

export default function LanguagePage() {
  const router = useRouter();
  
  const { isChecking, canView, canCreate } = usePageGuard({
    module: "recruitment.language",
    unauthorizedRedirect: "/recruitment",
  });

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <div className="min-h-full w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-teal-300/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <AntIcon name="GlobalOutlined" style={{ fontSize: 20 }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Recruitment settings
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                จัดการภาษา
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                กำหนดภาษาที่ใช้แสดงผลในหน้าประกาศรับสมัครงาน
                เพื่อให้ผู้สมัครเข้าถึงข้อมูลได้อย่างเหมาะสม
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() => router.push("/recruitment/setting/language/create")}
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-md shadow-emerald-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800 active:translate-y-0 sm:w-auto"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <AntIcon name="PlusOutlined" />
                </span>
                <span>เพิ่มภาษาใหม่</span>
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="language-list-title">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <AntIcon name="TranslationOutlined" />
              </span>
              <div>
                <h2
                  id="language-list-title"
                  className="text-lg font-bold text-slate-900"
                >
                  ภาษาสำหรับหน้ารับสมัครงาน
                </h2>
                <p className="mt-0.5 text-sm leading-6 text-slate-500">
                  ตรวจสอบสถานะ แก้ไข และจัดการภาษาที่เปิดให้ใช้งาน
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              อัปเดตสถานะได้จากตาราง
            </div>
          </div>

          <LanguageTable />
        </section>
      </div>
    </div>
  );
}
