"use client";

import { useEffect, useState } from "react";
import { swalSuccess, swalError, swalConfirm,} from "../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  code: "",
  name_th: "",
  name_en: "",
  tax_id: "",
  phone: "",
  email: "",
  status: "active",
};

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "companies.view");
  const canCreate = hasPermission(user, "companies.create");
  const canEdit = hasPermission(user, "companies.edit");
  const canDelete = hasPermission(user, "companies.delete");

  
  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, canView, loadingUser, router]);
  // #endregion

  const loadCompanies = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/companies?search=${encodeURIComponent(keyword)}`
        : "/api/admin/companies";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load companies failed");
      }

      const mapped = (data.data || []).map((company) => ({
        id: company.id,
        code: company.company_code,
        name_th: company.company_name_th,
        name_en: company.company_name_en || "",
        tax_id: company.tax_id || "",
        phone: company.phone || "",
        email: company.email || "",
        status: company.status,
      }));

      setCompanies(mapped);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanies(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCompany(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มบริษัท");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (company) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขบริษัท");
      return;
    }
    setEditingCompany(company);
    setForm({
      code: company.code || "",
      name_th: company.name_th || "",
      name_en: company.name_en || "",
      tax_id: company.tax_id || "",
      phone: company.phone || "",
      email: company.email || "",
      status: company.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {

    const isEdit = !!editingCompany;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขบริษัท");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มบริษัท");
      return;
    }

    if (!form.code.trim() || !form.name_th.trim()) {
      swalError("กรุณากรอกรหัสบริษัทและชื่อบริษัท");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingCompany;
      const url = isEdit
        ? `/api/admin/companies/${editingCompany.id}`
        : "/api/admin/companies";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_code: form.code.trim(),
          company_name_th: form.name_th.trim(),
          company_name_en: form.name_en.trim(),
          tax_id: form.tax_id.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedCompany = {
        id: data.data.id,
        code: data.data.company_code,
        name_th: data.data.company_name_th,
        name_en: data.data.company_name_en || "",
        tax_id: data.data.tax_id || "",
        phone: data.data.phone || "",
        email: data.data.email || "",
        status: data.data.status,
      };

      if (isEdit) {
        setCompanies((prev) =>
          prev.map((item) => (item.id === savedCompany.id ? savedCompany : item))
        );
        swalSuccess("อัปเดตข้อมูลบริษัทเรียบร้อยแล้ว");
      } else {
        setCompanies((prev) => [savedCompany, ...prev]);
        swalSuccess("บันทึกข้อมูลบริษัทเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบบริษัท");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบบริษัท "${company.name_th}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(company.id);

      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setCompanies((prev) => prev.filter((item) => item.id !== company.id));
      swalSuccess("ลบข้อมูลบริษัทเรียบร้อยแล้ว");
    } catch (err) {
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">บริษัท</h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการข้อมูลบริษัทสำหรับใช้เชื่อมกับสังกัดในระบบ Employee Master
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบบริษัทได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              + เพิ่มบริษัท
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสบริษัท / ชื่อบริษัท / เลขผู้เสียภาษี"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
                <th className="px-6 py-4 text-left font-semibold">รหัส</th>
                <th className="px-6 py-4 text-left font-semibold">ชื่อบริษัท</th>
                <th className="px-6 py-4 text-left font-semibold">เลขภาษี</th>
                <th className="px-6 py-4 text-left font-semibold">ติดต่อ</th>
                <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-16 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-48 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-28 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <div className="h-7 w-11 animate-pulse rounded-xl bg-slate-200" />
                          <div className="h-7 w-14 animate-pulse rounded-xl bg-slate-200" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : companies.length > 0 ? (
                companies.map((company , index) => (
                  <tr
                    key={company.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-center text-slate-500 text-sm">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {company.code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-medium">{company.name_th}</div>
                      <div className="text-xs text-slate-400">
                        {company.name_en || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {company.tax_id || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div>{company.phone || "-"}</div>
                      <div className="text-xs text-slate-400">
                        {company.email || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          company.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {company.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(company)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(company)}
                              disabled={deletingId === company.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === company.id
                                  ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === company.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-right text-slate-400">-</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลบริษัท
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCompany ? "แก้ไขบริษัท" : "เพิ่มบริษัท"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {editingCompany ? "ปรับปรุงข้อมูลบริษัท" : "กรอกข้อมูลบริษัทใหม่"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสบริษัท
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  placeholder="เช่น SKY"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อบริษัท (TH)
                </label>
                <input
                  type="text"
                  value={form.name_th}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name_th: e.target.value,
                    }))
                  }
                  placeholder="เช่น บริษัท สกายเวิลด์ แอดเวนเจอร์ จำกัด"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อบริษัท (EN)
                </label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name_en: e.target.value,
                    }))
                  }
                  placeholder="เช่น SKYWORLD ADVENTURE CO., LTD."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  เลขผู้เสียภาษี
                </label>
                <input
                  type="text"
                  value={form.tax_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tax_id: e.target.value,
                    }))
                  }
                  placeholder="เช่น 0123456789012"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  เบอร์โทร
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="เช่น 076-123-456"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="เช่น contact@company.com"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะ
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingCompany && canEdit) || (!editingCompany && canCreate)) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving ? "Saving..." : editingCompany ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}