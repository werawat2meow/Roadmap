"use client";

import { useEffect, useMemo, useState } from "react";
import AntIcon from "@/components/AntIcon";

function buildEmptyTranslations(languages) {
  return languages.reduce((acc, lang) => {
    acc[lang.language_slug] = "";
    return acc;
  }, {});
}

export default function JobLanguageModal({
  open,
  mode = "create",
  item = null,
  positions = [],
  languages = [],
  onClose,
  onSaved,
}) {
  const initialTranslations = useMemo(() => buildEmptyTranslations(languages), [languages]);
  const [saving, setSaving] = useState(false);
  const [positionId, setPositionId] = useState("");
  const [translations, setTranslations] = useState(initialTranslations);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      setError("");
      setPositionId(item?.position_id ? String(item.position_id) : "");
      const next = buildEmptyTranslations(languages);
      if (item?.job_to_language && typeof item.job_to_language === "object") {
        for (const lang of languages) {
          next[lang.language_slug] = item.job_to_language?.[lang.language_slug] ?? "";
        }
      }
      setTranslations(next);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, item, languages]);

  const title = mode === "edit" ? "แก้ไขข้อมูลภาษา" : "เพิ่มข้อมูลภาษา";

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        position_id: positionId,
        job_to_language: translations,
      };

      const res = await fetch(
        mode === "edit" && item?.id ? `/recruitment/api/job_language/${item.id}` : "/recruitment/api/job_language",
        {
          method: mode === "edit" && item?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || "Save failed");
      }

      onSaved?.(data.data);
      onClose?.();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"><AntIcon name="TranslationOutlined" style={{ fontSize: 19 }} /></span>
            <div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">เลือกตำแหน่งและกรอกข้อความให้ครบตามภาษาที่ต้องการ</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl px-2.5 py-1.5 text-xl leading-none text-slate-400 transition hover:bg-white hover:text-slate-700 hover:shadow-sm" aria-label="ปิดหน้าต่าง">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">ตำแหน่งงาน <span className="text-red-500">*</span></label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/70"
              required
            >
              <option value="">-- เลือกตำแหน่งงาน --</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.position_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-800">ข้อความตามภาษา</h3><p className="mt-1 text-sm text-slate-500">กรอกชื่อตำแหน่งสำหรับแต่ละภาษาที่ระบบรองรับ</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{languages.length} ภาษา</span></div>
            <div className="grid gap-4 md:grid-cols-2">
            {languages.map((lang) => (
              <div key={lang.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition focus-within:border-emerald-200 focus-within:bg-emerald-50/30">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-white px-2 text-[10px] font-bold uppercase text-emerald-700 shadow-sm">{lang.language_slug}</span>{lang.language_name}</label>
                <input
                  type="text"
                  value={translations[lang.language_slug] ?? ""}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [lang.language_slug]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/70"
                  placeholder={`กรอกชื่อตำแหน่ง (${lang.language_slug.toUpperCase()})`}
                />
              </div>
            ))}
            </div>
          </div>

          {error ? <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><AntIcon name="ExclamationCircleOutlined" className="mt-0.5" /><span>{error}</span></div> : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AntIcon name={saving ? "LoadingOutlined" : "SaveOutlined"} />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
