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
  group: "",
  level: "",
  status: "active",
};

const positionLevelOptions = [
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
  "P11",
  "P12",
];

export default function PositionsPage() {
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [showGradeRef, setShowGradeRef] = useState(false);

  // Partition
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "positions.view");
  const canCreate = hasPermission(user, "positions.create");
  const canEdit = hasPermission(user, "positions.edit");
  const canDelete = hasPermission(user, "positions.delete");

  
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

  const loadPositions = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/positions?search=${encodeURIComponent(keyword)}`
        : "/api/admin/positions";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load positions failed");
      }

      const mapped = (data.data || []).map((position) => ({
        id: position.id,
        code: position.position_code,
        name: position.position_name,
        group: position.position_group || "",
        level: position.position_level || "",
        status: position.status,
      }));

      setPositions(mapped);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPositions(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingPosition(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มตำแหน่ง");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (position) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขตำแหน่ง");
      return;
    }
    setEditingPosition(position);

    setForm({
      code: position.code || "",
      name: position.name || "",
      group: position.group || "",
      level: position.level || "",
      status: position.status || "active",
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingPosition;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขตำแหน่ง");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มตำแหน่ง");
      return;
    }
    
    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสตำแหน่งและชื่อตำแหน่ง");
      return;
    }

    if (!form.level || !form.group.trim()) {
      swalError("กรุณากรอกระดับตำแหน่งและเลือกระดับตำแหน่ง");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingPosition;
      const url = isEdit
        ? `/api/admin/positions/${editingPosition.id}`
        : "/api/admin/positions";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position_code: form.code.trim(),
          position_name: form.name.trim(),
          position_group: form.group.trim() || null,
          position_level: form.level.trim() || null,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedPosition = {
        id: data.data.id,
        code: data.data.position_code,
        name: data.data.position_name,
        group: data.data.position_group || "",
        level: data.data.position_level || "",
        status: data.data.status,
      };

      if (isEdit) {
        setPositions((prev) =>
          prev.map((item) =>
            item.id === savedPosition.id ? savedPosition : item
          )
        );
        swalSuccess("อัพเดทข้อมูลตำแหน่งเรียบร้อยแล้ว");
      } else {
        setPositions((prev) => [savedPosition, ...prev]);
        setPage(1);
        swalSuccess("บันทึกข้อมูลตำแหน่งเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (position) => {
     if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบตำแหน่ง");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบตำแหน่ง "${position.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(position.id);

      const res = await fetch(`/api/admin/positions/${position.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      const nextPositions = positions.filter((item) => item.id !== position.id);
      setPositions(nextPositions);

      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextPositions.length / pageSize)
      );

      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
      swalSuccess("ลบข้อมูลตำแหน่งเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const totalPages = Math.max(1, Math.ceil(positions.length / pageSize));
  const paginatedPositions = positions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const gradeTiers = [
    { codes: ["P2", "P3"], badge: "bg-teal-50 text-teal-700" },
    { codes: ["P4", "P5"], badge: "bg-violet-50 text-violet-700" },
    { codes: ["P6", "P7"], badge: "bg-blue-50 text-blue-700" },
    { codes: ["P8", "P9"], badge: "bg-amber-50 text-amber-700" },
    { codes: ["P10", "P11", "P12"], badge: "bg-orange-50 text-orange-700" },
  ];
  const getBadgeClass = (code) => gradeTiers.find((t) => t.codes.includes(code))?.badge ?? "bg-slate-100 text-slate-500";
  const grades = [
    ["P2", "Staff / Junior"],
    ["P3", "Senior Staff"],
    ["P4", "Specialist / Supervisor"],
    ["P5", "Assistant Manager"],
    ["P6", "Manager"],
    ["P7", "Senior Manager"],
    ["P8", "Assistant Director"],
    ["P9", "Director"],
    ["P10", "Senior Director / AVP"],
    ["P11", "VP / GM"],
    ["P12", "MD / President / CEO"],
  ];
  const legends = [
    { label: "Individual contributor", className: "bg-teal-50 border-teal-300" },
    { label: "Specialist / supervisor", className: "bg-violet-50 border-violet-300" },
    { label: "Management", className: "bg-blue-50 border-blue-300" },
    { label: "Director level", className: "bg-amber-50 border-amber-300" },
    { label: "Executive", className: "bg-orange-50 border-orange-300" },
  ];

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ตำแหน่ง</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลตำแหน่งงานกลางขององค์กร
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบตำแหน่งได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + เพิ่มตำแหน่ง
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสตำแหน่ง / ชื่อตำแหน่ง / ระดับ"
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
                <th className="px-6 py-4 text-left font-semibold">รหัสตำแหน่ง</th>
                <th className="px-6 py-4 text-left font-semibold">ชื่อตำแหน่ง</th>
                <th className="px-6 py-4 text-left font-semibold">กลุ่มตำแหน่ง</th>
                <th className="px-6 py-4 text-left font-semibold">ระดับ</th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-24 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-40 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3.5 w-24 animate-pulse rounded-md bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : paginatedPositions.length > 0 ? (
                paginatedPositions.map((position,index) => (
                  <tr
                    key={position.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {position.code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {position.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {position.group || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {position.level || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          position.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {position.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                   <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(position)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(position)}
                              disabled={deletingId === position.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === position.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === position.id ? "Deleting..." : "Delete"}
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
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลตำแหน่ง
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Partition */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              ทั้งหมด {positions.length} รายการ
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

            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPosition ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่ง"}
              </h2>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสตำแหน่ง
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="เช่น GRA"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อตำแหน่ง
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น Guest Relation Agent"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* ระดับตำแหน่ง */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ระดับตำแหน่ง
                </label>
                <input
                  type="text"
                  value={form.group}
                  onChange={(e) => setForm((prev) => ({ ...prev, group: e.target.value }))}
                  placeholder="เช่น Junior / Senior / Supervisor / Manager"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
                <select
                  value={form.level}
                  onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกระดับตำแหน่ง</option>
                  {positionLevelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                {/* Grade reference - collapsible */}
                <button
                  type="button"
                  onClick={() => setShowGradeRef((v) => !v)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  <span>{showGradeRef ? "▲" : "▼"}</span>
                  <span>ดูตัวอย่าง Position grade reference</span>
                </button>

                {showGradeRef && (
                  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Position grade reference
                      </span>
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                        ตัวอย่าง
                      </span>
                    </div>

                    <div
                      className="grid gap-1.5"
                      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                    >
                      {grades.map(([code, label]) => (
                        <div
                          key={code}
                          className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5"
                        >
                          <span
                            className={`min-w-[32px] shrink-0 rounded px-1.5 py-0.5 text-center text-[11px] font-semibold ${getBadgeClass(code)}`}
                          >
                            {code}
                          </span>
                          <span className="text-xs text-slate-500">{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
                      {legends.map(({ label, className }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-sm border ${className}`} />
                          <span className="text-[11px] text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* สถานะ */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะ
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingPosition && canEdit) || (!editingPosition && canCreate)) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving ? "Saving..." : editingPosition ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
