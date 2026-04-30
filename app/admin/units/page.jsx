"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../components/Swal";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  code: "",
  name: "",
  division_id: "",
  status: "active",
};

export default function UnitsPage() {
  const [search, setSearch] = useState("");
  const [units, setUnits] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "units.view");
  const canCreate = hasPermission(user, "units.create");
  const canEdit = hasPermission(user, "units.edit");
  const canDelete = hasPermission(user, "units.delete");

  
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

  const loadDivisions = async () => {
    try {
      const res = await fetch("/api/admin/divisions?all=true", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load divisions failed");
      }

      setDivisions(data.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลฝ่ายได้");
    }
  };

  const loadUnits = async (keyword = "", nextPage = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(pageSize));

      if (keyword) params.set("search", keyword);

      const res = await fetch(`/api/admin/units?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load units failed");
      }

      const mapped = (data.data || []).map((unit) => ({
        id: unit.id,
        code: unit.unit_code,
        name: unit.unit_name,
        division_id: unit.division_id,
        division_name: unit.division_name,
        department_name: unit.department_name,
        status: unit.status,
      }));

      setUnits(mapped);
      setPage(data.pagination?.page || nextPage);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDivisions();
    loadUnits();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUnits(search,1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingUnit(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มหน่วย");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (unit) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขหน่วย");
      return;
    }

    setEditingUnit(unit);

    setForm({
      code: unit.code || "",
      name: unit.name || "",
      division_id: unit.division_id || "",
      status: unit.status || "active",
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingUnit;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขหน่วย");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มหน่วย");
      return;
    }

    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสหน่วยและชื่อหน่วย");
      return;
    }

    if (!form.division_id) {
      swalError("กรุณาเลือกฝ่าย");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/units/${editingUnit.id}`
        : "/api/admin/units";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit_code: form.code.trim(),
          unit_name: form.name.trim(),
          division_id: form.division_id,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      if (isEdit) {
        swalSuccess("อัพเดทข้อมูลหน่วยเรียบร้อยแล้ว");

        // ✅ reload หน้าเดิม
        await loadUnits(search, page);
      } else {
        swalSuccess("บันทึกข้อมูลหน่วยเรียบร้อยแล้ว");

        // ✅ กลับไปหน้า 1 เพื่อเห็นรายการใหม่
        await loadUnits(search, 1);
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบหน่วย");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบหน่วย "${unit.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(unit.id);

      const res = await fetch(`/api/admin/units/${unit.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      swalSuccess("ลบข้อมูลหน่วยเรียบร้อยแล้ว");

      const isLastItemOnPage = units.length === 1;
      const nextPage = isLastItemOnPage && page > 1 ? page - 1 : page;

      await loadUnits(search, nextPage);

    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const divisionOptions = Object.values( divisions.reduce((acc, division) => {
      const groupName = division.department_name || "ไม่ระบุแผนก";

      if (!acc[groupName]) {
        acc[groupName] = {
          label: groupName,
          options: [],
        };
      }

      acc[groupName].options.push({
        value: division.id,
        label: division.division_name,
      });

      return acc;
    }, {})
  ).sort((a, b) => a.label.localeCompare(b.label, "th"));

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">หน่วยงาน</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลหน่วยภายใต้แต่ละฝ่าย จุดปฏิบัติงานจริง
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบหน่วยได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + เพิ่มหน่วย
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสหน่วย / ชื่อหน่วย / ฝ่าย / แผนก"
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
                <th className="px-6 py-4 text-left font-semibold">รหัสหน่วย</th>
                <th className="px-6 py-4 text-left font-semibold">ชื่อหน่วยงาน</th>
                <th className="px-6 py-4 text-left font-semibold">ฝ่าย</th>
                <th className="px-6 py-4 text-left font-semibold">แผนก</th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-20 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-40 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : units.length > 0 ? (
                units.map((unit , index) => (
                  <tr
                    key={unit.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {unit.code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {unit.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {unit.division_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {unit.department_name || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          unit.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {unit.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(unit)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(unit)}
                              disabled={deletingId === unit.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === unit.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === unit.id ? "Deleting..." : "Delete"}
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
                    ไม่พบข้อมูลหน่วย
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              ทั้งหมด {total} รายการ
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => loadUnits(search, page - 1)}
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
                onClick={() => loadUnits(search, page + 1)}
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
                {editingUnit ? "แก้ไขหน่วย" : "เพิ่มหน่วย"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสหน่วย
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="เช่น FRONT"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อหน่วย
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="เช่น Front Office"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>
              
              {/* ฝ่าย */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ฝ่าย
                </label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกฝ่าย"
                  value={form.division_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, division_id: value ?? "" }))
                  }
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={divisionOptions}
                  className="w-full"
                  size="large"
                />
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

              {((editingUnit && canEdit) || (!editingUnit && canCreate)) && (
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
                  {saving ? "Saving..." : editingUnit ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}