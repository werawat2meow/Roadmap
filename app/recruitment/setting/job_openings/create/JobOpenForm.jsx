"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================
// Helpers
// ============================================================
function rowKey(unitId, branchId) {
  return `${unitId}-${branchId}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function apiGet(url) {
  const res = await fetch(url, { method: "GET" });
  return res.json();
}

// ============================================================
// Component
// ============================================================
export default function JobOpenForm({ editId }) {
  const isEditMode = Boolean(editId);

   const router = useRouter();

  // ---------- position combobox state (create mode) ----------
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const boxRef = useRef(null);

  // ---------- company / quantity state ----------
  const [companyRows, setCompanyRows] = useState([]);
  const [maxOpening, setMaxOpening] = useState(0);
  const [headcountTarget, setHeadcountTarget] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [quantities, setQuantities] = useState({});
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // ---------- form state ----------
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [urgent, setUrgent] = useState(false);
  const [urgentMap, setUrgentMap] = useState({});
  const [status, setStatus] = useState(true); // ใช้เฉพาะโหมดแก้ไข

  // ---------- edit mode: record ที่กำลังแก้ ----------
  const [editRecord, setEditRecord] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode);

  // ---------- submit state ----------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // ============================================================
  // โหมดแก้ไข: โหลดข้อมูล record เดิม + ตำแหน่ง + บริษัทที่เกี่ยวข้อง (เพื่อแสดงชื่อ)
  // ============================================================
  useEffect(() => {
    if (!editId) return;

    (async () => {
      setIsLoadingRecord(true);
      setMessage(null);
      try {
        const recordRes = await apiGet(`/recruitment/api/job_openings/v2/${editId}`);
        if (!recordRes.success || !recordRes.data) {
          setMessage({ type: "error", text: recordRes.message || "ไม่พบข้อมูลที่ต้องการแก้ไข" });
          return;
        }
        const record = recordRes.data;
        setEditRecord(record);
        setStartDate(record.start_date?.slice(0, 10) ?? "");
        setEndDate(record.end_date?.slice(0, 10) ?? "");
        setUrgentMap({
            [rowKey(record.unit_id, record.branch_id)]: Boolean(record.urgent),
        });
        setStatus(Boolean(record.status));

        const [positionRes, companiesRes] = await Promise.all([
          apiGet(`/recruitment/api/job_openings/v2/positions/${record.position_id}`),
          apiGet(`/recruitment/api/job_openings/v2/positions/${record.position_id}/companies`),
        ]);

        if (positionRes.success && positionRes.data) {
          setSelectedPosition(positionRes.data);
          setQuery(positionRes.data.position_name);
        }

        if (companiesRes.success && companiesRes.data) {
          const matched = companiesRes.data.rows.filter(
            (r) => r.branch_id === record.branch_id && r.unit_id === record.unit_id
          );
          // แสดงเฉพาะแถวของบริษัทที่ผูกกับ record นี้ (แก้ได้ทีละรายการ)
          setCompanyRows(
            matched.length > 0
              ? matched
              : [
                  {
                    branch_id: record.branch_id,
                    branch_name: `#${record.branch_id}`,
                    department_id: record.department_id,
                    department_name: `#${record.department_id}`,
                    division_id: record.division_id,
                    division_name: `#${record.division_id}`,
                    unit_id: record.unit_id,
                    unit_name: `#${record.unit_id}`,
                  },
                ]
          );
          setHeadcountTarget(companiesRes.data.headcountTarget);
          setEmployeeCount(companiesRes.data.employeeCount);
          // จำนวนที่แก้ไขได้ = โควตาที่เหลือ + จำนวนเดิมของ record นี้ (เอาคืนมาให้แก้ไขได้)
          setMaxOpening(companiesRes.data.maxOpening + record.opening_count);
        }

        setQuantities({
          [rowKey(record.unit_id, record.branch_id)]: record.opening_count,
        });
      } catch (err) {
        setMessage({ type: "error", text: "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่" });
      } finally {
        setIsLoadingRecord(false);
      }
    })();
  }, [editId]);

  // ============================================================
  // โหมดสร้างใหม่: ค้นหาตำแหน่ง (debounce)
  // ============================================================
  useEffect(() => {
    if (isEditMode) return;
    if (selectedPosition) return;

    const handle = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiGet(`/recruitment/api/job_openings/v2/positions?q=${encodeURIComponent(query)}`);
        setOptions(res.success && res.data ? res.data : []);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selectedPosition, isEditMode]);

  // ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSelectPosition(pos) {
    setSelectedPosition(pos);
    setQuery(pos.position_name);
    setIsOpen(false);
    setMessage(null);
    setQuantities({});
    setIsLoadingCompanies(true);
    try {
      const res = await apiGet(`/recruitment/api/job_openings/v2/positions/${pos.id}/companies`);
      
      if (res.success && res.data) {
        setCompanyRows(res.data.rows);
        setMaxOpening(res.data.maxOpening);
        setHeadcountTarget(res.data.headcountTarget);
        setEmployeeCount(res.data.employeeCount);
      } else {
        setMessage({ type: "error", text: res.message || "โหลดข้อมูลบริษัทไม่สำเร็จ" });
      }
    } finally {
      setIsLoadingCompanies(false);
    }
  }

  function clearPosition() {
    setSelectedPosition(null);
    setQuery("");
    setOptions([]);
    setCompanyRows([]);
    setQuantities({});
    setMaxOpening(0);
  }

  const totalRequested = useMemo(
    () => Object.values(quantities).reduce((sum, n) => sum + (n || 0), 0),
    [quantities]
  );
  const remaining = maxOpening - totalRequested;

  function handleQuantityChange(row, value) {
    const key = rowKey(row.unit_id, row.branch_id);
    const clamped = Math.max(0, Math.min(value, maxOpening));
    setQuantities((prev) => ({ ...prev, [key]: clamped }));
  }

  // ============================================================
  // Submit
  // ============================================================
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!selectedPosition) {
      setMessage({ type: "error", text: "กรุณาเลือกตำแหน่งงาน" });
      return;
    }
    if (totalRequested <= 0) {
      setMessage({ type: "error", text: "กรุณาระบุจำนวนที่ต้องการเปิดรับอย่างน้อย 1 บริษัท" });
      return;
    }
    if (totalRequested > maxOpening) {
      setMessage({
        type: "error",
        text: `จำนวนรวมเกินโควตาที่เปิดรับได้ (สูงสุด ${maxOpening} อัตรา)`,
      });
      return;
    }
    if (!startDate || !endDate) {
      setMessage({ type: "error", text: "กรุณาเลือกวันที่เริ่มเปิดรับและวันที่ปิดรับ" });
      return;
    }
    if (endDate < startDate) {
      setMessage({ type: "error", text: "วันที่ปิดรับต้องไม่ก่อนวันที่เริ่มเปิดรับ" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editRecord) {
        // ---------- แก้ไข record เดียว ----------
        const key = rowKey(editRecord.unit_id, editRecord.branch_id);
        const res = await fetch(`/recruitment/api/job_openings/v2/${editRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opening_count: quantities[key] || 0,
            start_date: startDate,
            end_date: endDate,
            urgent: urgentMap[key] ?? false,
            status,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: "success", text: json.message || "แก้ไขข้อมูลเรียบร้อย" });
        } else {
          setMessage({ type: "error", text: json.message || "แก้ไขข้อมูลไม่สำเร็จ" });
        }
      } else {
        // ---------- สร้างใหม่: 1 คำขอ POST ต่อ 1 บริษัทที่กรอกจำนวน > 0 ----------
        const itemsToSave = companyRows
          .map((row) => ({
            row,
            count: quantities[rowKey(row.unit_id, row.branch_id)] || 0,
          }))
          .filter((i) => i.count > 0);
        
        const results = await Promise.all(
          itemsToSave.map(({ row, count }) => {
            const key = rowKey(row.unit_id, row.branch_id);
            return fetch("/recruitment/api/job_openings/v2", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    branch_id: row.branch_id,
                    department_id: row.department_id,
                    division_id: row.division_id,
                    unit_id: row.unit_id,
                    position_id: selectedPosition.id,
                    opening_count: count,
                    start_date: startDate,
                    end_date: endDate,
                    urgent: urgentMap[key] ?? false,
                }),
            }).then((r) => r.json());
          })
        );

        const failed = results.filter((r) => !r.success);
        if (failed.length === 0) {
          setMessage({ type: "success", text: `บันทึกสำเร็จ (${results.length} รายการ)` });
          clearPosition();
          setStartDate("");
          setEndDate("");
          setUrgentMap({});

          router.push("/recruitment/setting/job_openings");
        } else {
          setMessage({
            type: "error",
            text: `บันทึกสำเร็จ ${results.length - failed.length} รายการ, ล้มเหลว ${
              failed.length
            } รายการ: ${failed[0]?.message ?? ""}`,
          });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingRecord) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {isEditMode && (
        <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          <span>กำลังแก้ไขรายการ #{editRecord?.id}</span>
          <Link href="/recruit/job-open" className="font-medium underline">
            สร้างรายการใหม่แทน
          </Link>
        </div>
      )}

      {/* ---------- ตำแหน่ง ---------- */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          ตำแหน่งงาน <span className="text-rose-500">*</span>
        </label>
        {isEditMode ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {selectedPosition?.position_name ?? "-"}
          </div>
        ) : (
          <div ref={boxRef} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedPosition(null);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="พิมพ์ชื่อตำแหน่งเพื่อค้นหา..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {selectedPosition && (
              <button
                type="button"
                onClick={clearPosition}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="ล้างตำแหน่งที่เลือก"
              >
                ✕
              </button>
            )}

            {isOpen && !selectedPosition && (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {isSearching && (
                  <div className="px-3 py-2 text-sm text-slate-400">กำลังค้นหา...</div>
                )}
                {!isSearching && options.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-400">ไม่พบตำแหน่งที่ตรงกัน</div>
                )}
                {!isSearching &&
                  options.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => handleSelectPosition(opt)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                    >
                      <div className="font-medium text-slate-800">{opt.position_name}</div>
                      <div className="text-xs text-slate-400">
                        {[opt.position_group].filter(Boolean).join(" · ")}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- บริษัทที่เกี่ยวข้อง ---------- */}
      {selectedPosition && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              บริษัทที่เกี่ยวข้อง <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs font-medium ${
                remaining < 0 ? "text-rose-500" : "text-slate-500"
              }`}
            >
              เปิดรับได้สูงสุด {maxOpening} อัตรา (เป้าหมาย {headcountTarget} / มีอยู่แล้ว{" "}
              {employeeCount}) — เหลือ {remaining}
            </span>
          </div>

          {isLoadingCompanies && (
            <div className="rounded-lg border border-slate-200 px-3 py-4 text-sm text-slate-400">
              กำลังโหลดรายชื่อบริษัท...
            </div>
          )}

          {!isLoadingCompanies && companyRows.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-700">
              ไม่พบบริษัทที่เกี่ยวข้องกับตำแหน่งนี้ (ตรวจสอบการผูก unit / division / department /
              branch)
            </div>
          )}

          {!isLoadingCompanies && companyRows.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr className="text-center">
                    <th className="px-3 py-2">บริษัท</th>
                    <th className="px-3 py-2">ฝ่าย/แผนก</th>
                    <th className="px-3 py-2 w-28 text-center">มีอยู่แล้ว</th>
                    <th className="px-3 py-2 w-32">จำนวนที่เปิดรับ</th>
                    <th className="px-3 py-2">การเปิดรับสมัครแบบด่วน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyRows.map((row) => {
                    const key = rowKey(row.unit_id, row.branch_id);
                    return (
                      <tr key={key}>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {row.branch_name}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {row.department_name} / {row.division_name} / {row.unit_name}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500">
                          {row.employee_count ?? 0}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            max={maxOpening}
                            value={quantities[key] ?? ""}
                            onChange={(e) =>
                              handleQuantityChange(row, Number(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          />
                        </td>
                        <td className="px-3 py-2 justify-items-center">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={urgentMap[key] ?? false}
                                onChange={(e) =>
                                    setUrgentMap((prev) => ({
                                        ...prev,
                                        [key]: e.target.checked,
                                    }))
                                }
                            />
                          </label>
                          {isEditMode && (
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={status}
                                onChange={(e) => setStatus(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              เปิดใช้งานรายการนี้
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- วันที่ ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            วันที่เริ่มเปิดรับ <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            วันที่ปิดรับ <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* ---------- ข้อความแจ้งเตือน ---------- */}
      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---------- ปุ่มบันทึก ---------- */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || remaining < 0}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "กำลังบันทึก..." : isEditMode ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
        </button>
      </div>
    </form>
  );
}