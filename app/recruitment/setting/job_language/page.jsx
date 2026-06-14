"use client";

import { useEffect, useMemo, useState } from "react";
import JobLanguageModal from "@/app/recruitment/components/JobLanguageModal";
import DeleteModal from "@/app/recruitment/components/DeleteModal";

export default function JobLanguagePage() {
  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedItem, setSelectedItem] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/recruitment/api/job_language", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
      setPositions(data.positions ?? []);
      setLanguages(data.languages ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => items, [items]);

  function handleAdd() {
    setFormMode("create");
    setSelectedItem(null);
    setFormOpen(true);
  }

  function handleEdit(item) {
    setFormMode("edit");
    setSelectedItem(item);
    setFormOpen(true);
  }

  function handleDelete(item) {
    setDeleteItem(item);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteItem?.id) return;

    setDeleting(true);
    try {
      const res = await fetch(`/recruitment/api/job_language/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Delete failed");
      }
      setDeleteOpen(false);
      setDeleteItem(null);
      await loadData();
    } catch (err) {
      alert(err.message || "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="h-full w-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center rounded-3xl bg-white p-6 shadow-sm">
          <div className="justify-self-center md:justify-self-start">
            <h1 className="text-2xl font-semibold">Job Language</h1>
            <p className="text-sm text-gray-600">จัดการข้อมูลภาษาของตำแหน่งงาน</p>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <button
              onClick={handleAdd}
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
                <thead className="bg-slate-50">
                  <tr className="text-center text-slate-600">
                    <th className="px-4 py-3 font-medium">No.</th>
                    <th className="px-4 py-3 font-medium">Position Name</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-6 text-slate-500 text-center ">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-6 text-slate-500 text-center ">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{item.position_name}</div>
                        <div className="text-xs text-gray-500">{item.position_level}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

            <JobLanguageModal
              open={formOpen}
              mode={formMode}
              item={selectedItem}
              positions={positions}
              languages={languages}
              onClose={() => setFormOpen(false)}
              onSaved={loadData}
            />

            <DeleteModal
              open={deleteOpen}
              item={deleteItem}
              onClose={() => setDeleteOpen(false)}
              onConfirm={confirmDelete}
              loading={deleting}
            />
        </div>
      </div>
    </div>
  );
}