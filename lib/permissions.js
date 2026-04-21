export function hasPermission(user, permissionCode) {
  if (!user) return false;

  return Array.isArray(user.permissions)
    ? user.permissions.includes(permissionCode)
    : false;
}