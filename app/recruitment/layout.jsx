"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import LoadingOrb from "../components/LoadingOrb";
import { useEffect } from "react";

function RecruitmentAuthGuard({ children }) {
  const { user, loadingUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loadingUser, router]);

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingOrb />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}


export default function RecruitmentLayout({ children }) {
    return (
        <AuthProvider>
            <RecruitmentAuthGuard>
                {children}
            </RecruitmentAuthGuard>
        </AuthProvider>
    );
}