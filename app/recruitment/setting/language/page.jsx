"use client";

import { useRouter } from "next/navigation";
import LanguageTable from "@/app/recruitment/components/LanguageTable";

export default function languagePage() {
    const router = useRouter();
    return (
    <div className="h-full w-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Setting language
            </h1>

            <p className="mt-2 text-slate-500">
              หน้าจัดการภาษาของหน้าประกาศรับสมัครงาน
            </p>
          </div>
          <div >
            <button
              type="button"
              onClick={() => router.push("/recruitment/setting/language/create")}
              className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
              style={{ backgroundColor: "green" }}
            >
              <span>+</span>
              <span>เปิดรายการรับสมัครพนักงาน</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 md:p-6 w-full">
        <LanguageTable />
      </div>
    </div>
  );
}