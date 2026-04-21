"use client";

import { useEffect, useState } from "react";
import { Select } from "antd";
import { swalConfirm, swalError, swalSuccess } from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

const initialForm = {
  employee_id: "",
  role_id: "",
  username: "",
  password: "",
  is_active: true,
};

const ITEMS_PER_PAGE = 20;

export default function UserAccountsPage() {
  const [search, setSearch] = useState("");
  const [userAccounts, setUserAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "user_accounts.view");
  const canCreate = hasPermission(user, "user_accounts.create");
  const canEdit = hasPermission(user, "user_accounts.edit");
  const canDelete = hasPermission(user, "user_accounts.delete");

  
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


  const loadEmployees = async (keyword = "") => {
    try {
      setEmployeeLoading(true);

      const url = `/api/admin/employees?search=${encodeURIComponent(
        keyword
      )}&limit=20`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load employees failed");
      }

      setEmployees(data.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลพนักงานได้");
    } finally {
      setEmployeeLoading(false);
    }
  };

  const loadUserAccounts = async (keyword = "", page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (keyword) params.set("search", keyword);
      params.set("page", String(page));
      params.set("pageSize", String(ITEMS_PER_PAGE));

      const res = await fetch(`/api/admin/user-accounts?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load user accounts failed");
      }

      setUserAccounts(data.data || []);
      setCurrentPage(data.pagination?.page || 1);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load roles failed");
      }

      setRoles(data.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูล Role ได้");
    }
  };

  useEffect(() => {
    Promise.all([loadUserAccounts(), loadRoles()]).catch((err) => {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUserAccounts(search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingUser(null);
    setEmployees([]);
  };

  const handleOpenCreate = async () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มผู้ใช้งาน");
      return;
    }

    resetForm();
    setOpenModal(true);
    await loadEmployees("");
  };

  const handleOpenEdit = async (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน");
      return;
    }

    if (item.username?.toLowerCase() === "admin") {
      swalError("ไม่สามารถแก้ไขผู้ใช้งาน admin ได้");
      return;
    }

    setEditingUser(item);
    setForm({
      employee_id: item.employee_id || "",
      role_id: item.role_id || "",
      username: item.username || "",
      password: "",
      is_active: !!item.is_active,
    });
    setOpenModal(true);
    await loadEmployees("");
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {

    const isEdit = !!editingUser;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มผู้ใช้งาน");
      return;
    }

    if (!form.username.trim()) {
      swalError("กรุณากรอก Username");
      return;
    }

    if (!editingUser && !form.password.trim()) {
      swalError("กรุณากรอกรหัสผ่าน");
      return;
    }

    if (!editingUser && form.password.trim().length < 6) {
      swalError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (editingUser && form.password.trim() && form.password.trim().length < 6) {
      swalError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingUser;
      const url = isEdit
        ? `/api/admin/user-accounts/${editingUser.id}`
        : "/api/admin/user-accounts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: form.employee_id || null,
          role_id: form.role_id || null,
          username: form.username.trim(),
          password: form.password.trim() || null,
          is_active: form.is_active,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      if (isEdit) {
        setUserAccounts((prev) =>
          prev.map((item) => (item.id === data.data.id ? data.data : item))
        );
        swalSuccess("อัพเดทผู้ใช้งานเรียบร้อยแล้ว");
      } else {
        setUserAccounts((prev) => [data.data, ...prev]);
        swalSuccess("เพิ่มผู้ใช้งานเรียบร้อยแล้ว");
      }

      handleCloseModal();
      await loadUserAccounts(search, currentPage);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบผู้ใช้งาน");
      return;
    }

    if (item.username?.toLowerCase() === "admin") {
      swalError("ไม่สามารถลบผู้ใช้งาน admin ได้");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบผู้ใช้งาน "${item.username}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      const res = await fetch(`/api/admin/user-accounts/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setUserAccounts((prev) => prev.filter((x) => x.id !== item.id));
      swalSuccess("ลบผู้ใช้งานเรียบร้อยแล้ว");
      await loadUserAccounts(search, currentPage);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const pageStart = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, total);

  if (loadingUser) return null;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ผู้ใช้งานระบบ</h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการบัญชีผู้ใช้งานที่สามารถเข้าสู่ระบบได้
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบผู้ใช้งานได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่มผู้ใช้งาน
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหา Username / รหัสพนักงาน / ชื่อพนักงาน"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
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
                <th className="px-6 py-4 text-left">Username</th>
                <th className="px-6 py-4 text-left">รหัสพนักงาน</th>
                <th className="px-6 py-4 text-left">ชื่อพนักงาน</th>
                <th className="px-6 py-4 text-left">เข้าใช้งานล่าสุด</th>
                <th className="px-6 py-4 text-left">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : userAccounts.length > 0 ? (
                userAccounts.map((item) => {
                  const isProtectedAdmin =
                    item.username?.toLowerCase() === "admin";

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {item.username}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.employee_code || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {item.employee_name || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.last_login_at
                          ? new Date(item.last_login_at).toLocaleString("th-TH")
                          : "-"}
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
                                disabled={isProtectedAdmin}
                                className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                  isProtectedAdmin
                                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {isProtectedAdmin ? "Protected" : "Edit"}
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                disabled={deletingId === item.id || isProtectedAdmin}
                                className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                  deletingId === item.id || isProtectedAdmin
                                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                }`}
                              >
                                {isProtectedAdmin
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
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลผู้ใช้งานระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && userAccounts.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              แสดง {pageStart}-{pageEnd} จากทั้งหมด {total} รายการ
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextPage = Math.max(currentPage - 1, 1);
                  loadUserAccounts(search, nextPage);
                }}
                disabled={currentPage === 1}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                  currentPage === 1
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                ก่อนหน้า
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => loadUserAccounts(search, page)}
                      className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold ${
                        currentPage === page
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextPage = Math.min(currentPage + 1, totalPages);
                  loadUserAccounts(search, nextPage);
                }}
                disabled={currentPage === totalPages}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                  currentPage === totalPages
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                ถัดไป
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingUser ? "แก้ไขผู้ใช้งานระบบ" : "เพิ่มผู้ใช้งานระบบ"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  พนักงาน
                </label>

                <Select
                  showSearch
                  allowClear
                  filterOption={false}
                  placeholder="ค้นหาพนักงาน"
                  value={form.employee_id || undefined}
                  onSearch={loadEmployees}
                  onFocus={() => {
                    if (employees.length === 0) {
                      loadEmployees("");
                    }
                  }}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      employee_id: value ?? "",
                    }))
                  }
                  notFoundContent={
                    employeeLoading ? "กำลังค้นหาพนักงาน..." : "ไม่พบข้อมูล"
                  }
                  options={employees.map((emp) => {
                    const fullNameTh =
                      emp.full_name_th ||
                      `${emp.first_name_th || ""} ${
                        emp.last_name_th || ""
                      }`.trim();

                    const fullNameEn =
                      emp.full_name_en ||
                      `${emp.first_name_en || ""} ${
                        emp.last_name_en || ""
                      }`.trim();

                    return {
                      value: emp.id,
                      label: `${emp.employee_code || "-"} - ${
                        fullNameTh || fullNameEn || "-"
                      }`,
                    };
                  })}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Role
                </label>

                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="เลือก Role"
                  value={form.role_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      role_id: value ?? "",
                    }))
                  }
                  options={roles.map((role) => ({
                    value: role.id,
                    label: `${role.role_code} - ${role.role_name}`,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="เช่น admin"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={
                    editingUser
                      ? "กรอกเมื่อต้องการเปลี่ยนรหัสผ่าน"
                      : "กรอกรหัสผ่านอย่างน้อย 6 ตัว"
                  }
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

              {((editingUser && canEdit) || (!editingUser && canCreate)) && (
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
                  {saving ? "Saving..." : editingUser ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}