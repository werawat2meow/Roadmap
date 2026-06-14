"use client";

import { useEffect, useMemo, useState } from "react";

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

    setError("");
    setPositionId(item?.position_id ? String(item.position_id) : "");
    const next = buildEmptyTranslations(languages);
    if (item?.job_to_language && typeof item.job_to_language === "object") {
      for (const lang of languages) {
        next[lang.language_slug] = item.job_to_language?.[lang.language_slug] ?? "";
      }
    }
    setTranslations(next);
  }, [open, item, languages]);

  const title = mode === "edit" ? "แก้ไข Job Language" : "เพิ่ม Job Language";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Position</label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
              required
            >
              <option value="">-- เลือกตำแหน่งงาน --</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.position_name} ({p.position_level})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {languages.map((lang) => (
              <div key={lang.id}>
                <label className="mb-2 block text-sm font-medium">{lang.language_name}</label>
                <input
                  type="text"
                  value={translations[lang.language_slug] ?? ""}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [lang.language_slug]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
                  placeholder={`กรอก ${lang.language_slug}`}
                />
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}