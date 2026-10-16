"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardEdit,
  FileText,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

interface EmployeeOption {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
}

interface ApproverOption {
  id: number;
  employeeId: string;
  employeeCode: string;
  name: string;
  email: string;
}

interface LeaveEntryFormItem {
  id: string;
  kind: string;
  startDate: string;
  endDate: string;
  session: string;
  requestedDays: number;
  note: string;
}

interface LeaveEntry {
  id: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  kind: string;
  startDate: string;
  endDate: string;
  session: string;
  requestedDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

const leaveKinds = [
  { value: "ANNUAL", label: "ลาพักร้อน" },
  { value: "SICK", label: "ลาป่วย" },
  { value: "BUSINESS", label: "ลากิจ" },
  { value: "ANNUAL_HOLIDAY", label: "วันหยุดประจำปี" },
  { value: "BIRTHDAY", label: "ลาวันเกิด" },
  { value: "ORDAIN", label: "ลาบวช" },
  { value: "MATERNITY", label: "ลาคลอด" },
  { value: "UNPAID", label: "ลาไม่รับค่าจ้าง" },
];

const sessions = [
  { value: "FULL", label: "เต็มวัน" },
  { value: "AM", label: "ครึ่งเช้า" },
  { value: "PM", label: "ครึ่งบ่าย" },
];

const createEmptyItem = (): LeaveEntryFormItem => ({
  id: crypto.randomUUID(),
  kind: "ANNUAL",
  startDate: "",
  endDate: "",
  session: "FULL",
  requestedDays: 1,
  note: "",
});

export default function LeaveApprovalsPage() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [entries, setEntries] = useState<LeaveEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [approverId, setApproverId] = useState("");

