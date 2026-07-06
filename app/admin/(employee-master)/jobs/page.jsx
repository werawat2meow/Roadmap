"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm } from "../../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";

const initialForm = {
  job_code: "",
  job_name: "",
  job_level: "",
  management_level: "",
  scope_type: "",
  can_approve_budget: false,
  can_manage_employees: false,
  job_color: "#E2E8F0",
  job_icon: "",
  job_description: "",
  status: "active",
  sort_order: 0,
};

export default function JobsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.jobs.view");
  const canCreate = hasPermission(user, "ems.jobs.create");
  const canEdit = hasPermission(user, "ems.jobs.edit");
  const canDelete = hasPermission(user, "ems.jobs.delete");

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(initialForm);

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

  const loadJobs = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/jobs?search=${encodeURIComponent(keyword)}`
        : "/api/admin/jobs";

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลด Job ไม่สำเร็จ");
      }

      setJobs(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingJob(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setForm({
        job_code: job.job_code || "",
        job_name: job.job_name || "",
        job_level: job.job_level || "",
        management_level: job.management_level || "",
        scope_type: job.scope_type || "",
        can_approve_budget: !!job.can_approve_budget,
        can_manage_employees: !!job.can_manage_employees,
        job_color: job.job_color || "#E2E8F0",
        job_icon: job.job_icon || "",
        job_description: job.job_description || "",
        status: job.status || "active",
        sort_order: job.sort_order || 0,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingJob;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Job");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Job");
      return;
    }

    if (!form.job_code.trim()) {
      swalError("กรุณากรอกรหัส Job");
      return;
    }

    if (!form.job_name.trim()) {
      swalError("กรุณากรอกชื่อ Job");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/jobs/${editingJob.id}`
        : "/api/admin/jobs";

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
        throw new Error(data?.error || "บันทึก Job ไม่สำเร็จ");
      }

      swalSuccess(isEdit ? "แก้ไข Job สำเร็จ" : "เพิ่ม Job สำเร็จ");
      handleCloseModal();
      await loadJobs(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (job) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Job");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบ Job "${job.job_code} - ${job.job_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(job.id);

      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "ลบ Job ไม่สำเร็จ");
      }

      swalSuccess("ลบ Job สำเร็จ");
      await loadJobs(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeletingId("");
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Job Management
          </h1>

          <p className="text-slate-500">
            จัดการตำแหน่งผู้บริหาร / Business Job Structure
          </p>
        </div>
        <div className="flex gap-3">
          <input
            className="rounded-xl border border-slate-300 px-4 py-2"
            placeholder="ค้นหา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
            >
              + New Job
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingOrb />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Job</th>
                <th className="p-3 text-left">Level</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="p-3 font-semibold">
                    {job.job_code}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">
                      {job.job_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {job.job_description}
                    </div>
                  </td>
                  <td className="p-3">
                    {job.job_level || "-"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        job.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="rounded-lg border px-3 py-1 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          disabled={deletingId === job.id}
                          onClick={() => handleDelete(job)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingJob ? "Edit Job" : "New Job"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Job Code *
                </label>
                <input
                  value={form.job_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      job_code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Job Name *
                </label>
                <input
                  value={form.job_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, job_name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Job Level
                </label>
                <input
                  value={form.job_level}
                  placeholder="Executive / Management / Operation"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, job_level: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Management Level
                </label>
                <select
                  value={form.management_level}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, management_level: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">เลือก Level</option>
                  <option value="P9">P9</option>
                  <option value="P10">P10</option>
                  <option value="P11">P11</option>
                  <option value="P12">P12</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Scope Type
                </label>
                <select
                  value={form.scope_type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, scope_type: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">เลือก Scope</option>
                  <option value="all">All</option>
                  <option value="company">Company</option>
                  <option value="branch_group">Branch Group</option>
                  <option value="branch">Branch</option>
                  <option value="department">Department</option>
                  <option value="division">Division</option>
                  <option value="unit">Unit</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สี Job
                </label>
                <input
                  type="color"
                  value={form.job_color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, job_color: e.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Icon
                </label>
                <input
                  type="text"
                  value={form.job_icon}
                  placeholder="เช่น 👑 👔 🏢"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, job_icon: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={form.can_manage_employees}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      can_manage_employees: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm font-medium text-slate-700">
                  Can Manage Employees
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={form.can_approve_budget}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      can_approve_budget: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm font-medium text-slate-700">
                  Can Approve Budget
                </span>
              </label>

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
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.job_description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      job_description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400"
              >
                {saving ? "Saving..." : editingJob ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}