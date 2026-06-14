"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const buildLocalizedRow = (languages = []) =>
  Object.fromEntries(languages.map((lang) => [lang.language_slug, ""]));

const normalizeLocalizedRows = (rows, languages = [], textField = "") => {
  const base = buildLocalizedRow(languages);

  if (Array.isArray(rows) && rows.length > 0) {
    return rows.map((row) => {
      // ดึง localized object จาก field ที่ระบุ เช่น row.requirement_text
      const textData = (textField && row?.[textField]) || row || {};
      return {
        ...base,
        ...(typeof textData === "object" ? textData : {}),
      };
    });
  }

  return [base];
};

const createEmptyForm = (languages = []) => ({
  position_id: "",
  salary_min: "",
  salary_max: "",
  type_of_work: "monthly",
  salary_note: "",
  requirements: [buildLocalizedRow(languages)],
  responsibilities: [buildLocalizedRow(languages)],
  benefits: [buildLocalizedRow(languages)],
});

const buildFormData = (initialData, languages) => ({
  position_id: initialData?.positions_id?.toString() || "",
  salary_min: initialData?.salary_min?.toString() || "",
  salary_max: initialData?.salary_max?.toString() || "",
  type_of_work: initialData?.type_of_work || "monthly",
  salary_note: initialData?.salary_note || "",
  requirements: normalizeLocalizedRows(
    initialData?.requirements,
    languages,
    "requirement_text"       // ✅ เพิ่ม
  ),
  responsibilities: normalizeLocalizedRows(
    initialData?.responsibilities,
    languages,
    "responsibility_text"    // ✅ เพิ่ม
  ),
  benefits: normalizeLocalizedRows(
    initialData?.benefits,
    languages,
    "benefit_text"           // ✅ เพิ่ม
  ),
});

export default function JobDescriptionForm({
  mode = "create",
  positions = [],
  languages = [],
  initialData = null,
}) {

  // console.log(initialData);
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emptyForm = useMemo(
    () => createEmptyForm(languages),
    [languages]
  );

  const [form, setForm] = useState(() => emptyForm);

  // console.log(form);
  

  const languageKey = useMemo(
    () =>
      languages
        .map((lang) => lang.language_slug)
        .join("|"),
    [languages]
  );

  const formSyncKey = useMemo(() => {
    return JSON.stringify({
      id: initialData?.id ?? null,
      languageKey,
    });
  }, [initialData?.id, languageKey]);

  

  const previousSyncKey = useRef(null);

  const initialDataKey = initialData?.id ?? "create";

  useEffect(() => {
    if (previousSyncKey.current === formSyncKey) {
      return;
    }

    previousSyncKey.current = formSyncKey;

    if (!initialData) {
      setForm(createEmptyForm(languages));
      return;
    }

    setForm(buildFormData(initialData, languages));
  }, [formSyncKey]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateSection(section, index, langSlug, value) {
    setForm((prev) => {
      const next = [...prev[section]];
      next[index] = {
        ...next[index],
        [langSlug]: value,
      };
      return { ...prev, [section]: next };
    });
  }

  function addRow(section) {
    setForm((prev) => ({
      ...prev,
      [section]: [...prev[section], buildLocalizedRow(languages)],
    }));
  }

  function removeRow(section, index) {
    setForm((prev) => {
      const next = prev[section].filter((_, i) => i !== index);
      return {
        ...prev,
        [section]: next.length > 0 ? next : [buildLocalizedRow(languages)],
      };
    });
  }

  function handleReset() {
    setErrorMessage("");
    setLoading(false);

    if (mode === "edit" && initialData) {
      setForm(buildFormData(initialData, languages));
      return;
    }

    setForm(createEmptyForm(languages));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const payload = {
      position_id: form.position_id,
      salary_min: form.salary_min,
      salary_max: form.salary_max,
      salary_note: form.salary_note || null,
      type_of_work: form.type_of_work,
      requirements: form.requirements, // JSON
      responsibilities: form.responsibilities, // JSON
      benefits: form.benefits, // JSON
    };
    
    const isEdit = mode === "edit";
    const url = isEdit
      ? `/recruitment/api/job_description/${initialData.id}`
      : "/recruitment/api/job_description";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "บันทึกไม่สำเร็จ");
      }

      router.push("/recruitment/setting/job_description");
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "edit"
                ? "แก้ไขข้อมูลการเปิดรับสมัครพนักงาน"
                : "บันทึกข้อมูลการเปิดรับสมัครพนักงาน"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Position</label>
              <select
                value={form.position_id}
                onChange={(e) => updateField("position_id", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              >
                <option value="">-- เลือก position --</option>
                {positions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.position_name} ( {item.position_level} )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">รูปแบบในการจ้างงาน</label>
              <select
                value={form.type_of_work}
                onChange={(e) => updateField("type_of_work", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              >
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">เงินเดือนต่ำสุด</label>
              <input
                type="number"
                value={form.salary_min}
                onChange={(e) => updateField("salary_min", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">เงินเดือนสูงสุด</label>
              <input
                type="number"
                value={form.salary_max}
                onChange={(e) => updateField("salary_max", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <SectionList
              title="คุณสมบัติ"
              sectionKey="requirements"
              items={form.requirements}
              languages={languages}
              onAdd={() => addRow("requirements")}
              onRemove={(index) => removeRow("requirements", index)}
              onChange={(index, langSlug, value) =>
                updateSection("requirements", index, langSlug, value)
              }
            />

            <SectionList
              title="หน้าที่ความรับผิดชอบ"
              sectionKey="responsibilities"
              items={form.responsibilities}
              languages={languages}
              onAdd={() => addRow("responsibilities")}
              onRemove={(index) => removeRow("responsibilities", index)}
              onChange={(index, langSlug, value) =>
                updateSection("responsibilities", index, langSlug, value)
              }
            />

            <SectionList
              title="สวัสดิการ"
              sectionKey="benefits"
              items={form.benefits}
              languages={languages}
              onAdd={() => addRow("benefits")}
              onRemove={(index) => removeRow("benefits", index)}
              onChange={(index, langSlug, value) => updateSection("benefits", index, langSlug, value)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => router.push("/recruitment/setting/job_description")}
                className="cursor-pointer rounded-lg px-4 py-2 font-medium text-black shadow-sm transition-colors"
                style={{ backgroundColor: "orange" }}
              >
                ย้อนกลับ
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ล้างค่า
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionList({ title, items, languages = [], onAdd, onRemove, onChange }) {
  // console.log(languages);
  
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <button type="button" onClick={onAdd} className="rounded-xl border px-4 py-2 text-sm">
          + เพิ่มรายการ
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          
          <div key={index} className="rounded-2xl border bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                รายการที่ {index + 1}
              </p>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-xl border px-4 py-2 text-sm text-red-600"
              >
                ลบ
              </button>
            </div>

            <div className={`grid gap-3 ${languages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {languages.map((lang) => (
                <div key={lang.language_slug}>
                  <label className="mb-2 block text-sm font-medium">
                    {lang.language_name || lang.language_slug}
                  </label>
                  <input
                    value={item[lang.language_slug] ?? ""}
                    onChange={(e) => onChange(index, lang.language_slug, e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    placeholder={`กรอก${title} (${lang.language_slug})`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}