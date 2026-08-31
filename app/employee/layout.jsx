"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";

import {
  useAuth,
} from "@/contexts/AuthContext";

import EmployeePortalShell from "./components/EmployeePortalShell";

import {
  canAccessEmployeePortal,
} from "./lib/employeePortalAccess";

export default function EmployeePortalLayout({
  children,
}) {
  const router =
    useRouter();

  const {
    user,
    loadingUser,
  } =
    useAuth();

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );
      return;
    }

    if (
      !canAccessEmployeePortal(
        user
      )
    ) {
      router.replace(
        "/admin"
      );
    }
  }, [
    loadingUser,
    user,
    router,
  ]);

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (
    !user ||
    !canAccessEmployeePortal(
      user
    )
  ) {
    return null;
  }

  return (
    <EmployeePortalShell>
      {children}
    </EmployeePortalShell>
  );
}
