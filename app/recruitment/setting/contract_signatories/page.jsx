"use client";

import { useCallback, useEffect, useState } from "react";
import { Select } from "antd";
import Swal from "sweetalert2";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const initialForm = { 
  emp_name_th: "",
  emp_name_en: "",
  position_id: null,
};

export default function ContractSignatoriesPage() {

  const { isChecking, canView, canCreate } = usePageGuard({
    module: "recruitment.contract.signatories",
    unauthorizedRedirect: "/recruitment",
  });

  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/recruitment/api/contract_signatories", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "ไม่สามารถโหลดข้อมูลได้");
      }

      setItems(result.data || []);
      setPositions(result.positions || []);
    } catch (loadError) {
      setError(loadError.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isChecking || !canView) return;

    const timeoutId = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [canView, isChecking, loadData]);

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  const openCreateModal = () => {
    setSelectedItem(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setForm({
      emp_name_th: item.emp_name_th || "",
      emp_name_en: item.emp_name_en || "",
      position_id: item.position_id ?? null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedItem(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const empNameTh = form.emp_name_th?.trim();
    const empNameEn = form.emp_name_en?.trim();

    if (!empNameTh || !empNameEn || form.position_id === null) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: "กรุณากรอกชื่อทั้งภาษาไทยและภาษาอังกฤษ และเลือกตำแหน่ง",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(selectedItem?.id);
      const url = isEditing
        ? `/recruitment/api/contract_signatories/${selectedItem.id}`
        : "/recruitment/api/contract_signatories";
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_name_th: empNameTh,
          emp_name_en: empNameEn,
          position_id: form.position_id,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "ไม่สามารถบันทึกข้อมูลได้");
      }

      setModalOpen(false);
      setSelectedItem(null);
      setForm(initialForm);
      await loadData();
      await Swal.fire({
        icon: "success",
        title: isEditing ? "แก้ไขข้อมูลเรียบร้อยแล้ว" : "เพิ่มข้อมูลเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: "บันทึกข้อมูลไม่สำเร็จ",
        text: saveError.message || "ไม่สามารถบันทึกข้อมูลได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = !Boolean(item.status);
    setBusyId(item.id);
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, status: nextStatus } : row
      )
    );

    try {
      const response = await fetch(
        `/recruitment/api/contract_signatories/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "ไม่สามารถอัปเดตสถานะได้");
      }

      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, ...result.data } : row
        )
      );
      await Swal.fire({
        icon: "success",
        title: "อัปเดตสถานะเรียบร้อยแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (statusError) {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: item.status } : row
        )
      );
      await Swal.fire({
        icon: "error",
        title: "อัปเดตสถานะไม่สำเร็จ",
        text: statusError.message || "ไม่สามารถอัปเดตสถานะได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-full w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0M16.5 10.5l1.5 1.5 3-3" /></svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Recruitment settings</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">ผู้ลงนามในสัญญา</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">จัดการรายชื่อ ตำแหน่ง และสถานะของผู้มีสิทธิ์ลงนามในสัญญาจ้าง</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-24 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"><p className="text-xs text-emerald-100/70">ทั้งหมด</p><p className="mt-1 text-xl font-bold">{items.length}</p></div>
                <div className="min-w-24 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"><p className="text-xs text-emerald-100/70">ใช้งาน</p><p className="mt-1 text-xl font-bold">{items.filter((item) => Boolean(item.status)).length}</p></div>
              </div>
              <button type="button" onClick={openCreateModal} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/70">
                <span className="text-lg leading-none">+</span> เพิ่มผู้ลงนาม
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h2 className="font-semibold text-slate-800">รายชื่อผู้ลงนาม</h2><p className="mt-1 text-sm text-slate-500">เปิดหรือปิดสถานะ และแก้ไขรายละเอียดได้จากตารางด้านล่าง</p></div>
            <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:mt-0">{items.length} รายการ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="w-20 px-5 py-4">ลำดับ</th>
                  <th className="px-5 py-4 text-left">ชื่อ-นามสกุล</th>
                  <th className="px-5 py-4 text-left">ตำแหน่ง</th>
                  <th className="w-40 px-5 py-4">สถานะ</th>
                  <th className="w-32 px-5 py-4">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />กำลังโหลดข้อมูล...</span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center text-red-600">
                      <p>{error}</p>
                      <button
                        type="button"
                        onClick={loadData}
                        className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 font-medium hover:bg-red-50"
                      >
                        ลองอีกครั้ง
                      </button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-slate-500">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" /></svg></div>
                      ยังไม่มีข้อมูลผู้ลงนาม
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="transition-colors hover:bg-emerald-50/40">
                      <td className="px-5 py-4 text-center"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span></td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 sm:inline-flex">{(item.emp_name_th || item.emp_name_en || "?").trim().charAt(0)}</span>
                          <div><div>{item.emp_name_th || "-"}</div><div className="mt-0.5 text-xs font-normal text-slate-500">{item.emp_name_en || "-"}</div></div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.position_name || "-"}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <label className="inline-flex cursor-pointer items-center gap-2.5">
                          <span className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={Boolean(item.status)}
                              disabled={busyId === item.id}
                              onChange={() => handleToggleStatus(item)}
                              aria-label={`เปลี่ยนสถานะ ${item.emp_name_th || item.emp_name_en}`}
                            />
                            <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-100 peer-disabled:opacity-50" />
                            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                          </span>
                          <span className={`text-xs font-medium ${Boolean(item.status) ? "text-emerald-700" : "text-slate-400"}`}>{Boolean(item.status) ? "ใช้งาน" : "ปิดใช้งาน"}</span>
                        </label>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 3.487 1.65-1.65a1.875 1.875 0 1 1 2.651 2.651L10.582 15.07a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 3.487Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 14.25V19.5A1.5 1.5 0 0 1 16.5 21h-12A1.5 1.5 0 0 1 3 19.5v-12A1.5 1.5 0 0 1 4.5 6H9.75" /></svg>
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contract-signatory-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-5">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" /></svg></span>
                <div><h2 id="contract-signatory-modal-title" className="text-lg font-bold text-slate-900">{selectedItem ? "แก้ไขผู้ลงนามในสัญญา" : "เพิ่มผู้ลงนามในสัญญา"}</h2><p className="mt-1 text-sm text-slate-500">กรอกข้อมูลผู้มีสิทธิ์ลงนามให้ครบถ้วน</p></div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-2.5 py-1.5 text-2xl leading-none text-slate-400 transition hover:bg-white hover:text-slate-700 hover:shadow-sm"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label htmlFor="emp_name_th" className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อ-นามสกุล ( TH ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="emp_name_th"
                  name="emp_name_th"
                  type="text"
                  value={form.emp_name_th}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      emp_name_th: event.target.value,
                    }))
                  }
                  placeholder="กรอกชื่อ-นามสกุล TH"
                  autoFocus
                  maxLength={255}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100/70"
                />
              </div>
              
              <div>
                <label htmlFor="emp_name_en" className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อ-นามสกุล ( EN ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="emp_name_en"
                  name="emp_name_en"
                  type="text"
                  value={form.emp_name_en}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      emp_name_en: event.target.value,
                    }))
                  }
                  placeholder="กรอกชื่อ-นามสกุล EN"
                  maxLength={255}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100/70"
                />
              </div>

              <div>
                <label htmlFor="position_id" className="mb-2 block text-sm font-medium text-slate-700">
                  ตำแหน่ง <span className="text-red-500">*</span>
                </label>
                <Select
                  id="position_id"
                  showSearch
                  allowClear
                  value={form.position_id ?? undefined}
                  placeholder="เลือกหรือค้นหาตำแหน่ง"
                  optionFilterProp="label"
                  options={positions.map((position) => ({
                    value: position.id,
                    label: position.position_name,
                  }))}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      position_id: value ?? null,
                    }))
                  }
                  notFoundContent="ไม่พบตำแหน่ง"
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
