"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  code: "",
  name: "",
  department_id: "",
  status: "active",
};

export default function DivisionsPage() {
  const [search, setSearch] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "divisions.view");
  const canCreate = hasPermission(user, "divisions.create");
  const canEdit = hasPermission(user, "divisions.edit");
  const canDelete = hasPermission(user, "divisions.delete");

  
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

  const loadDepartments = async () => {
    try {
      const res = await fetch("/api/admin/departments", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load departments failed");
      }

      setDepartments(data.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลแผนกได้");
    }
  };

  const loadDivisions = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/divisions?search=${encodeURIComponent(keyword)}`
        : "/api/admin/divisions";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load divisions failed");
      }

      const mapped = (data.data || []).map((division) => ({
        id: division.id,
        code: division.division_code,
        name: division.division_name,
        department_id: division.department_id,
        department_name: division.department_name,
        status: division.status,
      }));

      setDivisions(mapped);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadDivisions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDivisions(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingDivision(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มฝ่าย");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (division) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขฝ่าย");
      return;
    }
    setEditingDivision(division);

    setForm({
      code: division.code || "",
      name: division.name || "",
      department_id: division.department_id || "",
      status: division.status || "active",
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingDivision;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขฝ่าย");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มฝ่าย");
      return;
    }

    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสฝ่ายและชื่อฝ่าย");
      return;
    }

    if (!form.department_id) {
      swalError("กรุณาเลือกแผนก");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingDivision;

      const url = isEdit
        ? `/api/admin/divisions/${editingDivision.id}`
        : "/api/admin/divisions";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          division_code: form.code.trim(),
          division_name: form.name.trim(),
          department_id: form.department_id,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedDivision = {
        id: data.data.id,
        code: data.data.division_code,
        name: data.data.division_name,
        department_id: data.data.department_id,
        department_name: data.data.department_name,
        status: data.data.status,
      };

      if (isEdit) {
        setDivisions((prev) =>
          prev.map((item) =>
            item.id === savedDivision.id ? savedDivision : item
          )
        );

        swalSuccess("อัพเดทข้อมูลฝ่ายเรียบร้อยแล้ว");
      } else {
        setDivisions((prev) => [savedDivision, ...prev]);
        setPage(1);
        swalSuccess("บันทึกข้อมูลฝ่ายเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (division) => {
     if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบฝ่าย");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบฝ่าย "${division.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(division.id);

      const res = await fetch(`/api/admin/divisions/${division.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      const nextDivisions = divisions.filter((item) => item.id !== division.id);
      setDivisions(nextDivisions);

      const nextTotalPages = Math.max(1, Math.ceil(nextDivisions.length / pageSize));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }

      swalSuccess("ลบข้อมูลฝ่ายเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const totalPages = Math.max(1, Math.ceil(divisions.length / pageSize));
  const paginatedDivisions = divisions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ฝ่าย</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลฝ่ายภายใต้แต่ละแผนก
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบฝ่ายได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + เพิ่มฝ่าย
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสฝ่าย / ชื่อฝ่าย / แผนก"
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
                <th className="px-6 py-4 text-left font-semibold">รหัสฝ่าย</th>
                <th className="px-6 py-4 text-left font-semibold">ชื่อฝ่าย</th>
                <th className="px-6 py-4 text-left font-semibold">แผนก</th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4"><div className="h-3.5 w-20 animate-pulse rounded-md bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-40 animate-pulse rounded-md bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="ml-auto h-8 w-24 animate-pulse rounded-xl bg-slate-200" /></td>
                  </tr>
                ))
              ) : paginatedDivisions.length > 0 ? (
                paginatedDivisions.map((division , index) => (
                  <tr
                    key={division.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {division.code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {division.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {division.department_name || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          division.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {division.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(division)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(division)}
                              disabled={deletingId === division.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === division.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === division.id ? "Deleting..." : "Delete"}
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
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    ไม่พบข้อมูลฝ่าย
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              ทั้งหมด {divisions.length} รายการ
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>

              <span className="text-sm text-slate-600">
                หน้า {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingDivision ? "แก้ไขฝ่าย" : "เพิ่มฝ่าย"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสฝ่าย
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="เช่น FIN"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อฝ่าย
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="เช่น Finance"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  แผนก
                </label>
                <select
                  value={form.department_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      department_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกแผนก</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะ
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

              {((editingDivision && canEdit) || (!editingDivision && canCreate)) && (
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
                  {saving ? "Saving..." : editingDivision ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
