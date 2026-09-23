"use client";

import { useEffect, useState } from "react";

type CycleSettingsForm = {
  nomination_alert_start_day: number;
  nomination_alert_end_day: number;
  nomination_start_day: number;
  nomination_end_day: number;
  hr_prepare_deadline_day: number;
  evaluation_alert_start_day: number;
  evaluation_alert_end_day: number;
  manager_lock_day: number;
};

const defaultForm: CycleSettingsForm = {
  nomination_alert_start_day: 26,
  nomination_alert_end_day: 27,
  nomination_start_day: 26,
  nomination_end_day: 28,
  hr_prepare_deadline_day: 2,
  evaluation_alert_start_day: 6,
  evaluation_alert_end_day: 7,
  manager_lock_day: 9,
};

const fields: {
  key: keyof CycleSettingsForm;
  label: string;
  help: string;
}[] = [
  {
    key: "nomination_alert_start_day",
    label: "เริ่มแจ้งเตือนขอรายชื่อ",
    help: "วันที่ HR เริ่มส่งแจ้งเตือนให้หัวหน้าเสนอรายชื่อ",
  },
  {
    key: "nomination_alert_end_day",
    label: "สิ้นสุดแจ้งเตือนขอรายชื่อ",
    help: "วันสุดท้ายของช่วงแจ้งเตือนให้เสนอรายชื่อ",
  },
  {
    key: "nomination_start_day",
    label: "เริ่มเสนอรายชื่อ",
    help: "วันที่หัวหน้าเริ่มส่งรายชื่อกลับมาให้ HR ได้",
  },
  {
    key: "nomination_end_day",
    label: "สิ้นสุดเสนอรายชื่อ",
    help: "วันสุดท้ายที่หัวหน้าส่งรายชื่อกลับมาให้ HR ได้",
  },
  {
    key: "hr_prepare_deadline_day",
    label: "HR เตรียมฟอร์มภายในวันที่",
    help: "กำหนดวันที่ HR ต้องออกใบประเมินให้เสร็จ",
  },
  {
    key: "evaluation_alert_start_day",
    label: "เริ่มแจ้งเตือนลงคะแนน",
    help: "วันที่เริ่มแจ้งเตือนให้หัวหน้าเข้ามาลงคะแนน",
  },
  {
    key: "evaluation_alert_end_day",
    label: "สิ้นสุดแจ้งเตือนลงคะแนน",
    help: "วันสุดท้ายของช่วงแจ้งเตือนให้ลงคะแนน",
  },
  {
    key: "manager_lock_day",
    label: "ปิดรับลงคะแนนตั้งแต่วันที่",
    help: "ตั้งแต่วันนี้เป็นต้นไป หัวหน้าจะไม่สามารถ submit คะแนนรอบเดือนนี้ได้",
  },
];

export default function CycleSettingsPanel() {
  const [form, setForm] = useState<CycleSettingsForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/roadmap/api/settings/cycle");
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          setForm({
            nomination_alert_start_day:
              json.data.nomination_alert_start_day ?? 26,
            nomination_alert_end_day: json.data.nomination_alert_end_day ?? 27,
            nomination_start_day: json.data.nomination_start_day ?? 26,
            nomination_end_day: json.data.nomination_end_day ?? 28,
            hr_prepare_deadline_day: json.data.hr_prepare_deadline_day ?? 2,
            evaluation_alert_start_day:
              json.data.evaluation_alert_start_day ?? 6,
            evaluation_alert_end_day: json.data.evaluation_alert_end_day ?? 7,
            manager_lock_day: json.data.manager_lock_day ?? 9,
          });
        }
      } catch (error) {
        console.error("Load cycle settings failed:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateField = (key: keyof CycleSettingsForm, value: number) => {
    const safeValue = Math.min(Math.max(value || 1, 1), 31);
    setForm((prev) => ({ ...prev, [key]: safeValue }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch("/roadmap/api/settings/cycle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        window.alert(json.error || "บันทึกการตั้งค่าวันที่ไม่สำเร็จ");
        return;
      }

      window.alert("บันทึกการตั้งค่าวันที่เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Save cycle settings failed:", error);
      window.alert("บันทึกการตั้งค่าวันที่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        กำลังโหลดการตั้งค่าวันที่...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          ตั้งค่ารอบ Roadmap
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          กำหนดวันที่แจ้งเตือน เสนอรายชื่อ ลงคะแนน และปิดรับคะแนน
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.key}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <span className="text-sm font-bold text-slate-800">
              {field.label}
            </span>
            <p className="mt-1 text-xs text-slate-500">{field.help}</p>

            <input
              type="number"
              min={1}
              max={31}
              value={form[field.key]}
              onChange={(event) =>
                updateField(field.key, Number(event.target.value))
              } 
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-all duration-200 hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-60 disabled:shadow-none"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>
    </div>
  );
}