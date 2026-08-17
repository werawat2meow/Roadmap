"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emptyForm = {
  language_name: "",
  language_slug: "",
  language_img: "",
  status: true,
};

export default function LanguageForm({ languageId = null }) {
  const router = useRouter();
  const isEdit = Boolean(languageId);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const loadOne = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/recruitment/api/language/${languageId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "โหลดข้อมูลไม่สำเร็จ");
        }

        setForm({
          language_name: json.data.language_name ?? "",
          language_slug: json.data.language_slug ?? "",
          language_img: json.data.language_img ?? "",
          status: Boolean(json.data.status),
        });
      } catch (err) {
        setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    loadOne();
  }, [isEdit, languageId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const res = await fetch(
        isEdit ? `/recruitment/api/language/${languageId}` : "/recruitment/api/language",
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "บันทึกข้อมูลไม่สำเร็จ");
      }

      router.push("/recruitment/setting/language");
      router.refresh();
    } catch (err) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <div className="text-sm text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "แก้ไขข้อมูล Language" : "เพิ่มข้อมูล Language"}
          </h1>
          <p className="text-sm text-gray-500">
            จัดการข้อมูลใน table recruit_language
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                language_name
              </label>
              <input
                name="language_name"
                value={form.language_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                placeholder="เช่น English"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                language_slug
              </label>
              <input
                name="language_slug"
                value={form.language_slug}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                placeholder="เช่น en"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                language_img
              </label>
              <input
                name="language_img"
                value={form.language_img}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                placeholder="วาง URL รูปภาพ"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/language")}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}