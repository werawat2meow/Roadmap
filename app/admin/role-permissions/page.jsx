"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import { swalError, swalSuccess } from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedSystem, setSelectedSystem] = useState("");

  // #region Permisstion
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "access.role_permissions.view");
  const canManage = hasPermission(user, "access.role_permissions.manage");

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, canView, loadingUser, router]);

  // #endregion

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const res = await fetch("/api/admin/roles", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load roles failed");
      }

      setRoles(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "ไม่สามารถโหลดข้อมูล Role ได้");
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true);

      const res = await fetch("/api/admin/permissions?all=true", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load permissions failed");
      }

      setPermissions(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "ไม่สามารถโหลดข้อมูล Permission ได้");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const loadAssignedPermissions = async (roleId) => {
    if (!roleId) {
      setSelectedPermissionIds([]);
      return;
    }

    try {
      setLoadingAssigned(true);

      const res = await fetch(
        `/api/admin/role-permissions?role_id=${encodeURIComponent(roleId)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load assigned permissions failed");
      }

      setSelectedPermissionIds(
        (data.data || []).map((item) => item.permission_id)
      );
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดสิทธิ์ของ Role ได้");
    } finally {
      setLoadingAssigned(false);
    }
  };


  const canManageRole = (role) => {
    if (user?.role_code === "SUPER_ADMIN") return true;

    if (user?.role_code === "HR_ADMIN") {
      return ["HR_USER", "MANAGER"].includes(role.role_code);
    }

    if (user?.role_code === "BENEFIT_ADMIN") {
      return ["BENEFIT_USER"].includes(role.role_code);
    }

    return false;
  };

  const canManagePermissionItem = (permission) => {
    if (user?.role_code === "SUPER_ADMIN") return true;

    if (user?.role_code === "HR_ADMIN") {
      return permission.permission_code?.startsWith("ems.");
    }

    if (user?.role_code === "BENEFIT_ADMIN") {
      return permission.permission_code?.startsWith("benefit.");
    }

    return false;
  };

  useEffect(() => {
    Promise.all([loadRoles(), loadPermissions()]).catch((err) => {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    });
  }, []);

  useEffect(() => {
    loadAssignedPermissions(selectedRoleId);
  }, [selectedRoleId]);

  const getSystemGroup = (moduleCode = "") => {
    if (moduleCode.startsWith("benefit")) return "Benefit System";
    if (moduleCode.startsWith("payroll")) return "Payroll System";
    if (moduleCode.startsWith("hrm")) return "HRM System";
    if (moduleCode.startsWith("ems")) return "Employee Master";
    if (moduleCode.startsWith("leave")) return "Leave System";
    if (
      moduleCode.startsWith("user_accounts") ||
      moduleCode.startsWith("roles") ||
      moduleCode.startsWith("permissions") ||
      moduleCode.startsWith("role_permissions")
    ) {
      return "Access Control";
    }

    return "Other";
  };

  const getFeatureGroup = (moduleCode = "") => {
    if (!moduleCode) return "Other";

    const parts = moduleCode.split(".");

    if (parts.length >= 2) {
      return parts[1];
    }

    return moduleCode;
  };

  const groupedPermissions = useMemo(() => {
    const groups = {};

    permissions.filter(canManagePermissionItem).forEach((item) => {
      const systemKey = getSystemGroup(item.module_code);
      const featureKey = getFeatureGroup(item.module_code);

      if (!groups[systemKey]) groups[systemKey] = {};
      if (!groups[systemKey][featureKey]) groups[systemKey][featureKey] = [];

      groups[systemKey][featureKey].push(item);
    });

    return groups;
  }, [permissions]);

  const selectedRole = roles.find((item) => item.id === selectedRoleId);

  const systemOptions = Object.keys(groupedPermissions);

  const visibleGroupedPermissions = useMemo(() => {
    if (!selectedSystem) return groupedPermissions;

    return {
      [selectedSystem]: groupedPermissions[selectedSystem] || {},
    };
  }, [groupedPermissions, selectedSystem]);

  const handleSave = async () => {
    if (!canManage) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Role Permissions");
      return;
    }

    if (!selectedRoleId) {
      swalError("กรุณาเลือก Role");
      return;
    }

    if (
      selectedRole?.role_code === "SUPER_ADMIN" &&
      user?.role_code !== "SUPER_ADMIN"
    ) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Super Admin");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin/role-permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role_id: selectedRoleId,
          permission_ids: selectedPermissionIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      swalSuccess("บันทึกสิทธิ์ของ Role เรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permissionId) => {
    if (!canManage) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Role Permissions");
      return;
    }

    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModulePermissions = (moduleItems) => {
    if (!canManage) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Role Permissions");
      return;
    }

    const modulePermissionIds = moduleItems.map((item) => item.id);
    const allChecked = modulePermissionIds.every((id) =>
      selectedPermissionIds.includes(id)
    );

    if (allChecked) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !modulePermissionIds.includes(id))
      );
    } else {
      setSelectedPermissionIds((prev) => [
        ...new Set([...prev, ...modulePermissionIds]),
      ]);
    }
  };

  const toggleSystemPermissions = (featureGroups) => {
    if (!canManage) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Role Permissions");
      return;
    }

    const systemPermissionIds = Object.values(featureGroups)
      .flat()
      .map((item) => item.id);

    const allChecked = systemPermissionIds.every((id) =>
      selectedPermissionIds.includes(id)
    );

    if (allChecked) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !systemPermissionIds.includes(id))
      );
    } else {
      setSelectedPermissionIds((prev) => [
        ...new Set([...prev, ...systemPermissionIds]),
      ]);
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Role Permissions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              กำหนดสิทธิ์การใช้งานให้แต่ละ Role
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedRoleId}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                saving || !selectedRoleId
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {saving ? "Saving..." : "บันทึกสิทธิ์"}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          เลือก Role
        </label>

        <Select
          showSearch
          optionFilterProp="label"
          placeholder="เลือก Role"
          value={selectedRoleId || undefined}
          onChange={(value) => setSelectedRoleId(value || "")}
          loading={loadingRoles}
          options={roles
            .filter((item) => canManageRole(item))
            .map((item) => ({
              value: item.id,
              label: `${item.role_code} - ${item.role_name}`,
            }))}
          className="w-full"
          size="large"
        />

        {selectedRole ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Role:</span>{" "}
              {selectedRole.role_name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {selectedRole.description || "-"}
            </p>
          </div>
        ) : null}

        {selectedRole && !canManage ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขสิทธิ์ของ Role นี้ได้
          </div>
        ) : null}
      </div>

      {selectedRoleId ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            เลือกระบบ
          </label>

          <Select
            allowClear
            placeholder="เลือกระบบ เช่น Benefit System"
            value={selectedSystem || undefined}
            onChange={(value) => setSelectedSystem(value || "")}
            options={systemOptions.map((item) => ({
              value: item,
              label: item,
            }))}
            className="w-full"
            size="large"
          />

          <p className="mt-2 text-xs text-slate-400">
            ถ้าไม่เลือกระบบ จะแสดงทุกระบบ
          </p>
        </div>
      ) : null}

      {!selectedRoleId ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-400">
          กรุณาเลือก Role ก่อนกำหนดสิทธิ์
        </div>
      ) : (
        <div className="space-y-4">
          {loadingPermissions || loadingAssigned ? (
            [...Array(3)].map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[...Array(4)].map((__, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              </div>
            ))
          ) : Object.keys(visibleGroupedPermissions).length > 0 ? (
            Object.entries(visibleGroupedPermissions).map(
              ([systemName, featureGroups]) => {
                const systemPermissionIds = Object.values(featureGroups)
                  .flat()
                  .map((item) => item.id);

                const allSystemChecked =
                  systemPermissionIds.length > 0 &&
                  systemPermissionIds.every((id) =>
                    selectedPermissionIds.includes(id)
                  );

                return (
                  <div
                    key={systemName}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                          {systemName}
                        </h2>

                        <p className="text-sm text-slate-500">
                          จัดการสิทธิ์ของระบบ {systemName}
                        </p>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => toggleSystemPermissions(featureGroups)}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                            allSystemChecked
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {allSystemChecked
                            ? "ยกเลิกทั้งระบบ"
                            : "เลือกทั้งระบบ"}
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {Object.entries(featureGroups).map(
                        ([featureName, items]) => {
                          const allChecked = items.every((item) =>
                            selectedPermissionIds.includes(item.id)
                          );

                          return (
                            <div
                              key={`${systemName}-${featureName}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <h3 className="text-lg font-bold capitalize text-slate-800">
                                    {featureName}
                                  </h3>

                                  <p className="text-sm text-slate-500">
                                    {items.length} permissions
                                  </p>
                                </div>

                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleModulePermissions(items)
                                    }
                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                                      allChecked
                                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                                        : "bg-slate-900 text-white hover:bg-slate-800"
                                    }`}
                                  >
                                    {allChecked
                                      ? "ยกเลิกกลุ่มนี้"
                                      : "เลือกกลุ่มนี้"}
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {items.map((item) => {
                                  const checked =
                                    selectedPermissionIds.includes(item.id);

                                  return (
                                    <label
                                      key={item.id}
                                      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                                        canManage
                                          ? "cursor-pointer"
                                          : "cursor-not-allowed opacity-80"
                                      } ${
                                        checked
                                          ? "border-slate-900 bg-white"
                                          : "border-slate-200 bg-white hover:bg-slate-100"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!canManage}
                                        onChange={() =>
                                          togglePermission(item.id)
                                        }
                                        className="mt-1 h-4 w-4 rounded border-slate-300"
                                      />

                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-800">
                                          {item.permission_name}
                                        </p>

                                        <p className="text-sm text-slate-500">
                                          {item.permission_code}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                          {item.description || "-"}
                                        </p>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-400 shadow-sm">
              ไม่พบข้อมูล Permission
            </div>
          )}
        </div>
      )}
    </div>
  );
}