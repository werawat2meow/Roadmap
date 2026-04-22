"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  status_code: "",
  status_name: "",
  color: "green",
  status: "active",
};

export default function EmployeeStatusesPage() {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

  const [employeeStatuses, setEmployeeStatuses] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "employee_statuses.view");
  const canCreate = hasPermission(user, "employee_statuses.create");
  const canEdit = hasPermission(user, "employee_statuses.edit");
  const canDelete = hasPermission(user, "employee_statuses.delete");

  
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

  const loadEmployeeStatuses = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/employee-statuses?search=${encodeURIComponent(keyword)}`
        : "/api/admin/employee-statuses";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load employee statuses failed");
      }

      setEmployeeStatuses(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeStatuses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployeeStatuses(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingStatus(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสถานะพนักงาน");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสถานะพนักงาน");
      return;
    }
    setEditingStatus(item);
    setForm({
      status_code: item.status_code || "",
      status_name: item.status_name || "",
      color: item.color || "green",
      status: item.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingStatus;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสถานะพนักงาน");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสถานะพนักงาน");
      return;
    }

    if (!form.status_code.trim() || !form.status_name.trim()) {
      swalError("กรุณากรอกรหัสสถานะและชื่อสถานะพนักงาน");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingStatus;
      const url = isEdit
        ? `/api/admin/employee-statuses/${editingStatus.id}`
        : "/api/admin/employee-statuses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status_code: form.status_code.trim().toUpperCase(),
          status_name: form.status_name.trim(),
          color: form.color,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedItem = data.data;

      if (isEdit) {
        setEmployeeStatuses((prev) =>
          prev.map((item) => (item.id === savedItem.id ? savedItem : item))
        );
        swalSuccess("อัพเดทสถานะพนักงานเรียบร้อยแล้ว");
      } else {
        setEmployeeStatuses((prev) => [savedItem, ...prev]);
        swalSuccess("บันทึกสถานะพนักงานเรียบร้อยแล้ว");
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
      swalError("คุณไม่มีสิทธิ์ลบสถานะพนักงาน");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบสถานะพนักงาน "${item.status_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      const res = await fetch(`/api/admin/employee-statuses/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setEmployeeStatuses((prev) => prev.filter((x) => x.id !== item.id));
      swalSuccess("ลบข้อมูลสถานะพนักงานเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const getColorClass = (color) => {
    switch (color) {
      case "green":
        return "border-green-200 bg-green-50 text-green-700";
      case "yellow":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
      case "red":
        return "border-red-200 bg-red-50 text-red-700";
      case "orange":
        return "border-orange-200 bg-orange-50 text-orange-700";
      case "blue":
        return "border-blue-200 bg-blue-50 text-blue-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
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
              สถานะพนักงาน
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการข้อมูลสถานะของพนักงานในระบบ
            </p>
             {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบสถานะพนักงาน
              </div>
            ) : null}
          </div>

            
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่มสถานะพนักงาน
            </button>
          )}

        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสสถานะ / ชื่อสถานะ"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-6 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 flex gap-2">
                <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-200" />
              </div>
            </div>
          ))
        ) : employeeStatuses.length > 0 ? (
          employeeStatuses.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border p-5 shadow-sm ${getColorClass(
                item.color
              )}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {item.status_code}
                  </p>

                  <h3 className="mt-2 text-lg font-bold">{item.status_name}</h3>

                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "active"
                          ? "bg-white/70 text-slate-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white"
                    >
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                        deletingId === item.id
                          ? "cursor-not-allowed border-slate-200 bg-white/60 text-slate-400"
                          : "border-red-200 bg-white/60 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  {!canEdit && !canDelete && (
                    <div className="text-xs text-slate-500 text-right">-</div>
                  )}
                </div>      
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-400 shadow-sm">
            ไม่พบข้อมูลสถานะพนักงาน
          </div>
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingStatus ? "แก้ไขสถานะพนักงาน" : "เพิ่มสถานะพนักงาน"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                จัดการข้อมูลสถานะพนักงานในระบบ
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสสถานะ
                </label>
                <input
                  type="text"
                  value={form.status_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status_code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="เช่น ACTIVE"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อสถานะ
                </label>
                <input
                  type="text"
                  value={form.status_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status_name: e.target.value,
                    }))
                  }
                  placeholder="เช่น พนักงานปัจจุบัน"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สี
                </label>
                <select
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="green">เขียว</option>
                  <option value="yellow">เหลือง</option>
                  <option value="red">แดง</option>
                  <option value="orange">ส้ม</option>
                  <option value="blue">น้ำเงิน</option>
                  <option value="slate">เทา</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะการใช้งาน
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
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingStatus && canEdit) || (!editingStatus && canCreate)) && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving ? "Saving..." : editingStatus ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}