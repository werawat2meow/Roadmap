"use client";

import { useEffect, useState } from "react";
import DeleteModal from "@/app/recruitment/components/DeleteModal";

const emptyForm = {
  evaluation: "",
  status: true,
};

export default function RecruitQuestionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [busyId, setBusyId] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/recruitment/api/evaluation", {
        cache: "no-store",
      });
      const json = await res.json();
      setItems(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setOpenAddModal(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      evaluation: item.evaluation ?? "",
      status: !!item.status,
    });
    setOpenEditModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/recruitment/api/evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.message || "Create failed");
        return;
      }

      setOpenAddModal(false);
      setForm(emptyForm);
      await fetchItems();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/recruitment/api/evaluation/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.message || "Update failed");
        return;
      }

      setOpenEditModal(false);
      setEditId(null);
      setForm(emptyForm);
      await fetchItems();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = !item.status;

    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, status: nextStatus } : row
      )
    );

    const res = await fetch(`/recruitment/api/evaluation/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "Update status failed");
      await fetchItems();
    }
  };

  const openDeleteModal = (item) => {
    setSelectedDelete(item);
    setDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!selectedDelete?.id) return;

    setDeleting(true);
    try {
      const res = await fetch(`/recruitment/api/evaluation/${selectedDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || "Delete failed");
      }

      setDeleteModalOpen(false);
      setSelectedDelete(null);
      await fetchItems();
    } catch (err) {
      alert(err.message || "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="w-full h-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Evaluation From
            </h1>

            <p className="mt-2 text-slate-500">
              หน้านี้เป็นหน้าจัดการ Evaluation
            </p>
          </div>
          <div>
            <button
              onClick={openCreate}
              className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
              style={{ backgroundColor: "green" }}
            >
              + เพิ่มข้อมูล
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 w-full">

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-center text-slate-600">
                  <th className="px-4 py-3 font-medium">No.</th>
                  <th className="px-4 py-3 font-medium">Evaluation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center" colSpan={4}>
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3">{item.evaluation}</td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-3">
                        <span className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={Boolean(item.status)}
                            disabled={busyId === item.id}
                            onChange={() => handleToggleStatus(item)}
                          />
                          <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-green-500" />
                          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                        </span>
                      </label>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-md bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            disabled={deletingId === item.id}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {deletingId === item.id ? "Deleting..." : "ลบ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DeleteModal
          open={deleteModalOpen}
          item={selectedDelete}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedDelete(null);
          }}
          onConfirm={confirmDelete}
          loading={deleting}
        />

        {/* Add Modal */}
        {openAddModal && (
          <Modal title="เพิ่มข้อมูล Evaluation" onClose={() => setOpenAddModal(false)}>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Evaluation</label>
                <textarea
                  value={form.evaluation}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, evaluation: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="กรอก question"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenAddModal(false)}
                  className="rounded-lg border px-4 py-2"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "บันทึก"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Modal */}
        {openEditModal && (
          <Modal title="แก้ไข Evaluation" onClose={() => setOpenEditModal(false)}>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Evaluation</label>
                <textarea
                  value={form.evaluation}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, evaluation: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="กรอก evaluation"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenEditModal(false)}
                  className="rounded-lg border px-4 py-2"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "อัปเดต"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}