"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RecruitmentPage() {

  const { user, loadingUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loadingUser, router]);

  if (!user) return null;

    return (
      <div className="flex h-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Recruitment System
              </h1>

              <p className="mt-2 text-slate-500">
                หน้านี้เป็นหน้าเริ่มต้นของระบบ Recruitment
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}