import { useEffect } from "react";
import {useAuth} from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

export default function usePermissions(module, { redirectTo = "/admin" } = {}) {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const can = (action) => hasPermission(user, `${module}.${action}`);
  const canView = can("view");

  useEffect(() => {
    if (loadingUser) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canView) router.replace(redirectTo);
  }, [user, canView, loadingUser]);

  return { user, loadingUser, canView, canCreate: can("create"), canEdit: can("edit"), canDelete: can("delete") };
}




