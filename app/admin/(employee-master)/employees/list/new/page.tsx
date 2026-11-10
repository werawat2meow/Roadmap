"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  UserPlus,
} from "lucide-react";

type Item = Record<string, any>;
type Lists = Record<string, Item[]>;
const paths: Record<string, string> = {
  branches: "branches",
  departments: "departments",
  links: "branch-departments",
  divisions: "divisions",
  units: "units",
  positions: "positions",
  levels: "position-levels",
  titles: "titles",
  genders: "genders",
};
const initial = {
  employee_code: "",
  first_name_th: "",
  last_name_th: "",
  first_name_en: "",
  last_name_en: "",
  nickname_th: "",
  title_id: "",
  gender_id: "",
  birth_date: "",
  citizen_id: "",
  passport_no: "",
  start_work_date: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  position_id: "",
  new_position_name: "",
  position_level_id: "",
  employee_photo_url: "",
  employee_photo_path: "",
};

export function EmployeeForm({ employeeId }: { employeeId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [legacyCodes, setLegacyCodes] = useState<string[]>([""]);
  const [lists, setLists] = useState<Lists>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      ...Object.entries(paths).map(async ([key, path]) => {
        const scoped = ["titles", "genders"].includes(key)
          ? ""
          : "&scope_context=ems.employees";
        const response = await fetch(
          `/api/admin/${path}?all=true&status=active${scoped}`,
        );
        const json = await response.json();
        if (!response.ok || !json.success)
          throw new Error(json.error || `โหลด ${key} ไม่สำเร็จ`);
        return [
          key,
          Array.isArray(json.data)
            ? json.data
            : json.data?.items || json.items || [],
        ] as const;
      }),
      ...(employeeId ? [fetch(`/api/admin/employees/simple/${encodeURIComponent(employeeId)}`)
        .then(async (response) => {
          const json = await response.json();
          if (!response.ok || !json.success) throw new Error(json.error || "โหลดข้อมูลพนักงานไม่สำเร็จ");
          return json.data;
        })] : []),
    ])
      .then((entries) => {
        if (!active) return;
        setLists(Object.fromEntries(entries.slice(0, Object.keys(paths).length) as (readonly [string, Item[]])[]));
        if (employeeId) {
          const data = entries[entries.length - 1] as Item;
          setForm(Object.fromEntries(Object.keys(initial).map((key) => [
            key,
            key === "start_work_date"
              ? data.employee?.start_work_date ?? data.employee?.hire_date ?? ""
              : data.employee?.[key] ?? "",
          ])) as typeof initial);
          setLegacyCodes(data.legacy_codes?.length ? data.legacy_codes : [""]);
        }
      })
      .catch((reason) => {
        if (active) setError(reason.message || "โหลดข้อมูลไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [employeeId]);

  const departments = useMemo(
    () =>
      (lists.departments || []).filter((item) =>
        (lists.links || []).some(
          (link) =>
            link.branch_id === form.branch_id && link.department_id === item.id,
        ),
      ),
    [lists, form.branch_id],
  );
  const divisions = (lists.divisions || []).filter(
    (item) => item.department_id === form.department_id,
  );
  const units = (lists.units || []).filter(
    (item) => item.division_id === form.division_id,
  );
  const selectedPosition = (lists.positions || []).find(
    (item) => item.id === form.position_id,
  );
  const levels = (
    form.position_id === "__new__"
      ? lists.levels || []
      : selectedPosition?.levels || []
  ).filter((item: Item) => /^P\d+$/i.test(item.level_code || ""));

  function change(name: keyof typeof initial, value: string) {
    setForm((old) => ({
      ...old,
      [name]: value,
      ...(name === "branch_id"
        ? { department_id: "", division_id: "", unit_id: "" }
        : {}),
      ...(name === "department_id" ? { division_id: "", unit_id: "" } : {}),
      ...(name === "division_id" ? { unit_id: "" } : {}),
      ...(name === "position_id"
        ? { position_level_id: "", new_position_name: "" }
        : {}),
    }));
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/employees/upload-photo", {
        method: "POST",
        body: data,
      });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || "อัปโหลดรูปไม่สำเร็จ");
      setForm((old) => ({
        ...old,
        employee_photo_url: json.url,
        employee_photo_path: json.path,
      }));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "อัปโหลดรูปไม่สำเร็จ",
      );
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(employeeId
        ? `/api/admin/employees/simple/${encodeURIComponent(employeeId)}`
        : "/api/admin/employees/simple", {
        method: employeeId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          legacy_codes: legacyCodes
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || "บันทึกไม่สำเร็จ");
      router.push("/admin/employees/list");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const input = (
    label: string,
    name: keyof typeof initial,
    required = false,
    type = "text",
  ) => (
    <label className="block text-sm font-semibold text-slate-900">
      {label}
      {required && <span className="text-red-500"> *</span>}
      <input
        type={type}
        required={required}
        value={form[name]}
        onChange={(event) => change(name, event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
  const select = (
    label: string,
    name: keyof typeof initial,
    items: Item[],
    key: string,
    required = false,
  ) => (
    <label className="block text-sm font-semibold text-slate-900">
      {label}
      {required && <span className="text-red-500"> *</span>}
      <select
        required={required}
        value={form[name]}
        onChange={(event) => change(name, event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">เลือก{label}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {String(item[key] || item.level_name || item.level_code || "")}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <main className="min-h-screen bg-[#F9F5F2] px-4 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/admin/employees/list")}
          className="mb-5 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={18} /> กลับไปรายชื่อพนักงาน
        </button>
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <UserPlus size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{employeeId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}</h1>
            <p className="text-sm text-slate-500">
              กรอกข้อมูลที่จำเป็นในหน้าเดียว
            </p>
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 px-5 py-4 text-red-700"
          >
            {error}
          </div>
        )}
        {loading ? (
          <p className="rounded-2xl bg-white p-8">กำลังโหลดข้อมูล...</p>
        ) : (
          <form onSubmit={save} className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold">รหัสและรูปพนักงาน</h2>
              <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
                <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-slate-600 hover:border-emerald-500">
                  {form.employee_photo_url ? (
                    <img
                      src={form.employee_photo_url}
                      alt="รูปพนักงาน"
                      className="h-28 w-28 rounded-full object-cover"
                    />
                  ) : (
                    <UploadCloud size={34} />
                  )}
                  <span>
                    {uploading
                      ? "กำลังอัปโหลด..."
                      : "เลือกรูปพนักงาน (ไม่บังคับ)"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadPhoto}
                    className="sr-only"
                  />
                </label>
                <div className="space-y-4">
                  {input("รหัสพนักงานปัจจุบัน", "employee_code", true)}
                  <div>
                    <p className="mb-2 text-sm font-semibold">
                      รหัสพนักงานเก่า (เพิ่มได้หลายรหัส)
                    </p>
                    <div className="space-y-2">
                      {legacyCodes.map((code, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            aria-label={`รหัสพนักงานเก่าลำดับที่ ${index + 1}`}
                            value={code}
                            onChange={(event) =>
                              setLegacyCodes((old) =>
                                old.map((value, i) =>
                                  i === index ? event.target.value : value,
                                ),
                              )
                            }
                            className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-base text-slate-950"
                            placeholder="กรอกรหัสเก่า"
                          />
                          <button
                            type="button"
                            aria-label="ลบรหัสเก่านี้"
                            onClick={() =>
                              setLegacyCodes((old) =>
                                old.length === 1
                                  ? [""]
                                  : old.filter((_, i) => i !== index),
                              )
                            }
                            className="cursor-pointer rounded-xl border border-red-200 px-4 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLegacyCodes((old) => [...old, ""])}
                      className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-300 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus size={17} /> เพิ่มรหัสเก่า
                    </button>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold">ข้อมูลส่วนตัว</h2>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {select(
                  "คำนำหน้า (ไทย / อังกฤษ)",
                  "title_id",
                  (lists.titles || []).map((item) => ({
                    ...item,
                    display_name: [item.title_name_th, item.title_name_en]
                      .filter(Boolean)
                      .join(" / "),
                  })),
                  "display_name",
                )}
                {input("ชื่อภาษาไทย", "first_name_th", true)}
                {input("นามสกุลภาษาไทย", "last_name_th", true)}
                {input("ชื่อภาษาอังกฤษ", "first_name_en")}
                {input("นามสกุลภาษาอังกฤษ", "last_name_en")}
                {input("ชื่อเล่น", "nickname_th")}
                {select(
                  "เพศ",
                  "gender_id",
                  lists.genders || [],
                  "gender_name_th",
                )}
                {input("วันเกิด", "birth_date", false, "date")}
                {input("เลขบัตรประชาชน", "citizen_id")}
                {input("เลขพาสปอร์ต", "passport_no")}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold">ตั้งค่าสังกัด</h2>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {input("วันที่เริ่มงาน", "start_work_date", true, "date")}
                {select(
                  "สังกัด",
                  "branch_id",
                  lists.branches || [],
                  "branch_name",
                  true,
                )}
                {select(
                  "แผนก",
                  "department_id",
                  departments,
                  "department_name",
                  true,
                )}
                {select("ฝ่าย", "division_id", divisions, "division_name")}
                {select("หน่วย", "unit_id", units, "unit_name")}
                <label className="block text-sm font-semibold text-slate-900">
                  ตำแหน่ง<span className="text-red-500"> *</span>
                  <select
                    required
                    value={form.position_id}
                    onChange={(event) =>
                      change("position_id", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">เลือกตำแหน่ง</option>
                    {(lists.positions || []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.position_name}
                      </option>
                    ))}
                    <option value="__new__">+ เพิ่มตำแหน่งใหม่</option>
                  </select>
                </label>
                {select(
                  "Level P",
                  "position_level_id",
                  levels,
                  "level_code",
                  true,
                )}
                {form.position_id === "__new__" && (
                  <div className="lg:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    {input("ชื่อตำแหน่งใหม่", "new_position_name", true)}
                  </div>
                )}
              </div>
            </section>
            <div className="flex flex-wrap justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => router.push("/admin/employees/list")}
                className="h-12 cursor-pointer rounded-xl border border-slate-300 bg-white px-7 font-bold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-8 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={18} /> {saving ? "กำลังบันทึก..." : employeeId ? "บันทึกการแก้ไข" : "บันทึกพนักงาน"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function NewEmployeePage() {
  return <EmployeeForm />;
}
