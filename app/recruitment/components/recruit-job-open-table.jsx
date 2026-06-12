'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabaseClient";

const pageSizeOptions = [10, 20, 50, 100];

function fmtDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

function badgeClass(active) {
  return active
    ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
    : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
}

export default function RecruitJobOpenTable() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);

      const pattern = `%${search.toLowerCase()}%`;

      let countQuery = supabase
        .from('v_recruit_job_open_list')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('v_recruit_job_open_list')
        .select('*')
        .order('id', { ascending: false })
        .range(from, to);

      if (search) {
        countQuery = countQuery.ilike('search_text', pattern);
        dataQuery = dataQuery.ilike('search_text', pattern);
      }

      const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

      if (!alive) return;

      if (countRes.error) {
        console.error(countRes.error);
        alert(countRes.error.message);
        setLoading(false);
        return;
      }

      if (dataRes.error) {
        console.error(dataRes.error);
        alert(dataRes.error.message);
        setLoading(false);
        return;
      }

      setCount(countRes.count ?? 0);
      setRows(dataRes.data ?? []);
      setLoading(false);
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [search, from, to, reloadKey]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    setBusyId(deleteTarget.id);

    try {
      const response = await fetch(
        `/recruitment/api/job_openings/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }
    } catch (error) {
      alert(error.message);
      setBusyId(null);
      return;
    }

    setDeleteTarget(null);
    setBusyId(null);

    const nextCount = Math.max(0, count - 1);
    const nextTotalPages = Math.max(1, Math.ceil(nextCount / pageSize));

    if (page > nextTotalPages) {
      setPage(nextTotalPages);
    }

    setReloadKey((k) => k + 1);
  }

  const rangeText = useMemo(() => {
    if (count === 0) return '0 รายการ';

    const start = from + 1;
    const end = Math.min(to + 1, count);

    return `${start} - ${end} จาก ${count} รายการ`;
  }, [count, from, to]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Recruit Job Open</h1>
                <p className="text-sm text-slate-500">รายการเปิดรับสมัครงาน</p>
            </div>
      
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">แสดง</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
                  >
                    {pageSizeOptions.map(n => (
                      <option key={n} value={n}>
                        {n} rows
                      </option>
                    ))}
                  </select>
                </div>
      
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="ค้นหา branch / department / position ..."
                  className="h-10 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-slate-500 md:w-80"
                />
            </div>
        </div>
      
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">No.</th>
                    <th className="px-4 py-3 font-medium">Branch</th>
                    <th className="px-4 py-3 font-medium">Departments</th>
                    <th className="px-4 py-3 font-medium">Divisions</th>
                    <th className="px-4 py-3 font-medium">Units</th>
                    <th className="px-4 py-3 font-medium">Positions</th>
                    <th className="px-4 py-3 font-medium">Opening</th>
                    <th className="px-4 py-3 font-medium">Start - End</th>
                    <th className="px-4 py-3 font-medium">Urgent</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                </tr>
                </thead>
    
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                            <td className="px-4 py-6 text-slate-500" colSpan={11}>
                                กำลังโหลดข้อมูล...
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td className="px-4 py-6 text-slate-500" colSpan={11}>
                                ไม่พบข้อมูล
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => {
                        const no = from + index + 1;
        
                        return (
                            <tr key={row.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900">{no}</td>
            
                                <td className="px-4 py-3 text-slate-700">{row.branch_name ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-700">{row.department_name ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-700">{row.division_name ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-700">{row.unit_name ?? '-'}</td>
            
                                <td className="px-4 py-3 text-slate-700">
                                    <div className="font-medium">{row.position_name ?? '-'}</div>
                                    <div className="text-xs text-slate-500">
                                    {row.position_level ?? '-'}
                                    </div>
                                </td>
            
                                <td className="px-4 py-3 text-slate-700">{row.opening_count ?? 0}</td>
            
                                <td className="px-4 py-3 text-slate-700">
                                    {fmtDate(row.start_date)} - {fmtDate(row.end_date)}
                                </td>
            
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeClass(!!row.urgent)}`}>
                                    {row.urgent ? 'ด่วน' : 'ไม่ด่วน'}
                                    </span>
                                </td>
            
                                <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => toggleStatus(row)}
                                      disabled={busyId === row.id}
                                      className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition ${
                                          row.status ? 'bg-emerald-500' : 'bg-slate-300'
                                      } ${busyId === row.id ? 'opacity-60' : ''}`}
                                      aria-label="toggle status"
                                      title={row.status ? 'เปิดอยู่' : 'ปิดอยู่'}
                                    >
                                    <span
                                        className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                        row.status ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                    </button>
                                </td>
            
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <Link
                                          href={`/recruitment/setting/job_openings/${row.id}/edit`}
                                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium cursor-pointer"
                                          style={{ backgroundColor: "#0f172b" , color: "white" }}
                                      >
                                          อัปเดต
                                      </Link>
              
                                      <button
                                          type="button"
                                          onClick={() => setDeleteTarget(row)}
                                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500"
                                      >
                                          ลบ
                                      </button>
                                    </div>
                                </td>
                            </tr>
                        );
                        })
                    )}
                </tbody>
            </table>
        </div>
    
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">{rangeText}</div>
    
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={page === 1 || loading}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                    First
                </button>
    
                <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                    Prev
                </button>
    
                <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {page} / {totalPages}
                </div>
    
                <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                Next
                </button>
    
                <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || loading}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                    Last
                </button>
            </div>
        </div>
    
        {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <h2 className="text-lg font-semibold text-slate-900">ยืนยันการลบข้อมูล</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        ต้องการลบรายการนี้หรือไม่
                        <br />
                        <span className="font-medium text-slate-900">
                            {deleteTarget.position_name ?? '-'} / {deleteTarget.branch_name ?? '-'}
                        </span>
                    </p>
        
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                        >
                            ยกเลิก
                        </button>
            
                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={busyId === deleteTarget.id}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                            ลบข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}