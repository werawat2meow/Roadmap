"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from 'antd';

const buildLocalizedRow = (languages = []) => ({
  ...Object.fromEntries(
    languages.map((lang) => [lang.language_slug, ""])
  ),
});

const buildSectionRow = (languages = []) => ({
  text: buildLocalizedRow(languages),
  sort_order: 1,
  showpage: false,
});

const normalizeLocalizedRows = (rows, languages = [], textField = "") => {
  const baseText = buildLocalizedRow(languages);
  if (Array.isArray(rows) && rows.length > 0) {
    return rows.map((row) => {
      const source =
        (row?.text && typeof row.text === "object" && row.text) ||
        (typeof row?.[textField] === "object" ? row[textField] : {});

      return {
        id: row?.id,
        text: { ...baseText, ...source },
        sort_order: row?.sort_order ?? 1,
        showpage: row?.showpage ?? false,
      };
    });
  }
  return [{ text: baseText, sort_order: 1, showpage: false }];
};

// Same idea as normalizeLocalizedRows but for a single localized object
// (e.g. { th: "...", en: "..." }) instead of a repeatable list of rows.
const normalizeLocalizedObject = (data, languages = [], textField = "") => {
  const base = buildLocalizedRow(languages);
  const source = (textField && data?.[textField]) || data || {};
  return { ...base, ...(typeof source === "object" && !Array.isArray(source) ? source : {}) };
};

const createEmptyForm = (languages = []) => ({
  branch_id: [],
  department_id: "",
  division_id: "",
  unit_id: "",
  positions_id: "",
  salary_mode: "range",
  salary_min: "",
  salary_max: "",
  type_of_work: "",
  salary_note: "",
  workplace: "",
  description: buildLocalizedRow(languages),
  requirements: [buildSectionRow(languages)],
  responsibilities: [buildSectionRow(languages)],
  benefits: [buildSectionRow(languages)],
  workday: "",
  dayoff: "",
  remark:"",
});

const buildFormData = (initialData, languages) => ({  
  branch_id:
    initialData.jobDescriptionBranches.length > 0
      ? initialData.jobDescriptionBranches.map((item) => item.branch_id.toString())
      : Array.isArray(initialData?.branch_id)
        ? initialData.branch_id.map(String)
        : initialData?.branch_id
          ? [initialData.branch_id.toString()]
          : [],
  department_id: initialData?.department_id?.toString() || "",
  division_id: initialData?.division_id?.toString() || "",
  unit_id: initialData?.unit_id?.toString() || "",
  positions_id: initialData?.positions_id?.toString() || "",
  
  salary_mode:
    initialData?.salary_note === "เงินเดือนตามตกลง"
      ? "negotiable"
      : "range",
  salary_min: initialData?.salary_min?.toString() || "",
  salary_max: initialData?.salary_max?.toString() || "",
  salary_note: initialData?.salary_note || "",

  type_of_work: initialData?.type_of_work || "monthly",
  salary_note: initialData?.salary_note || "",
  workplace: initialData?.workplace || "",
  description: normalizeLocalizedObject(initialData?.description, languages, "description_text"),
  requirements: normalizeLocalizedRows(initialData?.requirements, languages, "requirement_text"),
  responsibilities: normalizeLocalizedRows(initialData?.responsibilities, languages, "responsibility_text"),
  benefits: normalizeLocalizedRows(initialData?.benefits, languages, "benefit_text"),
  workday:initialData?.workday || "",
  dayoff:initialData?.dayoff || "",
  remark: initialData?.remark || "",
});

// Helper: ensure ของที่ถูก select อยู่ใน list เสมอ
function ensureSelected(list, selectedId, allItems) {
  if (!selectedId) return list;
  const inList = list.some((i) => i.id?.toString() === selectedId.toString());
  if (inList) return list;
  const found = allItems.find((i) => i.id?.toString() === selectedId.toString());
  return found ? [found, ...list] : list;
}

