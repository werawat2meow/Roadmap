"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emptyRow = (key) => ({ [key]: "" });

const createEmptyForm = () => ({
  position_id: "",
  salary_min: "",
  salary_max: "",
  type_of_work: "monthly",
  salary_note: "",
  requirements: [emptyRow("requirement_text")],
  responsibilities: [emptyRow("responsibility_text")],
  benefits: [emptyRow("benefit_text")],
});

export default function JobDescriptionForm({ mode = "create", positions = [], initialData = null }) {

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    position_id: "",
    salary_min: "",
    salary_max: "",
    type_of_work: "monthly",
    salary_note: "",
    requirements: [emptyRow("requirement_text")],
    responsibilities: [emptyRow("responsibility_text")],
    benefits: [emptyRow("benefit_text")],
  });

  useEffect(() => {
    if (!initialData) return;

    setForm({
      position_id: initialData.position_id?.toString() || "",
      salary_min: initialData.salary_min?.toString() || "",
      salary_max: initialData.salary_max?.toString() || "",
      type_of_work: initialData.type_of_work || "monthly",
      salary_note: initialData.salary_note || "",
      requirements:
        initialData.requirements?.length > 0
          ? initialData.requirements.map((item) => ({ requirement_text: item.requirement_text || "" }))
          : [emptyRow("requirement_text")],
      responsibilities:
        initialData.responsibilities?.length > 0
          ? initialData.responsibilities.map((item) => ({
              responsibility_text: item.responsibility_text || "",
            }))
          : [emptyRow("responsibility_text")],
      benefits:
        initialData.benefits?.length > 0
          ? initialData.benefits.map((item) => ({ benefit_text: item.benefit_text || "" }))
          : [emptyRow("benefit_text")],
    });
  }, [initialData]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateSection(section, index, key, value) {
    setForm((prev) => {
      const next = [...prev[section]];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, [section]: next };
    });
  }

  function addRow(section, key) {
    setForm((prev) => ({
      ...prev,
      [section]: [...prev[section], emptyRow(key)],
    }));
  }

  function removeRow(section, index, key) {
    setForm((prev) => {
      const next = prev[section].filter((_, i) => i !== index);
      return {
        ...prev,
        [section]: next.length > 0 ? next : [emptyRow(key)],
      };
    });
  }

  function handleReset() {
    setErrorMessage("");
    setLoading(false);

    if (mode === "edit" && initialData) {
      setForm({
        position_id: initialData.position_id?.toString() || "",
        salary_min: initialData.salary_min?.toString() || "",
        salary_max: initialData.salary_max?.toString() || "",
        type_of_work: initialData.type_of_work || "monthly",
        salary_note: initialData.salary_note || "",
        requirements:
          initialData.requirements?.length > 0
            ? initialData.requirements.map((item) => ({ requirement_text: item.requirement_text || "" }))
            : [emptyRow("requirement_text")],
        responsibilities:
          initialData.responsibilities?.length > 0
            ? initialData.responsibilities.map((item) => ({
                responsibility_text: item.responsibility_text || "",
              }))
            : [emptyRow("responsibility_text")],
        benefits:
          initialData.benefits?.length > 0
            ? initialData.benefits.map((item) => ({ benefit_text: item.benefit_text || "" }))
            : [emptyRow("benefit_text")],
      });
      return;
    }

    setForm(createEmptyForm());
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
      requirements: form.requirements,
      responsibilities: form.responsibilities,
      benefits: form.benefits,
    };

    const isEdit = mode === "edit";
    const url = isEdit ? `/recruitment/api/job_description/${initialData.id}` : "/recruitment/api/job_description";
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

      router.push("/recruitment/job_description");
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
        <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border bg-white p-6 shadow-sm">
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
              itemKey="requirement_text"
              items={form.requirements}
              onAdd={() => addRow("requirements", "requirement_text")}
              onRemove={(index) => removeRow("requirements", index, "requirement_text")}
              onChange={(index, value) => updateSection("requirements", index, "requirement_text", value)}
            />

            <SectionList
              title="หน้าที่ความรับผิดชอบ"
              sectionKey="responsibilities"
              itemKey="responsibility_text"
              items={form.responsibilities}
              onAdd={() => addRow("responsibilities", "responsibility_text")}
              onRemove={(index) => removeRow("responsibilities", index, "responsibility_text")}
              onChange={(index, value) => updateSection("responsibilities", index, "responsibility_text", value)}
            />

            <SectionList
              title="สวัสดิการ"
              sectionKey="benefits"
              itemKey="benefit_text"
              items={form.benefits}
              onAdd={() => addRow("benefits", "benefit_text")}
              onRemove={(index) => removeRow("benefits", index, "benefit_text")}
              onChange={(index, value) => updateSection("benefits", index, "benefit_text", value)}
            />
          </div>

          <div className="flex items-center gap-3 justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/admin/job-description")}
                className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
                style={{ backgroundColor: "orange" , color:"black" }}
              >
                ย้อนกลับ
              </button>
            </div>
            <div className="flex items-center gap-3" >

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

function SectionList({ title, items, itemKey, onAdd, onRemove, onChange }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <button type="button" onClick={onAdd} className="rounded-xl border px-4 py-2 text-sm">
          + เพิ่มรายการ
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={item[itemKey]}
              onChange={(e) => onChange(index, e.target.value)}
              className="flex-1 rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder={`กรอก${title}`}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-xl border px-4 py-3 text-sm text-red-600"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}