"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

type PageGuardProps = {
  module: string;
  loginRedirect?: string;
  unauthorizedRedirect?: string;
};

export default function usePageGuard({
  module,
  loginRedirect = "/login",
  unauthorizedRedirect,
}: PageGuardProps) {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const finalUnauthorizedRedirect = unauthorizedRedirect || "/admin";

  const permissions = useMemo(
    () => ({
      view: hasPermission(user, `${module}.view`),
      create: hasPermission(user, `${module}.create`),
      edit: hasPermission(user, `${module}.edit`),
      delete: hasPermission(user, `${module}.delete`),
    }),
    [user, module]
  );

  const isChecking = loadingUser;
  const isAuthorized =
    !loadingUser && !!user && permissions.view;

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace(loginRedirect);
      return;
    }

    if (!permissions.view) {
      router.replace(finalUnauthorizedRedirect);
    }
  }, [
    loadingUser,
    user,
    permissions.view,
    router,
    loginRedirect,
    finalUnauthorizedRedirect,
  ]);

  return useMemo(
    () => ({
      user,
      isChecking,
      isAuthorized,
      canView: permissions.view,
      canCreate: permissions.create,
      canEdit: permissions.edit,
      canDelete: permissions.delete,
    }),
    [user, isChecking, isAuthorized, permissions]
  );
}