/* =========================================================
   Employee Portal Access Helpers

   หน้าที่:
   - ตรวจ Permission ของ Employee Portal
   - ตรวจ Manager Self Service
   - ตรวจ HR / Admin Portal
   - รองรับ SUPER_ADMIN bypass

   ไม่ทำ:
   - Scope Query
   - Employee Data Filtering
   - API Authorization

   Scope จริงต้องตรวจที่ Backend อีกชั้น
========================================================= */

/* =========================================================
   Constants
========================================================= */

const EMPLOYEE_PORTAL_PERMISSION_PREFIX =
  "ep.";

const MANAGER_SELF_SERVICE_PERMISSION_PREFIX =
  "mss.";

/*
 * Permission Namespace ที่ถือว่าเป็นงาน
 * HR / Admin Portal
 *
 * ถ้าอนาคตเพิ่ม Module Namespace ใหม่
 * ให้เพิ่มที่นี่จุดเดียว
 */
const ADMIN_PERMISSION_PREFIXES = [
  "ems.",
  "policy.",
  "system.",
  "data.",
  "analytics.",
  "access.",
];

/* =========================================================
   Normalize
========================================================= */

export function normalizePermissionCode(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

/* =========================================================
   Permission Set
========================================================= */

export function getPermissionSet(
  user
) {
  const permissions =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  return new Set(
    permissions
      .map(
        normalizePermissionCode
      )
      .filter(Boolean)
  );
}

/* =========================================================
   SUPER ADMIN
========================================================= */

export function isSuperAdmin(
  user
) {
  const roles = [
    user?.role,
    user?.role_code,
  ]
    .filter(Boolean)
    .map(
      (value) =>
        String(value)
          .trim()
          .toUpperCase()
    );

  return roles.includes(
    "SUPER_ADMIN"
  );
}

/* =========================================================
   Generic Permission
========================================================= */

export function hasPermission(
  user,
  permission
) {
  if (!permission) {
    return true;
  }

  /*
   * SUPER_ADMIN bypass
   */
  if (
    isSuperAdmin(
      user
    )
  ) {
    return true;
  }

  const permissionCode =
    normalizePermissionCode(
      permission
    );

  if (!permissionCode) {
    return true;
  }

  return getPermissionSet(
    user
  ).has(
    permissionCode
  );
}

/* =========================================================
   Any Permission
========================================================= */

export function hasAnyPermission(
  user,
  permissions = []
) {
  if (
    isSuperAdmin(
      user
    )
  ) {
    return true;
  }

  if (
    !Array.isArray(
      permissions
    ) ||
    permissions.length ===
      0
  ) {
    return false;
  }

  const permissionSet =
    getPermissionSet(
      user
    );

  return permissions.some(
    (permission) =>
      permissionSet.has(
        normalizePermissionCode(
          permission
        )
      )
  );
}

/* =========================================================
   Permission Prefix
========================================================= */

export function hasPermissionPrefix(
  user,
  prefix
) {
  if (
    isSuperAdmin(
      user
    )
  ) {
    return true;
  }

  const normalizedPrefix =
    normalizePermissionCode(
      prefix
    );

  if (!normalizedPrefix) {
    return false;
  }

  const permissions =
    getPermissionSet(
      user
    );

  for (
    const permission of permissions
  ) {
    if (
      permission.startsWith(
        normalizedPrefix
      )
    ) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   Employee Portal Permission
========================================================= */

export function hasEmployeePortalPermission(
  user,
  permission
) {
  return hasPermission(
    user,
    permission
  );
}

/* =========================================================
   Employee Portal Access

   ต้องมี:
   ep.portal.view

   ตัวอย่าง:
   EMPLOYEE
   HR_OFFICER
   HR_MANAGER
   ...

   ทุกคนสามารถเข้า Employee Portal ได้
   ถ้า Role นั้นได้รับ ep.portal.view
========================================================= */

export function canAccessEmployeePortal(
  user
) {
  return hasPermission(
    user,
    "ep.portal.view"
  );
}

/* =========================================================
   Employee Self Service Access

   ใช้เช็กว่า User มี ep.* อย่างน้อยหนึ่งสิทธิ์หรือไม่
========================================================= */

export function hasEmployeeSelfServiceAccess(
  user
) {
  return hasPermissionPrefix(
    user,
    EMPLOYEE_PORTAL_PERMISSION_PREFIX
  );
}

/* =========================================================
   Manager Self Service Access

   เช่น:
   mss.team.view
   mss.approvals.view
========================================================= */

export function canAccessManagerSelfService(
  user
) {
  return hasPermissionPrefix(
    user,
    MANAGER_SELF_SERVICE_PERMISSION_PREFIX
  );
}

/* =========================================================
   HR / Admin Portal Access

   สำคัญ:
   ไม่ตรวจจาก Role Name เช่น HR_OFFICER
   แต่ตรวจจาก Permission จริง

   ตัวอย่าง:
   ems.*
   policy.*
   system.*
   data.*
   analytics.*
   access.*

   ดังนั้นถ้าอนาคตเพิ่ม Role ใหม่
   แต่มี Admin Permission
   ก็เข้า /admin ได้โดยไม่ต้องแก้ Logic Role
========================================================= */

export function canAccessAdminPortal(
  user
) {
  if (
    isSuperAdmin(
      user
    )
  ) {
    return true;
  }

  const permissionSet =
    getPermissionSet(
      user
    );

  for (
    const permission of permissionSet
  ) {
    const matched =
      ADMIN_PERMISSION_PREFIXES.some(
        (prefix) =>
          permission.startsWith(
            prefix
          )
      );

    if (matched) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   Portal Access Summary

   ใช้ได้กับ Login / Profile Switcher
========================================================= */

export function getPortalAccess(
  user
) {
  return {
    employee:
      canAccessEmployeePortal(
        user
      ),

    manager:
      canAccessManagerSelfService(
        user
      ),

    admin:
      canAccessAdminPortal(
        user
      ),
  };
}