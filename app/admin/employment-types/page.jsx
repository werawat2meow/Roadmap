"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  type_code: "",
  type_name: "",
  status: "active",
};

export default function EmploymentTypesPage() {
  const [search, setSearch] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingEmploymentType, setEditingEmploymentType] = useState(null);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "employment_types.view");
  const canCreate = hasPermission(user, "employment_types.create");
  const canEdit = hasPermission(user, "employment_types.edit");
  const canDelete = hasPermission(user, "employment_types.delete");

  
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
  
  const loadEmploymentTypes = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/employment-types?search=${encodeURIComponent(keyword)}`
        : "/api/admin/employment-types";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load employment types failed");
      }

      const mapped = (data.data || []).map((item) => ({
        id: item.id,
        type_code: item.type_code,
        type_name: item.type_name,
        status: item.status,
      }));

      setEmploymentTypes(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmploymentTypes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmploymentTypes(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEmploymentType(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มประเภทการจ้าง");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขประเภทการจ้าง");
      return;
    }
    setEditingEmploymentType(item);
    setForm({
      type_code: item.type_code || "",
      type_name: item.type_name || "",
      status: item.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingEmploymentType;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขประเภทการจ้าง");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มประเภทการจ้าง");
      return;
    }
    
    if (!form.type_code.trim() || !form.type_name.trim()) {
      swalError("กรุณากรอกรหัสประเภทการจ้างและชื่อประเภทการจ้าง");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingEmploymentType;
      const url = isEdit
        ? `/api/admin/employment-types/${editingEmploymentType.id}`
        : "/api/admin/employment-types";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type_code: form.type_code.trim(),
          type_name: form.type_name.trim(),
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedItem = {
        id: data.data.id,
        type_code: data.data.type_code,
        type_name: data.data.type_name,
        status: data.data.status,
      };

      if (isEdit) {
        setEmploymentTypes((prev) =>
          prev.map((item) => (item.id === savedItem.id ? savedItem : item))
        );
        swalSuccess("อัพเดทประเภทการจ้างเรียบร้อยแล้ว");
      } else {
        setEmploymentTypes((prev) => [savedItem, ...prev]);
        swalSuccess("บันทึกประเภทการจ้างเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
     if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบประเภทการจ้าง");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบประเภทการจ้าง "${item.type_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      const res = await fetch(`/api/admin/employment-types/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setEmploymentTypes((prev) => prev.filter((x) => x.id !== item.id));
      swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              ประเภทการจ้าง
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการข้อมูลประเภทการจ้างของพนักงานในระบบ
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบประเภทการจ้างได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              + เพิ่มประเภทการจ้าง
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสประเภทการจ้าง / ชื่อประเภทการจ้าง"
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
                <th className="px-6 py-4 text-left font-semibold">
                  รหัสประเภทการจ้าง
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  ชื่อประเภทการจ้าง
                </th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-28 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-40 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : employmentTypes.length > 0 ? (
                employmentTypes.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {item.type_code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {item.type_name}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === item.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === item.id ? "Deleting..." : "Delete"}
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
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลประเภทการจ้าง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingEmploymentType ? "แก้ไขประเภทการจ้าง" : "เพิ่มประเภทการจ้าง"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {editingEmploymentType
                  ? "ปรับปรุงข้อมูลประเภทการจ้าง"
                  : "กรอกข้อมูลประเภทการจ้างใหม่"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสประเภทการจ้าง
                </label>
                <input
                  type="text"
                  value={form.type_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type_code: e.target.value,
                    }))
                  }
                  placeholder="เช่น FULLTIME"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อประเภทการจ้าง
                </label>
                <input
                  type="text"
                  value={form.type_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type_name: e.target.value,
                    }))
                  }
                  placeholder="เช่น พนักงานประจำ"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะ
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
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

              {((editingEmploymentType && canEdit) || (!editingEmploymentType && canCreate)) && (
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
                  {saving ? "Saving..." : editingEmploymentType ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}