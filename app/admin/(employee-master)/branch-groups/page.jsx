"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";

const initialForm = {
  group_code: "",
  group_name: "",
  group_color: "#E2E8F0",
  sort_order: 0,
  status: "active",
};

export default function BranchGroupsPage() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.branch_groups.view");
  const canCreate = hasPermission(user, "ems.branch_groups.create");
  const canEdit = hasPermission(user, "ems.branch_groups.edit");
  const canDelete = hasPermission(user, "ems.branch_groups.delete");

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

  const loadGroups = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/branch-groups?search=${encodeURIComponent(keyword)}`
        : "/api/admin/branch-groups";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load branch groups failed");
      }

      setGroups(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGroups(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingGroup(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มกลุ่มสังกัด");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (group) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขกลุ่มสังกัด");
      return;
    }

    setEditingGroup(group);
    setForm({
      group_code: group.group_code || "",
      group_name: group.group_name || "",
      group_color: group.group_color || "#E2E8F0",
      sort_order: group.sort_order || 0,
      status: group.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingGroup;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขกลุ่มสังกัด");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มกลุ่มสังกัด");
      return;
    }

    if (!form.group_code.trim() || !form.group_name.trim()) {
      swalError("กรุณากรอกรหัสกลุ่มและชื่อกลุ่มสังกัด");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/branch-groups/${editingGroup.id}`
        : "/api/admin/branch-groups";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_code: form.group_code.trim(),
          group_name: form.group_name.trim(),
          group_color: form.group_color || "#E2E8F0",
          sort_order: Number(form.sort_order || 0),
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      if (isEdit) {
        setGroups((prev) =>
          prev.map((item) => (item.id === data.data.id ? data.data : item))
        );
        swalSuccess("อัพเดทข้อมูลกลุ่มสังกัดเรียบร้อยแล้ว");
      } else {
        setGroups((prev) => [data.data, ...prev]);
        swalSuccess("บันทึกข้อมูลกลุ่มสังกัดเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบกลุ่มสังกัด");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบกลุ่มสังกัด "${group.group_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(group.id);

      const res = await fetch(`/api/admin/branch-groups/${group.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setGroups((prev) => prev.filter((item) => item.id !== group.id));
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">กรุ๊ปสังกัด</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการกรุ๊ปสังกัด เช่น Mountain, Ocean, Factory, Cuisine
            </p>

            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบกลุ่มสังกัดได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + เพิ่มสีกรุ๊ปสังกัด
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสกลุ่ม / ชื่อกลุ่ม / สถานะ"
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
            />
          ))
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="h-24 border-b border-slate-200"
                style={{ backgroundColor: group.group_color || "#E2E8F0" }}
              />

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      {group.group_code}
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-800">
                      {group.group_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      ลำดับ: {group.sort_order ?? 0}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      group.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {group.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span
                    className="h-5 w-5 rounded-full border border-slate-300"
                    style={{ backgroundColor: group.group_color || "#E2E8F0" }}
                  />
                  <span className="font-mono text-xs">
                    {group.group_color || "#E2E8F0"}
                  </span>
                </div>

                {(canEdit || canDelete) ? (
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(group)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(group)}
                        disabled={deletingId === group.id}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                          deletingId === group.id
                            ? "cursor-not-allowed border-slate-200 text-slate-400"
                            : "border-red-200 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {deletingId === group.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-400 shadow-sm">
            ไม่พบข้อมูลกลุ่มแบรนด์
          </div>
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingGroup ? "แก้ไขกลุ่มแบรนด์" : "เพิ่มกลุ่มแบรนด์"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                กำหนดชื่อกลุ่มและสีสำหรับแสดงผลใน Organization Matrix
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสกลุ่ม
                </label>
                <input
                  type="text"
                  value={form.group_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      group_code: e.target.value,
                    }))
                  }
                  placeholder="เช่น MOUNTAIN"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อกลุ่ม
                </label>
                <input
                  type="text"
                  value={form.group_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      group_name: e.target.value,
                    }))
                  }
                  placeholder="เช่น Mountain"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สีของกลุ่ม
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={form.group_color}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        group_color: e.target.value,
                      }))
                    }
                    className="h-12 w-16 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
                  />

                  <input
                    type="text"
                    value={form.group_color}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        group_color: e.target.value,
                      }))
                    }
                    placeholder="#E2E8F0"
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ลำดับ
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ตัวอย่างสี
                </label>
                <div
                  className="rounded-3xl border border-slate-200 p-6 text-center text-sm font-semibold text-slate-700"
                  style={{ backgroundColor: form.group_color || "#E2E8F0" }}
                >
                  {form.group_name || "Branch Group Preview"}
                </div>
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
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

              {((editingGroup && canEdit) || (!editingGroup && canCreate)) && (
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
                  {saving ? "Saving..." : editingGroup ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}