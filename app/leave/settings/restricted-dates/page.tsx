"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Calendar, Users } from "lucide-react";

// 1. Interface อ้างอิงจาก model leave_blackouts และ targets
type TargetType = "ORG" | "DEPARTMENT" | "DIVISION" | "UNIT";
interface RestrictedDate {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  active: boolean;
  targets: {
    id: number;
    targetType: TargetType;
    targetId: string;
  }[];
}

export default function LeaveSettingsRestrictedDatesPage() {
  const [restrictedDates, setRestrictedDates] = useState<RestrictedDate[]>([]);
  const [meta, setMeta] = useState<any>({
    branches: [],
    departments: [],
    divisions: [],
    units: [],
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("ORG");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [blackoutsResponse, metaResponse] = await Promise.all([
          fetch("/leave/api/blackouts"),
          fetch("/leave/api/blackouts/meta"),
        ]);

        const blackoutsJson = await blackoutsResponse.json();
        const metaJson = await metaResponse.json();

        if (blackoutsJson.success) {
          setRestrictedDates(blackoutsJson.data || []);
        }

        if (metaJson.success) {
          setMeta(metaJson.data || {});
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleAdd() {
    if (!startDate || !endDate || !reason.trim() || !targetId) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const response = await fetch("/leave/api/blackouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        reason: reason.trim(),
        active: true,
        allKinds: true,
        targets: [
          {
            targetType,
            targetId,
          },
        ],
        blockedKinds: [],
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.error || "บันทึกไม่สำเร็จ");
      return;
    }

    window.location.reload();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("ต้องการยกเลิกรายการนี้หรือไม่")) {
      return;
    }

    const response = await fetch(`/leave/api/blackouts?id=${id}`, {
      method: "DELETE",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.error || "ลบรายการไม่สำเร็จ");
      return;
    }

    setRestrictedDates((current) => current.filter((item) => item.id !== id));
  }

  const targetOptions = useMemo(() => {
    if (targetType === "ORG") return meta.branches || [];
    if (targetType === "DEPARTMENT") return meta.departments || [];
    if (targetType === "DIVISION") return meta.divisions || [];
    return meta.units || [];
  }, [meta, targetType]);

  function getOrganizationName(item: any) {
    return (
      item?.branch_name ||
      item?.department_name ||
      item?.division_name ||
      item?.unit_name ||
      "-"
    );
  }

  function getTargetName(item: RestrictedDate) {
    const target = item.targets?.[0];

    if (!target) {
      return "-";
    }

    const options =
      target.targetType === "ORG"
        ? meta.branches
        : target.targetType === "DEPARTMENT"
          ? meta.departments
          : target.targetType === "DIVISION"
            ? meta.divisions
            : meta.units;

    const found = options.find(
      (option) => option.id === target.targetId,
    ) as any;

    return (
      found?.branch_name ||
      found?.department_name ||
      found?.division_name ||
      found?.unit_name ||
      target.targetId ||
      "-"
    );
  }

  return (
    <section className="w-full space-y-4">
      {/* Header Section */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
          Restricted Leave Dates
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          กำหนดช่วงเวลาห้ามลา สำหรับบางหน่วยงานหรือพนักงานทั้งหมด
        </p>
      </div>

      {/* Form Section (Add New) */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Apply To (Target)
            </label>
            <select
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as TargetType);
                setTargetId("");
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="ORG">สังกัด</option>
              <option value="DEPARTMENT">แผนก</option>
              <option value="DIVISION">ฝ่าย</option>
              <option value="UNIT">หน่วย</option>
            </select>

            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="">เลือกหน่วยงาน</option>

              {targetOptions.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {getOrganizationName(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500">เหตุผล</label>

            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="เช่น ปิดงบสิ้นปี"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="md:col-span-1">
            <button
              onClick={handleAdd}
              className="w-full h-[48px] flex items-center justify-center bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-3">
        {restrictedDates.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:border-blue-100 transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Calendar size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-slate-900">
                    {item.startDate} ถึง {item.endDate}
                  </h4>

                  <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    <Users size={12} />
                    {getTargetName(item)}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{item.reason}</p>
              </div>
            </div>

            <button
              onClick={() => void handleDelete(item.id)}
              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
