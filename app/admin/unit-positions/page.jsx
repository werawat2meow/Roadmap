"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import { swalSuccess, swalError, swalConfirm } from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  unit_id: "",
  position_id: "",
  headcount_target: 0,
  status: "active",
};

export default function UnitPositionsPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(initialForm);

  // Partition
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "unit_positions.view");
  const canCreate = hasPermission(user, "unit_positions.create");
  const canEdit = hasPermission(user, "unit_positions.edit");
  const canDelete = hasPermission(user, "unit_positions.delete");

  
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

  const loadUnits = async () => {
    try {
      const res = await fetch("/api/admin/units?all=true", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load units failed");
      }

      setUnits(data.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลหน่วยงานได้");
    }
  };

  const loadPositions = async () => {
    try {
      const res = await fetch("/api/admin/positions?all=true", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load positions failed");
      }

      setPositions(data.data || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    }
  };

  const loadUnitPositions = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/unit-positions?search=${encodeURIComponent(keyword)}`
        : "/api/admin/unit-positions";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load unit positions failed");
      }

      setRows(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
    loadPositions();
    loadUnitPositions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUnitPositions(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingRow(null);
  };

  const handleOpenCreate = () => {
     if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลกำหนดตำแหน่งตามหน่วย");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (row) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลกำหนดตำแหน่งตามหน่วย");
      return;
    }
    
    setEditingRow(row);
    setForm({
      unit_id: row.unit_id || "",
      position_id: row.position_id || "",
      headcount_target: row.headcount_target ?? 0,
      status: row.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {

    const isEdit = !!editingRow;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลกำหนดตำแหน่งตามหน่วย");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลกำหนดตำแหน่งตามหน่วย");
      return;
    }


    if (!form.unit_id) {
      swalError("กรุณาเลือกหน่วยงาน");
      return;
    }

    if (!form.position_id) {
      swalError("กรุณาเลือกตำแหน่ง");
      return;
    }

    if (Number(form.headcount_target) < 0) {
      swalError("จำนวนอัตราต้องไม่น้อยกว่า 0");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingRow;
      const url = isEdit
        ? `/api/admin/unit-positions/${editingRow.id}`
        : "/api/admin/unit-positions";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit_id: form.unit_id,
          position_id: form.position_id,
          headcount_target: Number(form.headcount_target) || 0,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const saved = data.data;

      if (isEdit) {
        setRows((prev) =>
          prev.map((item) => (item.id === saved.id ? saved : item))
        );
        swalSuccess("อัพเดทข้อมูลเรียบร้อยแล้ว");
      } else {
        setRows((prev) => [saved, ...prev]);
        swalSuccess("บันทึกข้อมูลเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูลกำหนดตำแหน่งตามหน่วย");
      return;
    }
    
    const confirmed = await swalConfirm(
      `ต้องการลบการผูกตำแหน่ง "${row.position_name}" กับหน่วย "${row.unit_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);

      const res = await fetch(`/api/admin/unit-positions/${row.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setRows((prev) => prev.filter((item) => item.id !== row.id));
      const nextRows = rows.filter((item) => item.id !== row.id);
      setRows(nextRows);

      const nextTotalPages = Math.max(1, Math.ceil(nextRows.length / pageSize));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
      swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const unitOptions = useMemo(() => {
    return Object.values(
      units.reduce((acc, unit) => {
        const groupName = unit.department_name || "ไม่ระบุแผนก";

        if (!acc[groupName]) {
          acc[groupName] = {
            label: groupName,
            options: [],
          };
        }

        acc[groupName].options.push({
          value: unit.id,
          label: `${unit.unit_name} (${unit.division_name || "-"})`,
        });

        return acc;
      }, {})
    ).sort((a, b) => a.label.localeCompare(b.label, "th"));
  }, [units]);

  const positionOptions = useMemo(() => {
    return positions.map((position) => ({
      value: position.id,
      label: position.position_name + (position.position_level ? ` (${position.position_level})` : ""),
    }));
  }, [positions]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return rows.slice(from, to);
  }, [rows, page, pageSize]);

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              กำหนดตำแหน่งตามหน่วย
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการความสัมพันธ์ระหว่างหน่วยงาน ตำแหน่ง และจำนวนอัตรา
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบข้อมูลกำหนดตำแหน่งตามหน่วยได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + เพิ่มข้อมูล
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหาหน่วย / ฝ่าย / แผนก / ตำแหน่ง"
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
                <th className="px-6 py-4 text-left font-semibold">หน่วยงาน</th>
                <th className="px-6 py-4 text-left font-semibold">ฝ่าย</th>
                <th className="px-6 py-4 text-left font-semibold">แผนก</th>
                <th className="px-6 py-4 text-left font-semibold">ตำแหน่ง</th>
                <th className="px-6 py-4 text-left font-semibold">ระดับ</th>
                <th className="px-6 py-4 text-left font-semibold">จำนวนอัตรา</th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4"><div className="h-4 w-10 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-36 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, index) => (
                  <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {row.unit_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {row.division_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {row.department_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {row.position_name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {row.position_level || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {row.headcount_target}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {row.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(row)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              disabled={deletingId === row.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === row.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === row.id ? "Deleting..." : "Delete"}
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
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                    ไม่พบข้อมูลกำหนดตำแหน่งตามหน่วย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Partition */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              ทั้งหมด {rows.length} รายการ
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
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRow ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  หน่วยงาน
                </label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกหน่วยงาน"
                  value={form.unit_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, unit_id: value ?? "" }))
                  }
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={unitOptions}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ตำแหน่ง
                </label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกตำแหน่ง"
                  value={form.position_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, position_id: value ?? "" }))
                  }
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={positionOptions}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  จำนวนอัตรา
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.headcount_target}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      headcount_target: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
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

              {((editingRow && canEdit) || (!editingRow && canCreate)) && (
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
                  {saving ? "Saving..." : editingRow ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
