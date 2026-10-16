"use client";

import React, { useEffect, useState } from "react";
import {
  Trash2,
  Plus,
  PartyPopper,
  CalendarDays,
  Pencil,
  X,
  Save,
} from "lucide-react";

// 1. Interface ให้ตรงกับ model leave_holidays ใน Prisma
interface Holiday {
  id: number;
  date: string;
  title: string;
  note?: string;
}

export default function LeaveSettingsHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSave = async () => {
    if (!newDate || !newTitle.trim()) return;

    const isEditing = editingId !== null;

    try {
      const res = await fetch("/leave/api/holidays", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          title: newTitle,
          date: newDate,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            (isEditing ? "แก้ไขวันหยุดไม่สำเร็จ" : "เพิ่มวันหยุดไม่สำเร็จ"),
        );
      }

      setHolidays((prev) => {
        const next = isEditing
          ? prev.map((item) => (item.id === editingId ? json.data : item))
          : [...prev, json.data];

        return next.sort((a, b) => a.date.localeCompare(b.date));
      });

      setNewDate("");
      setNewTitle("");
      setEditingId(null);
    } catch (error: any) {
      console.error("Save holiday failed:", error);
      alert(error.message || "บันทึกวันหยุดไม่สำเร็จ");
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchHolidays() {
      try {
        setLoading(true);

        const res = await fetch("/leave/api/holidays", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "โหลดข้อมูลวันหยุดไม่สำเร็จ");
        }

        if (mounted) {
          setHolidays(json.data || []);
        }
      } catch (error: any) {
        console.error("Load holidays failed:", error);

        if (mounted) {
          alert(error.message || "โหลดข้อมูลวันหยุดไม่สำเร็จ");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchHolidays();

    return () => {
      mounted = false;
    };
  }, []);

  const handleEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setNewDate(holiday.date);
    setNewTitle(holiday.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewDate("");
    setNewTitle("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบวันหยุดนี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/leave/api/holidays?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "ลบวันหยุดไม่สำเร็จ");
      }

      setHolidays((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      console.error("Delete holiday failed:", error);
      alert(error.message || "ลบวันหยุดไม่สำเร็จ");
    }
  };

  return (
    <section className="w-full space-y-4">
      {/* Header Section */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
          Annual Holidays
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          กำหนดวันหยุดประจำปีของบริษัท
        </p>
      </div>

      {/* Form Section - สำหรับเพิ่มวันหยุดใหม่ */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            />
          </div>

          <div className="md:col-span-8 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Holiday Name
            </label>
            <input
              type="text"
              placeholder="e.g. New Year's Day"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>

          <div className="md:col-span-1">
            <button
              onClick={handleSave}
              className="w-full h-[48px] flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md active:scale-95 cursor-pointer"
              title={editingId ? "บันทึกการแก้ไข" : "เพิ่มวันหยุด"}
            >
              {editingId ? (
                <>
                  <Save size={18} />
                  <span className="text-sm font-bold">บันทึก</span>
                </>
              ) : (
                <Plus size={20} />
              )}
            </button>
          </div>
        </div>
        {editingId !== null && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X size={16} />
            ยกเลิกการแก้ไข
          </button>
        )}
      </div>

      {/* List Section - รายการวันหยุด */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm border border-slate-100">
            กำลังโหลดข้อมูลวันหยุด...
          </div>
        ) : holidays.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm border border-slate-100">
            ยังไม่มีข้อมูลวันหยุดประจำปี
          </div>
        ) : (
          holidays.map((item) => (
            <div
              key={item.id}
              className="group relative flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:border-emerald-100 transition-all"
            >
              <div className="flex items-center gap-6">
                {/* Icon วันหยุด */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform">
                  <PartyPopper size={22} />
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-lg">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays size={14} />
                    <span className="text-sm font-medium">{item.date}</span>
                  </div>
                </div>
              </div>

              {/* ปุ่มถังขยะแบบเด่นเหมือนหน้ากำหนดสิทธิ์ */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex items-center justify-center w-10 h-10 border border-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-100 transition-all cursor-pointer"
                  title="แก้ไขวันหยุด"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center justify-center w-10 h-10 border border-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-100 transition-all cursor-pointer"
                  title="ลบวันหยุด"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
