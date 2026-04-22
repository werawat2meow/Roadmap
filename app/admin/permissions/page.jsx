"use client";

import { useEffect, useState } from "react";
import { swalConfirm, swalError, swalSuccess } from "../../components/Swal";
import { Pagination } from "antd";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  module_code: "",
  action_code: "",
  permission_code: "",
  permission_name: "",
  description: "",
  is_active: true,
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const paginatedPermissions = permissions.slice((currentPage - 1) * pageSize,currentPage * pageSize);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "permissions.view");
  const canCreate = hasPermission(user, "permissions.create");
  const canEdit = hasPermission(user, "permissions.edit");
  const canDelete = hasPermission(user, "permissions.delete");

  
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

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/permissions", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load permissions failed");
      }

      setPermissions(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingPermission(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Permission");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {

    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Permission");
      return;
    }

    if (item.is_system) {
      swalError("ไม่สามารถแก้ไข System Permission ได้");
      return;
    }

    setEditingPermission(item);
    setForm({
      module_code: item.module_code || "",
      action_code: item.action_code || "",
      permission_code: item.permission_code || "",
      permission_name: item.permission_name || "",
      description: item.description || "",
      is_active: !!item.is_active,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingPermission;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Permission");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Permission");
      return;
    }

    if (!form.module_code.trim()) {
      swalError("กรุณากรอก Module");
      return;
    }

    if (!form.action_code.trim()) {
      swalError("กรุณากรอก Action");
      return;
    }

    if (!form.permission_code.trim()) {
      swalError("กรุณากรอก Permission Code");
      return;
    }

    if (!form.permission_name.trim()) {
      swalError("กรุณากรอก Permission Name");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingPermission;
      const url = isEdit
        ? `/api/admin/permissions/${editingPermission.id}`
        : "/api/admin/permissions";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module_code: form.module_code.trim().toLowerCase(),
          action_code: form.action_code.trim().toLowerCase(),
          permission_code: form.permission_code.trim().toLowerCase(),
          permission_name: form.permission_name.trim(),
          description: form.description.trim() || null,
          is_active: form.is_active,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      swalSuccess(
        isEdit
          ? "อัพเดท Permission เรียบร้อยแล้ว"
          : "เพิ่ม Permission เรียบร้อยแล้ว"
      );

      handleCloseModal();
      await loadPermissions();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {

    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Permission");
      return;
    }

    if (item.is_system) {
      swalError("ไม่สามารถลบ System Permission ได้");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบ Permission "${item.permission_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      const res = await fetch(`/api/admin/permissions/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setPermissions((prev) => prev.filter((x) => x.id !== item.id));
      swalSuccess("ลบ Permission เรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
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
            <h1 className="text-2xl font-bold text-slate-800">Permissions</h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการสิทธิ์การเข้าถึงเมนูและการใช้งานในระบบ
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่ม Permission
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left">ลำดับ</th>
                <th className="px-6 py-4 text-left">Module</th>
                <th className="px-6 py-4 text-left">Action</th>
                <th className="px-6 py-4 text-left">Permission Code</th>
                <th className="px-6 py-4 text-left">Permission Name</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : permissions.length > 0 ? (
                paginatedPermissions.map((item , index) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {item.module_code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {item.action_code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {item.permission_code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {item.permission_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {item.description || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              disabled={item.is_system}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                item.is_system
                                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {item.is_system ? "Protected" : "Edit"}
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id || item.is_system}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === item.id || item.is_system
                                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {item.is_system
                                ? "Protected"
                                : deletingId === item.id
                                  ? "Deleting..."
                                  : "Delete"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-right text-slate-400">-</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูล Permission
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">
              แสดง {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, permissions.length)} จาก {permissions.length} รายการ
            </span>

            <Pagination
              current={currentPage}
              total={permissions.length}
              pageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              className="[&_.ant-pagination-item-active]:!bg-slate-900 [&_.ant-pagination-item-active]:!border-slate-900 [&_.ant-pagination-item-active_a]:!text-white [&_.ant-pagination-item]:!rounded-xl [&_.ant-pagination-prev_.ant-pagination-item-link]:!rounded-xl [&_.ant-pagination-next_.ant-pagination-item-link]:!rounded-xl"
            />
          </div>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPermission ? "แก้ไข Permission" : "เพิ่ม Permission"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Module
                </label>
                <input
                  type="text"
                  value={form.module_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      module_code: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="เช่น employees"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Action
                </label>
                <input
                  type="text"
                  value={form.action_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      action_code: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="เช่น view / create / edit / delete"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Permission Code
                </label>
                <input
                  type="text"
                  value={form.permission_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      permission_code: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="เช่น employees.view"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Permission Name
                </label>
                <input
                  type="text"
                  value={form.permission_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      permission_name: e.target.value,
                    }))
                  }
                  placeholder="เช่น ดูข้อมูลพนักงาน"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="รายละเอียดสิทธิ์การใช้งาน"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะการใช้งาน
                </label>
                <select
                  value={form.is_active ? "true" : "false"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.value === "true",
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingPermission && canEdit) || (!editingPermission && canCreate)) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving ? "Saving..." : editingPermission ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}