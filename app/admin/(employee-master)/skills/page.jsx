"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import { swalConfirm, swalError, swalSuccess } from "../../../components/Swal";
import { Spin } from "antd";

const initialForm = {
  skill_code: "",
  skill_name: "",
  skill_category: "",
  status: "active",
  sort_order: 0,
};

export default function SkillsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  // #region Permission ครับบบ
  const canView = hasPermission(user, "ems.skills.view");
  const canCreate = hasPermission(user, "ems.skills.create");
  const canEdit = hasPermission(user, "ems.skills.edit");
  const canDelete = hasPermission(user, "ems.skills.delete");
  // #endregion
  
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [loadingUser, user, canView, router]);

  const loadSkills = async (keyword = search, currentPage = page) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));

      if (keyword) params.set("search", keyword);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/skills?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลดข้อมูล Skill ไม่สำเร็จ");
      }

      setSkills(data.data || []);
      setPage(data.pagination?.page || 1);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("LOAD_SKILLS_ERROR:", error);
      swalError(error.message || "โหลดข้อมูล Skill ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;

    const timer = setTimeout(() => {
      loadSkills(search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, canView]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingSkill(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (skill) => {
    setEditingSkill(skill);
    setForm({
      skill_code: skill.skill_code || "",
      skill_name: skill.skill_name || "",
      skill_category: skill.skill_category || "",
      status: skill.status || "active",
      sort_order: skill.sort_order || 0,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    if (!form.skill_code.trim()) {
      swalError("กรุณากรอกรหัส Skill");
      return;
    }

    if (!form.skill_name.trim()) {
      swalError("กรุณากรอกชื่อ Skill");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingSkill;
      const url = isEdit
        ? `/api/admin/skills/${editingSkill.id}`
        : "/api/admin/skills";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "บันทึก Skill ไม่สำเร็จ");
      }

      swalSuccess(isEdit ? "อัพเดท Skill สำเร็จ" : "เพิ่ม Skill สำเร็จ");
      handleCloseModal();
      await loadSkills(search, isEdit ? page : 1);
    } catch (error) {
      console.error("SAVE_SKILL_ERROR:", error);
      swalError(error.message || "บันทึก Skill ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    const result = await swalConfirm(
      "ยืนยันการลบ?",
      `ต้องการลบ Skill "${skill.skill_name}" ใช่หรือไม่`
    );

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "ลบ Skill ไม่สำเร็จ");
      }

      swalSuccess("ลบ Skill สำเร็จ");
      await loadSkills(search, page);
    } catch (error) {
      console.error("DELETE_SKILL_ERROR:", error);
      swalError(error.message || "ลบ Skill ไม่สำเร็จ");
    }
  };
  

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              ทักษะ / Skills
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการ Skill Master สำหรับตำแหน่งและพนักงาน
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่ม Skill
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
          <input
            type="text"
            placeholder="ค้นหา: รหัส Skill / ชื่อ Skill / หมวดหมู่"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Skill Name</th>
                <th className="px-5 py-4 font-bold text-slate-700">Category</th>
                <th className="px-5 py-4">Sort</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Spin size="large" description="กำลังโหลดข้อมูล...">
                      <div style={{ minHeight: 160 }} />
                    </Spin>
                  </td>
                </tr>
              ) : skills.length > 0 ? (
                skills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {skill.skill_code}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {skill.skill_name}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {skill.skill_category || "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {skill.sort_order ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          skill.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {skill.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(skill)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(skill)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบข้อมูล Skill
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">ทั้งหมด {total} รายการ</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadSkills(search, page - 1)}
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
              onClick={() => loadSkills(search, page + 1)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingSkill ? "แก้ไข Skill" : "เพิ่ม Skill"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skill Code
                </label>
                <input
                  value={form.skill_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      skill_code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skill Name
                </label>
                <input
                  value={form.skill_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      skill_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Category
                </label>
                <input
                  value={form.skill_category}
                  placeholder="เช่น Language, IT, Safety"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      skill_category: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  แนะนำใช้หมวดหมู่เดิมที่มีอยู่แล้ว เช่น <b>Safety</b>, <b>Operation</b>,{" "}
                  <b>Language</b>, <b>Guest Service</b>, <b>IT</b>, <b>Management</b>{" "}
                  เพื่อไม่ให้ข้อมูลซ้ำซ้อนหรือสะกดต่างกัน
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sort_order: Number(e.target.value || 0),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
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
                {saving ? "Saving..." : editingSkill ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