  const [items, setItems] = useState<LeaveEntryFormItem[]>([
    createEmptyItem(),
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const selectedEmployee = employees.find((emp) => emp.id === employeeId);

  const filteredEmployees = useMemo(() => {
    const keyword = employeeSearch.toLowerCase();

    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(keyword) ||
        emp.employeeCode.toLowerCase().includes(keyword),
    );
  }, [employees, employeeSearch]);

  const totalPages = Math.ceil(entries.length / itemsPerPage);

  const currentEntries = entries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const [employeeRes, entryRes] = await Promise.all([
        fetch("/leave/api/approvals", { cache: "no-store" }),
        fetch("/leave/api/hr-leave-entry", { cache: "no-store" }),
      ]);

      const employeeJson = await employeeRes.json();
      const entryJson = await entryRes.json();

      if (!employeeRes.ok || !employeeJson.success) {
        throw new Error(employeeJson.error || "โหลดข้อมูลพนักงานไม่สำเร็จ");
      }

      if (!entryRes.ok || !entryJson.success) {
        throw new Error(entryJson.error || "โหลดประวัติการลาไม่สำเร็จ");
      }

      setEmployees(
        (employeeJson.data || []).map((emp: any) => ({
          id: emp.id,
          employeeCode: emp.employeeCode,
          name: emp.name,
          department: emp.dept,
        })),
      );

      setEntries(entryJson.data || []);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("Load leave entry page failed:", error);
      alert(error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const loadApprovers = async (selectedEmployeeId: string) => {
    try {
      setApprovers([]);
      setApproverId("");

      if (!selectedEmployeeId) return;

      const res = await fetch(
        `/leave/api/employees/${selectedEmployeeId}/approvers`,
        { cache: "no-store" },
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "โหลดข้อมูลผู้อนุมัติไม่สำเร็จ");
      }

      const nextApprovers = json.data || [];

      setApprovers(nextApprovers);

      if (nextApprovers[0]?.id) {
        setApproverId(String(nextApprovers[0].id));
      }
    } catch (error: any) {
      console.error("Load approvers failed:", error);
      alert(error.message || "โหลดข้อมูลผู้อนุมัติไม่สำเร็จ");
    }
  };

  useEffect(() => {
    let mounted = true;

    async function run() {
      await loadData();
      if (!mounted) return;
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const updateItem = (
    id: string,
    field: keyof LeaveEntryFormItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id),
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const res = await fetch("/leave/api/hr-leave-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          approverId: approverId ? Number(approverId) : null,
          items: items.map(({ id, ...item }) => item),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกวันลาไม่สำเร็จ");
      }

      alert("บันทึกวันลาสำเร็จ");

      setEmployeeId("");
      setEmployeeSearch("");
      setApproverId("");
      setApprovers([]);
      setItems([createEmptyItem()]);

      await loadData();
    } catch (error: any) {
      console.error("Create leave entry failed:", error);
      alert(error.message || "บันทึกวันลาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full p-8 space-y-6 min-h-screen bg-slate-50/30">
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardEdit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              บันทึกวันลา
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ใช้สำหรับ HR บันทึกวันลาจากเอกสารกระดาษหรือบันทึกย้อนหลังแทนพนักงาน
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(720px,1fr)_480px] gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-6">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              เพิ่มรายการลา
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              เลือกพนักงาน 1 คน แล้วเพิ่มรายการลาได้หลายรายการก่อนบันทึก
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                ค้นหาพนักงาน
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>

              <select
                value={employeeId}
                onChange={async (e) => {
                  const nextEmployeeId = e.target.value;
                  setEmployeeId(nextEmployeeId);
                  await loadApprovers(nextEmployeeId);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
              >
                <option value="">เลือกพนักงาน</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>

              {selectedEmployee && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  <p className="font-bold">{selectedEmployee.name}</p>
                  <p className="text-xs">{selectedEmployee.department}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">
                ผู้อนุมัติ
              </label>

              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
              >
                <option value="">ไม่ระบุผู้อนุมัติ</option>
                {approvers.map((approver) => (
                  <option key={approver.id} value={approver.id}>
                    {approver.employeeCode} - {approver.name}
                  </option>
                ))}
              </select>

              {employeeId && approvers.length === 0 && (
                <p className="text-xs text-amber-600">
                  พนักงานคนนี้ยังไม่ได้ตั้งค่าผู้อนุมัติ ระบบจะบันทึกโดยไม่ระบุผู้อนุมัติ
                </p>
              )}

              {approverId && (
                <p className="text-xs text-slate-400">
                  ระบบจะบันทึกผู้อนุมัตินี้ไว้กับทุกรายการลาในชุดนี้
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">รายการลา</h3>

              <button
                type="button"
                onClick={addItem}
                className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50"
              >
                + เพิ่มรายการลา
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50/40 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">
                      รายการที่ {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="rounded-xl p-2 text-red-400 hover:bg-red-50 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <FormSelect
                      label="ประเภทการลา"
                      value={item.kind}
                      onChange={(value) => updateItem(item.id, "kind", value)}
                      options={leaveKinds}
                    />

                    <FormSelect
                      label="ช่วงเวลา"
                      value={item.session}
                      onChange={(value) =>
                        updateItem(item.id, "session", value)
                      }
                      options={sessions}
                    />

                    <FormInput
                      label="จำนวนวันลา"
                      type="number"
                      value={String(item.requestedDays)}
                      onChange={(value) =>
                        updateItem(item.id, "requestedDays", Number(value || 0))
                      }
                    />

                    <FormInput
                      label="วันที่เริ่ม"
                      type="date"
                      value={item.startDate}
                      onChange={(value) =>
                        updateItem(item.id, "startDate", value)
                      }
                    />

                    <FormInput
                      label="วันที่สิ้นสุด"
                      type="date"
                      value={item.endDate}
                      onChange={(value) => updateItem(item.id, "endDate", value)}
                    />

                    <div className="md:col-span-2 xl:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        หมายเหตุ
                      </label>
                      <input
                        value={item.note}
                        onChange={(e) =>
                          updateItem(item.id, "note", e.target.value)
                        }
                        placeholder="เช่น ลาย้อนหลังจากเอกสารกระดาษ"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-amber-600">
              ระบบจะบันทึกหมายเหตุขึ้นต้นด้วย [Paper] เพื่อแยกจากรายการที่พนักงานกดลาเอง
            </p>
          </div>

          <button
            disabled={saving}
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกวันลาทั้งหมด"}
          </button>
        </div>

        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden 2xl:max-w-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-900">
                รายการที่ HR บันทึกผ่านเมนูนี้
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                แสดงเฉพาะรายการ [Paper]
              </p>
            </div>
            <FileText className="text-slate-300" size={22} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    พนักงาน
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    ประเภท/วันที่
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center">
                    วัน
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-slate-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-slate-400">
                      ยังไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  currentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-700">
                          {entry.employeeName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entry.employeeCode}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-600">
                          {leaveKinds.find((kind) => kind.value === entry.kind)
                            ?.label || entry.kind}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(entry.startDate).toLocaleDateString(
                            "th-TH",
                          )}{" "}
                          -{" "}
                          {new Date(entry.endDate).toLocaleDateString("th-TH")}
                        </div>
                        <div
                          className="text-xs text-slate-400 truncate max-w-[190px]"
                          title={entry.reason}
                        >
                          {entry.reason}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-cyan-600">
                        {entry.requestedDays}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages || 1}
            </p>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FormInput({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}