"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

const initialForm = { emp_name: "" };

export default function ContractSignatoriesPage() {
  const [items, setItems] = useState([]);
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
    } catch (loadError) {
      setError(loadError.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const openCreateModal = () => {
    setSelectedItem(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setForm({ emp_name: item.emp_name || "" });
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
    const empName = form.emp_name.trim();

    if (!empName) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อ-นามสกุล",
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
        body: JSON.stringify({ emp_name: empName }),
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
        current.map((row) => (row.id === item.id ? result.data : row))
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
    <div className="h-full w-full">
      <div className="w-full overflow-y-auto p-6">
        <div className="grid grid-cols-1 items-center gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2">
          <div className="justify-self-center md:justify-self-start">
            <h1 className="text-2xl font-bold text-slate-800">Contract Signatories</h1>
            <p className="mt-2 text-slate-500">จัดการผู้มีสิทธิ์ลงนามในสัญญาจ้าง</p>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <button
              type="button"
              onClick={openCreateModal}
              className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-green-700"
            >
              + เพิ่มข้อมูล
            </button>
          </div>
        </div>
      </div>

      <div className="w-full p-4 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-center text-slate-600">
                  <th className="w-24 px-4 py-3 font-medium">ลำดับ</th>
                  <th className="px-4 py-3 text-left font-medium">ชื่อ-นามสกุล</th>
                  <th className="w-36 px-4 py-3 font-medium">สถานะ</th>
                  <th className="w-36 px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-red-600">
                      <p>{error}</p>
                      <button
                        type="button"
                        onClick={loadData}
                        className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 hover:bg-red-50"
                      >
                        ลองอีกครั้ง
                      </button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 text-center text-slate-700">{index + 1}</td>
                      <td className="px-4 py-4 font-medium text-slate-800">{item.emp_name}</td>
                      <td className="px-4 py-4 text-center">
                        <label className="inline-flex cursor-pointer items-center">
                          <span className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={Boolean(item.status)}
                              disabled={busyId === item.id}
                              onChange={() => handleToggleStatus(item)}
                              aria-label={`เปลี่ยนสถานะ ${item.emp_name}`}
                            />
                            <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-green-500 peer-disabled:opacity-50" />
                            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg border border-amber-300 px-3 py-1.5 text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contract-signatory-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="contract-signatory-modal-title" className="text-xl font-semibold text-slate-800">
                {selectedItem ? "แก้ไขผู้ลงนามในสัญญา" : "เพิ่มผู้ลงนามในสัญญา"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="emp_name" className="mb-2 block text-sm font-medium text-slate-700">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                id="emp_name"
                name="emp_name"
                type="text"
                value={form.emp_name}
                onChange={(event) => setForm({ emp_name: event.target.value })}
                placeholder="กรอกชื่อ-นามสกุล"
                autoFocus
                maxLength={255}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
