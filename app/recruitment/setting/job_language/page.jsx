"use client";

import { useEffect, useMemo, useState } from "react";
import JobLanguageModal from "@/app/recruitment/components/JobLanguageModal";
import DeleteModal from "@/app/recruitment/components/DeleteModal";

import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import AntIcon from "@/components/AntIcon";

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

  const { isChecking, canView, canCreate, canEdit, canDelete } = usePageGuard({
    module: "recruitment.job.language",
    unauthorizedRedirect: "/recruitment",
  });

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
    const timeoutId = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timeoutId);
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

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <div className="min-h-full w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm"><AntIcon name="TranslationOutlined" style={{ fontSize: 20 }} /></div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Recruitment settings</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">ภาษาของตำแหน่งงาน</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">จัดการชื่อและข้อมูลตำแหน่งงานในแต่ละภาษา เพื่อให้ประกาศรับสมัครแสดงผลได้อย่างถูกต้อง</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-24 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"><p className="text-xs text-emerald-100/70">ตำแหน่ง</p><p className="mt-1 text-xl font-bold">{rows.length}</p></div>
                <div className="min-w-24 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"><p className="text-xs text-emerald-100/70">ภาษา</p><p className="mt-1 text-xl font-bold">{languages.length}</p></div>
              </div>
              {canCreate && (
                <button onClick={handleAdd} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/70">
                  <AntIcon name="PlusOutlined" /> เพิ่มข้อมูลภาษา
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><AntIcon name="GlobalOutlined" /></span>
              <div><h2 className="font-semibold text-slate-800">รายการภาษาตามตำแหน่งงาน</h2><p className="mt-1 text-sm text-slate-500">เลือกแก้ไขคำแปลของตำแหน่ง หรือเพิ่มข้อมูลสำหรับตำแหน่งใหม่</p></div>
            </div>
            <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:mt-0">{rows.length} รายการ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="w-24 px-5 py-4">ลำดับ</th>
                    <th className="px-5 py-4 text-left">ตำแหน่งงาน</th>
                    <th className="w-56 px-5 py-4">จัดการ</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-16 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />กำลังโหลดข้อมูล...</span>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-16 text-center text-slate-500">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><AntIcon name="TranslationOutlined" style={{ fontSize: 22 }} /></div>
                      ยังไม่มีข้อมูลภาษาของตำแหน่งงาน
                    </td>
                  </tr>
                ) : (
                  rows.map((item, index) => (
                    <tr key={item.id} className="transition-colors hover:bg-emerald-50/40">
                      <td className="px-5 py-4"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span></td>
                      <td className="px-5 py-4 text-left text-slate-700">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 font-bold text-emerald-700">{(item.position_name || "?").trim().charAt(0)}</span>
                          <div><div className="font-semibold text-slate-800">{item.position_name || "-"}</div><div className="mt-0.5 text-xs text-slate-500">{item.position_level || "ไม่ระบุระดับตำแหน่ง"}</div></div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 justify-center">
                          { canEdit &&(
                            <button
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <AntIcon name="EditOutlined" />
                              แก้ไข
                            </button>
                          )}
                          { canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                            >
                              <AntIcon name="DeleteOutlined" />
                              ลบ
                            </button>
                          )}
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
        </section>
      </div>
    </div>
  );
}
