"use client";

import { useMemo } from "react";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import {
  useAccessScopeFromUser,
} from "@/hooks/useAccessScope";

/* =========================================================
   User Access Assignment Frontend Access Hook

   Permission = เปิดหน้า / ปุ่ม Action
   Scope      = จำกัดข้อมูลและตัวเลือกที่เห็น
========================================================= */

export default function useUserAccessAssignmentAccess() {
  const {
    user,
    loadingUser,
    refreshUser,
    setUser,
  } = useAuth();

  const scope =
    useAccessScopeFromUser(
      user,
      loadingUser
    );

  const permissions = useMemo(
    () => ({
      canView: hasPermission(
        user,
        "access.user_access_assignments.view"
      ),

      canCreate: hasPermission(
        user,
        "access.user_access_assignments.create"
      ),

      canEdit: hasPermission(
        user,
        "access.user_access_assignments.edit"
      ),

      canDelete: hasPermission(
        user,
        "access.user_access_assignments.delete"
      ),
    }),
    [user]
  );

  return {
    user,
    loadingUser,
    refreshUser,
    setUser,

    ...permissions,
    ...scope,

    /*
     * ถ้าต้องการซ่อนเมนู/หน้าเมื่อไม่มี Scope เลย
     * ใช้ canViewScoped ได้
     *
     * แต่ค่า canView ยังยึด Permission เดิม 100%
     */
    canViewScoped:
      permissions.canView &&
      scope.hasAnyScope,
  };
}
