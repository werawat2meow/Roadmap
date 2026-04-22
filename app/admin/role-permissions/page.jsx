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

   // #region Permission
    const router = useRouter();
    const { user, loadingUser } = useAuth();
    const canView = hasPermission(user, "role_permissions.view");
    const canEdit = hasPermission(user, "role_permissions.edit");

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

      const res = await fetch("/api/admin/permissions", { cache: "no-store" });
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

  useEffect(() => {
    Promise.all([loadRoles(), loadPermissions()]).catch((err) => {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    });
  }, []);

  useEffect(() => {
    loadAssignedPermissions(selectedRoleId);
  }, [selectedRoleId]);

  const groupedPermissions = useMemo(() => {
    const groups = {};

    permissions.forEach((item) => {
      const key = item.module_code || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [permissions]);

  const selectedRole = roles.find((item) => item.id === selectedRoleId);

  const handleSave = async () => {

    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Role Permissions");
      return;
    }

    if (!selectedRoleId) {
      swalError("กรุณาเลือก Role");
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
    if (!canEdit) {
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
    if (!canEdit) {
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

  // #region Permission
  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;
  // #endregion

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Role Permissions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              กำหนดสิทธิ์การใช้งานให้แต่ละ Role
            </p>
          </div>

          {canEdit && (
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

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
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
          options={roles.map((item) => ({
            value: item.id,
            label: `${item.role_code} - ${item.role_name}`,
          }))}
          className="w-full"
          size="large"
        />

        {selectedRole ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Role:</span> {selectedRole.role_name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedRole.description || "-"}
            </p>
          </div>
        ) : null}

        {selectedRole && !canEdit ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขสิทธิ์ของ Role นี้ได้
          </div>
        ) : null}
      </div>

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
          ) : Object.keys(groupedPermissions).length > 0 ? (
            Object.entries(groupedPermissions).map(([moduleCode, items]) => {
              const allChecked = items.every((item) =>
                selectedPermissionIds.includes(item.id)
              );

              return (
                <div
                  key={moduleCode}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 capitalize">
                        {moduleCode}
                      </h2>
                      <p className="text-sm text-slate-500">
                        จัดการสิทธิ์ของโมดูล {moduleCode}
                      </p>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(items)}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                          allChecked
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {allChecked ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((item) => {
                      const checked = selectedPermissionIds.includes(item.id);

                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                            canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                          } ${
                            checked
                              ? "border-slate-900 bg-slate-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEdit}
                            onChange={() => togglePermission(item.id)}
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
            })
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