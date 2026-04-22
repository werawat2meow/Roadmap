"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../components/Swal";
import { Tooltip } from "antd";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  code: "",
  name: "",
  branch_ids: [],
  status: "active",
};

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "departments.view");
  const canCreate = hasPermission(user, "departments.create");
  const canEdit = hasPermission(user, "departments.edit");
  const canDelete = hasPermission(user, "departments.delete");

  
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

  const loadBranches = async () => {
    try {
      const res = await fetch("/api/admin/branches", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load branches failed");
      }

      setBranches(data.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลสาขาได้");
    }
  };

  const loadDepartments = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/departments?search=${encodeURIComponent(keyword)}`
        : "/api/admin/departments";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load departments failed");
      }

      const mapped = (data.data || []).map((department) => ({
        id: department.id,
        code: department.department_code,
        name: department.department_name,
        branch_ids: department.branch_ids || [],
        branch_names: department.branch_names || [],
        status: department.status,
      }));

      setDepartments(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadBranches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDepartments(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingDepartment(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (department) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
      return;
    }

    setEditingDepartment(department);

    setForm({
      code: department.code || "",
      name: department.name || "",
      branch_ids: department.branch_ids || [],
      status: department.status || "active",
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {

    const isEdit = !!editingDepartment;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
      return;
    }

    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสแผนกและชื่อแผนก");
      return;
    }

    if (!form.branch_ids.length) {
      swalError("กรุณาเลือกสาขาอย่างน้อย 1 รายการ");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingDepartment;
      const url = isEdit
        ? `/api/admin/departments/${editingDepartment.id}`
        : "/api/admin/departments";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department_code: form.code.trim(),
          department_name: form.name.trim(),
          branch_ids: form.branch_ids,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedDepartment = {
        id: data.data.id,
        code: data.data.department_code,
        name: data.data.department_name,
        branch_ids: data.data.branch_ids || [],
        branch_names: data.data.branch_names || [],
        status: data.data.status,
      };

      if (isEdit) {
        setDepartments((prev) =>
          prev.map((item) =>
            item.id === savedDepartment.id ? savedDepartment : item
          )
        );
        swalSuccess("อัพเดทข้อมูลแผนกเรียบร้อยแล้ว");
      } else {
        setDepartments((prev) => [savedDepartment, ...prev]);
        swalSuccess("บันทึกข้อมูลแผนกเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
     if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบแผนก");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบแผนก "${department.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(department.id);

      const res = await fetch(`/api/admin/departments/${department.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setDepartments((prev) =>
        prev.filter((item) => item.id !== department.id)
      );

      swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const BranchBadges = ({ names = [] }) => {
    const SHOW = 4;
    const visible = names.slice(0, SHOW);
    const hidden = names.slice(SHOW);

    if (!names.length) return <span className="text-slate-400">-</span>;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-slate-400 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
            {name}
          </span>
        ))}

        {hidden.length > 0 && (
          <Tooltip
            title={
              <div className="flex flex-col gap-1 py-0.5">
                {hidden.map((name) => (
                  <div key={name} className="flex items-center gap-2 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {name}
                  </div>
                ))}
              </div>
            }
            placement="top"
            color="#0f172a"
          >
            <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-[5px] border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              +{hidden.length} more
            </span>
          </Tooltip>
        )}
      </div>
    );
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">แผนก</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลแผนกในแต่ละสาขา
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบแผนกได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + เพิ่มแผนก
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสแผนก / ชื่อแผนก / สาขา"
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

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
                <th className="px-6 py-4 text-left font-semibold">รหัสแผนก</th>
                <th className="px-6 py-4 text-left font-semibold">ชื่อแผนก</th>
                <th className="px-6 py-4 text-left font-semibold">สาขาที่ดูแล</th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-16 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-28 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-14 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-200" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : departments.length > 0 ? (
                departments.map((department,index) => (
                  <tr
                    key={department.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {department.code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {department.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {department.branch_names?.length ? (
                        <BranchBadges names={department.branch_names ?? []} />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          department.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {department.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(department)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(department)}
                              disabled={deletingId === department.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === department.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === department.id ? "Deleting..." : "Delete"}
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
                    ไม่พบข้อมูลแผนก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingDepartment ? "แก้ไขแผนก" : "เพิ่มแผนก"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingDepartment ? "ปรับปรุงข้อมูลแผนก" : "กรอกข้อมูลแผนกใหม่"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสแผนก
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  placeholder="เช่น OPS"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อแผนก
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="เช่น Operations"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สาขา
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {form.branch_ids.length > 0 ? (
                      form.branch_ids.map((selectedId) => {
                        const selectedBranch = branches.find(
                          (branch) => branch.id === selectedId
                        );

                        return (
                          <span
                            key={selectedId}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                          >
                            {selectedBranch?.branch_name || selectedId}
                            <button
                              type="button"
                              disabled={editingDepartment ? !canEdit : !canCreate}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  branch_ids: prev.branch_ids.filter(
                                    (id) => id !== selectedId
                                  ),
                                }))
                              }
                              className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/30"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400">ยังไม่ได้เลือกสาขา</p>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {branches.map((branch) => {
                        const isChecked = form.branch_ids.includes(branch.id);

                        return (
                          <label
                            key={branch.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                              isChecked
                                ? "border-slate-900 bg-slate-900/5"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={editingDepartment ? !canEdit : !canCreate}
                              onChange={(e) => {
                                const value = branch.id;
                                const nextIds = e.target.checked
                                  ? [...form.branch_ids, value]
                                  : form.branch_ids.filter((id) => id !== value);

                                setForm((prev) => ({
                                  ...prev,
                                  branch_ids: nextIds,
                                }));
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                            />

                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm ${
                                  isChecked
                                    ? "font-semibold text-slate-900"
                                    : "text-slate-700"
                                }`}
                              >
                                {branch.branch_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {branch.branch_code || "Branch"}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      เลือกได้มากกว่า 1 สาขา
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      เลือกแล้ว {form.branch_ids.length} รายการ
                    </span>
                  </div>
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

              {((editingDepartment && canEdit) || (!editingDepartment && canCreate)) && (
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
                  {saving ? "Saving..." : editingDepartment ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}