export default function JobDescriptionForm({
  mode = "create",
  branches = [],
  departments = [],
  branchDepartments = [],
  divisions = [],
  units = [],
  positions = [],
  unitPositions = [],
  languages = [],
  emptype = [],
  initialData = null,
}) {  
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emptyForm = useMemo(() => createEmptyForm(languages), [languages]);
  const [form, setForm] = useState(() => emptyForm); 

  const languageKey = useMemo(
    () => languages.map((lang) => lang.language_slug).join("|"),
    [languages]
  );

  const formSyncKey = useMemo(
    () => JSON.stringify({ id: initialData?.id ?? null, languageKey }),
    [initialData?.id, languageKey]
  );

  const previousSyncKey = useRef(null);

  useEffect(() => {
    if (previousSyncKey.current === formSyncKey) return;
    previousSyncKey.current = formSyncKey;
    setForm(initialData ? buildFormData(initialData, languages) : createEmptyForm(languages));
  }, [formSyncKey, initialData, languages]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Update a single localized field that is stored as one object (not a list of rows)
  function updateLocalizedField(name, langSlug, value) {
    setForm((prev) => ({
      ...prev,
      [name]: { ...prev[name], [langSlug]: value },
    }));
  }

  function handleBranchChange(values) {
    setForm((prev) => {
      if (mode === "edit" && values.length > 1) {
        return {
          ...prev,
          branch_id: values,
        };
      }
      return {
        ...prev,
        branch_id: values,
        department_id: "",
        division_id: "",
        unit_id: "",
        positions_id: "",
      };
    });
  }

  function handleDepartmentChange(value) {
    setForm((prev) => ({
      ...prev,
      department_id: value,
      division_id: "",
      unit_id: "",
      positions_id: "",
    }));
  }

  function handleDivisionChange(value) {
    setForm((prev) => ({
      ...prev,
      division_id: value,
      unit_id: "",
      positions_id: "",
    }));
  }

  function handleUnitChange(value) {  
    setForm((prev) => ({
      ...prev,
      unit_id: value,
      positions_id: "",
    }));
  }

  function handleSalaryModeChange(mode) {
    setForm((prev) => {
      if (mode === "negotiable") {
        return {
          ...prev,
          salary_mode: mode,
          salary_min: "",
          salary_max: "",
          salary_note: prev.salary_note || "เงินเดือนตามตกลง",
        };
      }

      return {
        ...prev,
        salary_mode: mode,
        salary_note: "",
      };
    });
  }


  function updateSection(section, index, key, value) {
  setForm((prev) => {
    const next = [...prev[section]];

    if (key === "sort_order" || key === "showpage") {
      next[index] = {
        ...next[index],
        [key]: value,
      };
    } else {
      next[index] = {
        ...next[index],
        text: {
          ...next[index].text,
          [key]: value,
        },
      };
    }

    return {
      ...prev,
      [section]: next,
    };
  });
}

  function addRow(section) {
    setForm((prev) => ({
      ...prev,
      [section]: [...prev[section], buildSectionRow(languages)],
    }));
  }

  function removeRow(section, index) {
    setForm((prev) => {
      const next = prev[section].filter((_, i) => i !== index);
      return {
        ...prev,
        [section]: next.length > 0 ? next : [buildSectionRow(languages)],
      };
    });
  }

  function handleReset() {
    setErrorMessage("");
    setLoading(false);
    setForm(mode === "edit" && initialData ? buildFormData(initialData, languages) : createEmptyForm(languages));
  }

  // ── Filtered lists ──────────────────────────────────────────────────────────
  // แต่ละ memo กรองตาม parent แล้ว inject item ที่ถูก select ไว้เสมอ
  // เพื่อให้ <select value={...}> เจอ <option> ตรงกันแม้ filter จะพลาด
  const filteredDepartments = useMemo(() => {
    if (form.branch_id.length === 0) return [];

    const ids = branchDepartments
      .filter((item) =>
        form.branch_id.includes(item.branch_id?.toString())
      )
      .map((item) => item.department_id?.toString());

    const departmentsByBranch = departments.filter((item) =>
      ids.includes(item.id?.toString())
    );

    return ensureSelected(
      departmentsByBranch,
      form.department_id,
      departments
    );
  }, [
    form.branch_id,
    form.department_id,
    branchDepartments,
    departments,
  ]);

  const filteredDivisions = useMemo(() => {
    const byDept = form.department_id
      ? divisions.filter((i) => i.department_id?.toString() === form.department_id.toString())
      : [];
    return ensureSelected(byDept, form.division_id, divisions);
  }, [form.department_id, form.division_id, divisions]);

  const filteredUnits = useMemo(() => {
    const byDiv = form.division_id
      ? units.filter((i) => i.division_id?.toString() === form.division_id.toString())
      : [];      
    return ensureSelected(byDiv, form.unit_id, units);
  }, [form.division_id, form.unit_id, units]);

  const filteredPositions = useMemo(() => {
    const byUnit = form.unit_id   
      ? (() => {
          const ids = unitPositions
            .filter((i) => i.unit_id?.toString() === form.unit_id.toString())
            .map((i) => i.position_id?.toString());
          return positions.filter((i) => ids.includes(i.id?.toString()));
        })()
      : [];
    return ensureSelected(byUnit, form.positions_id, positions);
  }, [form.unit_id, form.positions_id, unitPositions, positions]);

  // ── Disabled conditions ────────────────────────────────────────────────────
  // disabled ก็ต่อเมื่อ parent ว่าง AND ตัวเองก็ยังไม่มีค่า
  // (กรณี edit ที่โหลดมาแล้วมีค่าครบ จะไม่ถูก disabled)
  const deptDisabled = form.branch_id.length === 0 && !form.department_id;
  const divDisabled = !form.department_id && !form.division_id;
  const unitDisabled = !form.division_id && !form.unit_id;
  const posDisabled = !form.unit_id && !form.positions_id;
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (!form.branch_id || !form.department_id || !form.division_id || !form.unit_id || !form.positions_id) {
      setErrorMessage("กรุณาเลือกตำแหน่งงานให้ครบ");
      setLoading(false);
      return;
    }

    const payload = {
      branch_id: form.branch_id || null,
      department_id: form.department_id || null,
      division_id: form.division_id || null,
      unit_id: form.unit_id || null,
      positions_id: form.positions_id || null,
      salary_min: form.salary_min,
      salary_max: form.salary_max,
      salary_note: form.salary_note || null,
      workplace: form.workplace,
      type_of_work: form.type_of_work,
      description: form.description,
      requirements: form.requirements,
      responsibilities: form.responsibilities,
      benefits: form.benefits,
      workday: form.workday,
      dayoff: form.dayoff,
      remark: form.remark,
    };
    
    const isEdit = mode === "edit";
    const url = isEdit ? `/recruitment/api/job_description/${initialData.id}` : "/recruitment/api/job_description";
    const method = isEdit ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.message || "บันทึกไม่สำเร็จ");
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
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "edit" ? "แก้ไขข้อมูลรายละเอียดงาน" : "บันทึกข้อมูลรายละเอียดงาน"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Branch */}
            <div>
              <label className="mb-2 block text-sm font-medium">Company</label>
              <Select
                mode="multiple"
                value={form.branch_id}
                placeholder="-- เลือก Company --"
                onChange={handleBranchChange}
                options={branches.map((item) => ({
                  value: item.id.toString(),
                  label: item.branch_name,
                }))}
                allowClear
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                styles={{
                  root: {
                    width: "100%",
                    border: "1px solid",
                    padding: "9px 16px",
                    borderRadius: "12px",
                    outlineStyle: "none",
                  },
                }}
              />
            </div>

            {/* Department */}
            <div>
              <label className="mb-2 block text-sm font-medium">Department</label>
              <select
                value={form.department_id}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
                disabled={deptDisabled}
              >
                <option value="">-- เลือก department --</option>
                {filteredDepartments.map((item) => (
                  <option key={item.id} value={item.id?.toString()}>{item.department_name}</option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="mb-2 block text-sm font-medium">Division</label>
              <select
                value={form.division_id}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
                disabled={divDisabled}
              >
                <option value="">-- เลือก division --</option>
                {filteredDivisions.map((item) => (
                  <option key={item.id} value={item.id?.toString()}>{item.division_name}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="mb-2 block text-sm font-medium">Unit</label>
              <select
                value={form.unit_id}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
                disabled={unitDisabled}
              >
                <option value="">-- เลือก unit --</option>
                {filteredUnits.map((item) => (
                  <option key={item.id} value={item.id?.toString()}>{item.unit_name}</option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="mb-2 block text-sm font-medium">Position</label>
              <select
                value={form.positions_id}
                onChange={(e) => updateField("positions_id", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
                disabled={posDisabled}
              >
                <option value="">-- เลือก position --</option>
                {filteredPositions.map((item) => (
                  <option key={item.id} value={item.id?.toString()}>
                    {item.position_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type of work */}
            <div>
              <label className="mb-2 block text-sm font-medium">รูปแบบในการจ้างงาน</label>
              <select
                value={form.type_of_work}
                onChange={(e) => updateField("type_of_work", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              >
                <option value="">-- เลือก รูปแบบการจ้างงาน --</option>
                {emptype.map((item) => (
                  <option key={item.id} value={item.id?.toString()}>{item.type_name}</option>
                ))}
              </select>
            </div>


            {/* Working day */}
            <div>
              <label className="mb-2 block text-sm font-medium">วันที่ทำงาน</label>
              <input
                type="text"
                value={form.workday}
                onChange={(e) => updateField("workday", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="วันที่ทำงาน"
              />
            </div>

            {/* Work Off */}
            <div>
              <label className="mb-2 block text-sm font-medium">วันหยุด</label>
              <input
                type="text"
                value={form.dayoff}
                onChange={(e) => updateField("dayoff", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="วันหยุด"
              />
            </div>


            {/* Work location */}
            <div>
              <label className="mb-2 block text-sm font-medium">สถานที่ปฎิบัติงาน</label>
              <input
                type="text"
                value={form.workplace}
                onChange={(e) => updateField("workplace", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="สถานที่ปฎิบัติงาน"
              />
            </div>

            <div />

            {/* Salary */}
            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-semibold text-gray-800"> การแสดงเงินเดือน </label>

              <div className="grid gap-4 md:grid-cols-2">
                {/* กรอกเงินเดือน */}
                <label
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200
                    ${
                      form.salary_mode === "range"
                        ? "border-blue-600 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="salary_mode"
                      value="range"
                      checked={form.salary_mode === "range"}
                      onChange={(e) => handleSalaryModeChange(e.target.value)}
                      className="mt-1 h-5 w-5 accent-blue-600"
                    />

                    <div>
                      <div className="font-semibold text-gray-900"> 💰 กรอกช่วงเงินเดือน </div>
                      <div className="mt-1 text-sm text-gray-500">
                        ระบุเงินเดือนขั้นต่ำและสูงสุด
                      </div>
                    </div>
                  </div>
                </label>

                {/* ไม่กรอกเงินเดือน */}
                <label
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200
                    ${
                      form.salary_mode === "negotiable"
                        ? "border-emerald-600 bg-emerald-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="salary_mode"
                      value="negotiable"
                      checked={form.salary_mode === "negotiable"}
                      onChange={(e) => handleSalaryModeChange(e.target.value)}
                      className="mt-1 h-5 w-5 accent-emerald-600"
                    />

                    <div>
                      <div className="font-semibold text-gray-900"> 🤝 ไม่ระบุเงินเดือน </div>
                      <div className="mt-1 text-sm text-gray-500">
                        แสดงข้อความแทนช่วงเงินเดือน
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {form.salary_mode === "range" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium"> เงินเดือนต่ำสุด </label>
                  <input
                    type="number"
                    value={form.salary_min}
                    onChange={(e) => updateField("salary_min", e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium"> เงินเดือนสูงสุด </label>
                  <input
                    type="number"
                    value={form.salary_max}
                    onChange={(e) => updateField("salary_max", e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              </>
            )}

            {form.salary_mode === "negotiable" && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium"> กรอกข้อมูลเงินเดือน </label>
                <input
                  type="text"
                  value={form.salary_note}
                  onChange={(e) => updateField("salary_note", e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  placeholder="เงินเดือนตามตกลง"
                />
              </div>
            )}
          </div>

          {/* Remark (localized per language) */}
          <LocalizedTextareaGroup
            title="Remark สำหรับแสดงหน้าแรก"
            value={form.remark}
            languages={languages}
            onChange={(langSlug, value) => updateLocalizedField("remark", langSlug, value)}
          />

          {/* Description (localized per language) */}
          <LocalizedTextareaGroup
            title="รายละเอียดงาน"
            value={form.description}
            languages={languages}
            onChange={(langSlug, value) => updateLocalizedField("description", langSlug, value)}
          />

          <div className="grid gap-4">
            <SectionList
              title="คุณสมบัติ"
              sectionKey="requirements"
              items={form.requirements}
              languages={languages}
              onAdd={() => addRow("requirements")}
              onRemove={(index) => removeRow("requirements", index)}
              onChange={(index, langSlug, value) => updateSection("requirements", index, langSlug, value)}
            />
            <SectionList
              title="หน้าที่ความรับผิดชอบ"
              sectionKey="responsibilities"
              items={form.responsibilities}
              languages={languages}
              onAdd={() => addRow("responsibilities")}
              onRemove={(index) => removeRow("responsibilities", index)}
              onChange={(index, langSlug, value) => updateSection("responsibilities", index, langSlug, value)}
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
            <button
              type="button"
              onClick={() => router.push("/recruitment/setting/job_description")}
              className="cursor-pointer rounded-lg px-4 py-2 font-medium text-black shadow-sm"
              style={{ backgroundColor: "orange" }}
            >
              ย้อนกลับ
            </button>
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

// A single localized field (not a repeatable list) rendered as one textarea per language.
// The resulting value is stored/saved as a plain JSON object, e.g. { "th": "...", "en": "..." }.
function LocalizedTextareaGroup({ title, value = {}, languages = [], onChange }) {
  return (
    <div>
      <h3 className="mb-4 text-base font-semibold">{title}</h3>
      <div className={`grid gap-3 ${languages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {languages.map((lang) => (
          <div key={lang.language_slug}>
            <label className="mb-2 block text-sm font-medium">
              {lang.language_name || lang.language_slug}
            </label>
            <textarea
              value={value[lang.language_slug] ?? ""}
              onChange={(e) => onChange(lang.language_slug, e.target.value)}
              rows={4}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder={`กรอก${title} (${lang.language_slug})`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionList({ title, sectionKey , items, languages = [], onAdd, onRemove, onChange }) {

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
          <div key={index} className="rounded-2xl border  p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">รายการที่ {index + 1}</p>
              <button type="button" onClick={() => onRemove(index)} className="rounded-xl border px-4 py-2 text-sm text-red-600">
                ลบ
              </button>
            </div>
            <div
              className={`grid gap-4 ${
                languages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {languages.map((lang) => (
                <div key={lang.language_slug}>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {lang.language_name || lang.language_slug}
                  </label>

                  <input
                    value={item.text?.[lang.language_slug] ?? ""}
                    onChange={(e) =>
                      onChange(index, lang.language_slug, e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder={`กรอก${title} (${lang.language_slug})`}
                  />
                </div>
              ))}

              {/* Sort Order */}
              <div>
                <label
                  htmlFor={`sort_order_${index}`}
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <span className="text-base">🔢</span>
                  ลำดับการแสดง
                </label>

                <input
                  id={`sort_order_${index}`}
                  type="number"
                  min="0"
                  value={item.sort_order ?? index+1}
                  onChange={(e) =>
                    onChange(index, "sort_order", Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="เช่น 1"
                />
              </div>

              {sectionKey === "requirements" && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id={`showpage_${index}`}
                      type="checkbox"
                      checked={item.showpage ?? false}
                      onChange={(e) =>
                        onChange(index, "showpage", e.target.checked)
                      }
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div>
                      <label
                        htmlFor={`showpage_${index}`}
                        className="text-sm font-medium text-gray-800"
                      >
                        แสดงในหน้าแรก
                      </label>

                      <p className="mt-1 text-xs text-gray-500">
                        เมื่อเปิดใช้งาน รายการนี้จะปรากฏบนหน้าแรก
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}