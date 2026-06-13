"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import DeleteModal from "@/app/recruitment/components/DeleteModal";
import Pagination from "@/app/recruitment/components/Pagination";

const pageSizeOptions = [10, 20, 50, 100];

export default function LanguageTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/recruitment/api/language", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "โหลดข้อมูลไม่สำเร็จ");
      }

      setRows(json.data || []);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ คำนวณ pagination
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = (page - 1) * pageSize;
  const to = Math.min(from + pageSize, count);
  const pagedRows = rows.slice(from, to);

  // ✅ reset page เมื่อ pageSize เปลี่ยน
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const toggleStatus = async (row) => {
    try {
      setBusyId(row.id);

      const nextStatus = !Boolean(row.status);

      const res = await fetch(`/recruitment/api/language/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "อัปเดต status ไม่สำเร็จ");
      }

      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, status: json.data.status } : item
        )
      );
    } catch (err) {
      alert(err.message || "อัปเดต status ไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setBusyId(deleteTarget.id);

      const res = await fetch(
        `/recruitment/api/language/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "ลบข้อมูลไม่สำเร็จ");
      }

      setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);

      // ✅ ถ้า page ปัจจุบันว่างหลังลบ ให้ถอยกลับ 1 หน้า
      setPage((prev) => {
        const newCount = count - 1;
        const newTotalPages = Math.max(1, Math.ceil(newCount / pageSize));
        return prev > newTotalPages ? newTotalPages : prev;
      });
    } catch (err) {
      alert(err.message || "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  // ✅ ประกาศตัวแปรครบก่อนใช้ใน useMemo
  const rangeText = useMemo(() => {
    if (count === 0) return '0 รายการ';
    const start = from + 1;
    const end = Math.min(to, count);
    return `${start} - ${end} จาก ${count} รายการ`;
  }, [count, from, to]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">แสดง</span>
          <select
            value={pageSize}
            onChange={e => handlePageSizeChange(Number(e.target.value))}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
          >
            {pageSizeOptions.map(n => (
              <option key={n} value={n}>{n} rows</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">language_img</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">language_name(language_slug)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            ) : pagedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              // ✅ ใช้ pagedRows และคำนวณ No. ต่อเนื่องจาก from
              pagedRows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {from + index + 1}
                  </td>

                  <td className="px-4 py-4">
                    {row.language_img ? (
                      <button
                        type="button"
                        onClick={() => setPreview(row)}
                        className="block"
                      >
                        <img
                          src={row.language_img}
                          alt={row.language_name}
                          className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
                        />
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-800">
                    <div className="font-medium">{row.language_name}</div>
                    <div className="text-xs text-gray-500">{row.language_slug}</div>
                  </td>

                  <td className="px-4 py-4">
                    <label className="inline-flex items-center gap-3">
                      <span className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={Boolean(row.status)}
                          disabled={busyId === row.id}
                          onChange={() => toggleStatus(row)}
                        />
                        <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-green-500" />
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                      </span>
                    </label>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/recruitment/setting/language/${row.id}/edit`}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        แก้ไข
                      </Link>

                      {/* ✅ เปลี่ยนจาก deleteRow(row.id) → setDeleteTarget(row) */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        disabled={busyId === row.id}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
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

      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-600">{rangeText}</div>
        <Pagination
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      <DeleteModal
        open={!!deleteTarget}
        title="ยืนยันการลบข้อมูล"
        message="ต้องการลบข้อมูลนี้หรือไม่"
        itemName={deleteTarget?.language_name}
        loading={busyId === deleteTarget?.id}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}