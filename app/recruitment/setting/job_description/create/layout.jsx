"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

function JobDescriptionCreateAuthGuard({ children }) {
    const { user, loadingUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
    if (loadingUser) return;

    if (!user) {
        router.replace("/login");
    }
    }, [user, loadingUser, router]);


    if (!user) return null;

    return <>{children}</>;
}

export default function JobDescriptionCreateLayout({ children }) {
    return (
        <AuthProvider>
          <JobDescriptionCreateAuthGuard>
            {children}
          </JobDescriptionCreateAuthGuard>
        </AuthProvider>
    );
}