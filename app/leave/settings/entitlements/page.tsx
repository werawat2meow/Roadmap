"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Save, X } from "lucide-react";

interface LeaveRightsTemplate {
  id: number;
  prefix: string;
  annualLeaveDays: number;
  holidayLeaveDays: number;
  vacationLeaveDays: number;
  businessLeaveDays: number;
  sickLeaveDays: number;
  ordainLeaveDays: number;
  maternityLeaveDays: number;
  unpaidLeaveDays: number;
  birthdayLeaveDays: number;
}

export default function LeaveSettingsEntitlementsPage() {
  const [data, setData] = useState<LeaveRightsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 2500);
  };

  const getLevelNumber = (prefix: string) => {
    const matched = prefix.match(/\d+/);
    return matched ? Number(matched[0]) : 0;
  };

  const createNextItem = (items: LeaveRightsTemplate[]): LeaveRightsTemplate => {
    const latestItem = [...items].sort(
      (a, b) => getLevelNumber(b.prefix) - getLevelNumber(a.prefix),
    )[0];

    if (!latestItem) {
      return {
        id: Date.now() * -1,
        prefix: "P1",
        annualLeaveDays: 0,
        holidayLeaveDays: 0,
        vacationLeaveDays: 0,
        businessLeaveDays: 0,
        sickLeaveDays: 0,
        ordainLeaveDays: 0,
        maternityLeaveDays: 0,
        unpaidLeaveDays: 0,
        birthdayLeaveDays: 0,
      };
    }

    const nextLevel = getLevelNumber(latestItem.prefix) + 1;

    return {
      ...latestItem,
      id: Date.now() * -1,
      prefix: `P${nextLevel}`,
    };
  };

  useEffect(() => {
    let mounted = true;

    async function loadEntitlements() {
      try {
        setLoading(true);

        const res = await fetch("/leave/api/entitlements", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "โหลดข้อมูลสิทธิ์วันลาไม่สำเร็จ");
        }

        if (mounted) {
          setData(json.data || []);
        }
      } catch (error: any) {
        console.error("Load entitlements failed:", error);

        if (mounted) {
          alert(error.message || "โหลดข้อมูลสิทธิ์วันลาไม่สำเร็จ");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadEntitlements();

    return () => {
      mounted = false;
    };
  }, []);

  const handleValueChange = (
    id: number,
    field: keyof LeaveRightsTemplate,
    value: string,
  ) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === "prefix" ? value : parseInt(value) || 0,
          };
        }
        return item;
      }),
    );
  };

  const addNewLevel = () => {
    if (creating) return;

    setCreating(true);
    setData((prev) => [createNextItem(prev), ...prev]);
  };

  const saveLevel = async (item: LeaveRightsTemplate) => {
    if (!item.prefix.trim()) {
      alert("กรุณาระบุ Level P");
      return;
    }

    const isNew = item.id < 0;

    try {
      setSavingId(item.id);

      const res = await fetch("/leave/api/entitlements", {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            (isNew ? "เพิ่มสิทธิ์วันลาไม่สำเร็จ" : "แก้ไขสิทธิ์วันลาไม่สำเร็จ"),
        );
      }

      setData((prev) =>
        prev
          .map((row) => (row.id === item.id ? json.data : row))
          .sort((a, b) => getLevelNumber(a.prefix) - getLevelNumber(b.prefix)),
      );

      if (isNew) {
        setCreating(false);
      }

      showSuccess(isNew ? "เพิ่มรายการสำเร็จ" : "บันทึกรายการสำเร็จ");
    } catch (error: any) {
      console.error("Save entitlement failed:", error);
      alert(error.message || "บันทึกสิทธิ์วันลาไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  };

  const removeLevel = async (id: number) => {
    if (id < 0) {
      cancelNewLevel(id);
      return;
    }

    if (!confirm("ต้องการลบรายการสิทธิ์วันลานี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/leave/api/entitlements?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "ลบสิทธิ์วันลาไม่สำเร็จ");
      }

      setData((prev) => prev.filter((item) => item.id !== id));
      showSuccess("ลบรายการสำเร็จ");
    } catch (error: any) {
      console.error("Delete entitlement failed:", error);
      alert(error.message || "ลบสิทธิ์วันลาไม่สำเร็จ");
    }
  };

  const cancelNewLevel = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setCreating(false);
  };

  return (
    <section className="w-full space-y-6">
      {successMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            Leave Entitlement Settings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            กำหนดจำนวนวันลาต่อระดับพนักงาน
          </p>
        </div>
        <button
          onClick={addNewLevel}
          className="cursor-pointer flex items-center gap-2 
             bg-gradient-to-r from-emerald-500 to-emerald-600 
             text-white px-6 py-3 rounded-2xl 
             hover:from-emerald-600 hover:to-emerald-700 
             hover:shadow-lg hover:shadow-emerald-200 
             active:scale-95 transition-all duration-200 
             font-semibold shadow-md border border-emerald-400/20"
        >
          <Plus size={18} className="stroke-[3px]" />
          เพิ่มรายการ
        </button>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm border border-slate-100">
            กำลังโหลดข้อมูลสิทธิ์วันลา...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm border border-slate-100">
            ยังไม่มีข้อมูลสิทธิ์วันลา
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="relative rounded-3xl bg-white p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md"
            >
              <div className="absolute -top-3 -right-3 flex items-center gap-2 z-10">
                <button
                  onClick={() => saveLevel(item)}
                  disabled={savingId === item.id}
                  className="cursor-pointer flex items-center justify-center w-10 h-10 bg-white border border-emerald-100 text-emerald-600 rounded-full shadow-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                  title="บันทึก"
                >
                  <Save size={18} />
                </button>

                <button
                  onClick={() => removeLevel(item.id)}
                  className="cursor-pointer flex items-center justify-center w-10 h-10 bg-white border border-red-100 text-red-500 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all"
                  title={item.id < 0 ? "ยกเลิก" : "ลบ"}
                >
                  {item.id < 0 ? <X size={18} /> : <Trash2 size={18} />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                <InputBox
                  label="Level P"
                  value={item.prefix}
                  onChange={(v) => handleValueChange(item.id, "prefix", v)}
                  isText
                />
                <InputBox
                  label="ลาพักร้อน"
                  value={item.annualLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "annualLeaveDays", v)
                  }
                />
                <InputBox
                  label="ลากิจ"
                  value={item.businessLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "businessLeaveDays", v)
                  }
                />
                <InputBox
                  label="ลาป่วย"
                  value={item.sickLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "sickLeaveDays", v)
                  }
                />
                <InputBox
                  label="ลาบวช"
                  value={item.ordainLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "ordainLeaveDays", v)
                  }
                />
                <InputBox
                  label="ลาคลอด"
                  value={item.maternityLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "maternityLeaveDays", v)
                  }
                />
                <InputBox
                  label="ลาไม่รับค่าจ้าง"
                  value={item.unpaidLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "unpaidLeaveDays", v)
                  }
                />
                <InputBox
                  label="ลาวันเกิด"
                  value={item.birthdayLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "birthdayLeaveDays", v)
                  }
                />
                <InputBox
                  label="วันหยุดประจำปี"
                  value={item.holidayLeaveDays}
                  onChange={(v) =>
                    handleValueChange(item.id, "holidayLeaveDays", v)
                  }
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function InputBox({
  label,
  value,
  onChange,
  isText = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  isText?: boolean;
}) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        type={isText ? "text" : "number"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3.5 text-slate-700 font-bold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm text-sm"
      />
    </div>
  );
}
