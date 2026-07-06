"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  employee_code: string;
  first_name_th: string;
  last_name_th: string;
  isApprover: boolean;
  branches: { branch_name: string } | null;
  departments: { department_name: string } | null;
  positions: { position_name: string } | null;
};

type Approver = {
  id: number;
  empNo: string;
  firstNameTh: string;
  lastNameTh: string;
};

type Config = {
  weeklyHoliday: string | null;
  carryForwardAnnual: number;
  carryForwardHoliday: number;
  isApprover: boolean;
  assignedApprovers: Approver[];
  availableApprovers: Approver[];
};

const DAYS = [
  { value: "0", label: "อาทิตย์" },
  { value: "1", label: "จันทร์" },
  { value: "2", label: "อังคาร" },
  { value: "3", label: "พุธ" },
  { value: "4", label: "พฤหัสบดี" },
  { value: "5", label: "ศุกร์" },
  { value: "6", label: "เสาร์" },
];

const EMPTY_CONFIG: Config = {
  weeklyHoliday: null,
  carryForwardAnnual: 0,
  carryForwardHoliday: 0,
  isApprover: false,
  assignedApprovers: [],
  availableApprovers: [],
};

export default function ProfileSettingsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [approverSearch, setApproverSearch] = useState("");

  function loadEmployees() {
    fetch("/leave/api/employees/list")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEmployees(data); })
      .catch(() => {});
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const filtered = employees.filter(
    (e) =>
      !search ||
      e.employee_code.includes(search) ||
      e.first_name_th.includes(search) ||
      e.last_name_th.includes(search)
  );

  async function selectEmployee(emp: Employee) {
    setSelected(emp);
    setMsg(null);
    setLoading(true);
    try {
      const r = await fetch(`/leave/api/employees/${emp.id}/config`);
      if (r.ok) setConfig(await r.json());
      else setConfig(EMPTY_CONFIG);
    } finally {
      setLoading(false);
    }
  }

  function toggleAssigned(a: Approver) {
    setConfig((c) => {
      const exists = c.assignedApprovers.some((x) => x.id === a.id);
      return {
        ...c,
        assignedApprovers: exists
          ? c.assignedApprovers.filter((x) => x.id !== a.id)
          : [...c.assignedApprovers, a],
      };
    });
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch(`/leave/api/employees/${selected.id}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyHoliday: config.weeklyHoliday,
          carryForwardAnnual: config.carryForwardAnnual,
          carryForwardHoliday: config.carryForwardHoliday,
          isApprover: config.isApprover,
          approverIds: config.assignedApprovers.map((a) => a.id),
        }),
      });
      if (r.ok) {
        setMsg({ type: "ok", text: "บันทึกสำเร็จ" });
        loadEmployees();
        const updated = await fetch(`/leave/api/employees/${selected.id}/config`);
        if (updated.ok) setConfig(await updated.json());
      } else {
        setMsg({ type: "err", text: "บันทึกไม่สำเร็จ" });
      }
    } catch {
      setMsg({ type: "err", text: "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* รายชื่อพนักงาน */}
      <div className="md:col-span-1 neon-card rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-lg">รายชื่อพนักงาน</h2>
        <input
          className="neon-input rounded-xl px-3 py-2 w-full"
          placeholder="ค้นหาชื่อ / รหัส"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {filtered.map((emp) => (
            <button
              key={emp.id}
              onClick={() => selectEmployee(emp)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selected?.id === emp.id ? "bg-teal-500 text-white" : "hover:bg-[var(--input)]"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {emp.first_name_th} {emp.last_name_th}
                </span>
                {emp.isApprover && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-semibold">
                    อนุมัติได้
                  </span>
                )}
              </div>
              <div className="text-xs opacity-70">
                {emp.employee_code} · {emp.positions?.position_name ?? "-"}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-center opacity-50 py-4">ไม่พบพนักงาน</p>
          )}
        </div>
      </div>

      {/* ฟอร์มตั้งค่า */}
      <div className="md:col-span-2 neon-card rounded-2xl p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full min-h-[300px] text-sm opacity-50">
            เลือกพนักงานทางซ้ายเพื่อตั้งค่า
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full min-h-[300px] text-sm opacity-50">
            กำลังโหลด...
          </div>
        ) : (
          <div className="space-y-5">
            {/* ชื่อ */}
            <div>
              <h2 className="font-semibold text-xl">
                {selected.first_name_th} {selected.last_name_th}
              </h2>
              <p className="text-sm opacity-60">
                {selected.employee_code} · {selected.departments?.department_name ?? "-"} ·{" "}
                {selected.positions?.position_name ?? "-"}
              </p>
            </div>

            {/* วันหยุด + มีสิทธิ์อนุมัติ */}
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">วันหยุดประจำสัปดาห์</label>
                <select
                  className="neon-input rounded-xl px-3 py-2 w-full"
                  value={config.weeklyHoliday ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, weeklyHoliday: e.target.value || null }))
                  }
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-2 shrink-0">
                <input
                  type="checkbox"
                  checked={config.isApprover}
                  onChange={(e) => setConfig((c) => ({ ...c, isApprover: e.target.checked }))}
                  className="accent-amber-400 w-4 h-4"
                />
                <span className="text-sm font-medium">มีสิทธิ์อนุมัติ</span>
              </label>
            </div>

            {/* ยอดยก */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">ยอดยกวันพักร้อน (วัน)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="neon-input rounded-xl px-3 py-2 w-full"
                  value={config.carryForwardAnnual}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, carryForwardAnnual: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ยอดยกวันหยุด (วัน)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="neon-input rounded-xl px-3 py-2 w-full"
                  value={config.carryForwardHoliday}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, carryForwardHoliday: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* ผู้อนุมัติ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ผู้อนุมัติ</label>
              {config.assignedApprovers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {config.assignedApprovers.map((a) => (
                    <span key={a.id} className="flex items-center gap-1 bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 rounded-full px-3 py-1 text-sm">
                      {a.firstNameTh} {a.lastNameTh}
                      <button onClick={() => toggleAssigned(a)} className="ml-1 hover:text-red-500 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
              <input
                className="neon-input rounded-xl px-3 py-2 w-full text-sm"
                placeholder="ค้นหาชื่อผู้อนุมัติ..."
                value={approverSearch}
                onChange={(e) => setApproverSearch(e.target.value)}
              />
              <div className="border border-[var(--border)] rounded-xl max-h-52 overflow-y-auto">
                {config.availableApprovers.filter(a =>
                  !approverSearch ||
                  a.firstNameTh.includes(approverSearch) ||
                  a.lastNameTh.includes(approverSearch) ||
                  a.empNo.includes(approverSearch)
                ).length === 0 ? (
                  <p className="text-sm text-center opacity-50 py-3">
                    {config.availableApprovers.length === 0
                      ? "ยังไม่มีผู้อนุมัติ — ติ๊ก \"มีสิทธิ์อนุมัติ\" ที่พนักงานคนอื่นก่อน"
                      : "ไม่พบผู้อนุมัติที่ค้นหา"}
                  </p>
                ) : (
                  config.availableApprovers
                    .filter(a =>
                      !approverSearch ||
                      a.firstNameTh.includes(approverSearch) ||
                      a.lastNameTh.includes(approverSearch) ||
                      a.empNo.includes(approverSearch)
                    )
                    .map((a) => {
                      const checked = config.assignedApprovers.some((x) => x.id === a.id);
                      return (
                        <label key={a.id} className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[var(--input)] ${checked ? "bg-teal-50 dark:bg-teal-900/20" : ""}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleAssigned(a)} className="accent-teal-500" />
                          <span className="text-sm">
                            {a.firstNameTh} {a.lastNameTh}{" "}
                            <span className="opacity-50">({a.empNo})</span>
                          </span>
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            {msg && (
              <p className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {msg.text}
              </p>
            )}

            <button onClick={save} disabled={saving} className="btn-primary w-full">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}