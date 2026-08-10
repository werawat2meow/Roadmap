"use client";

import { useEffect, useMemo, useState } from "react";
import {swalConfirm,swalError,swalSuccess,} from "../../../components/Swal";
import { useRouter } from "next/navigation";
import LoadingOrb from "../../../components/LoadingOrb";
import {TaxIdField,EmailField,PhoneField,WebsiteField,AddressField,StatusSelect,SortOrderField,} from "@/app/components/forms";
import {isValidEmail,isValidThaiPhone,isValidThaiTaxId,isValidWebsite,normalizeThaiPhone,} from "@/lib/validators";

import useScopedPermissions from "@/hooks/useScopedPermissions";


const initialForm = {
  company_code: "",
  company_name_th: "",
  company_name_en: "",
  tax_id: "",
  branch_no: "",
  address: "",
  country_code: "TH",
  province_code: "",
  province: "",
  district_code: "",
  district: "",
  subdistrict_code: "",
  subdistrict: "",
  postcode: "",
  phone: "",
  email: "",
  website: "",
  logo_url: "",
  logo_path: "",
  status: "active",
  sort_order: 0,
};

function mapCompany(company) {
  return {
    id: company.id,
    company_code: company.company_code || "",
    company_name_th: company.company_name_th || "",
    company_name_en: company.company_name_en || "",
    tax_id: company.tax_id || "",
    branch_no: company.branch_no || "",
    address: company.address || "",
    country_code: company.country_code || "TH",
    province_code: company.province_code || "",
    province: company.province || "",
    district_code: company.district_code || "",
    district: company.district || "",
    subdistrict_code: company.subdistrict_code || "",
    subdistrict: company.subdistrict || "",
    postcode: company.postcode || "",
    phone: company.phone || "",
    email: company.email || "",
    website: company.website || "",
    logo_url: company.logo_url || "",
    logo_path: company.logo_path || "",
    status: company.status || "active",
    sort_order: Number(company.sort_order || 0),
    created_at: company.created_at,
    updated_at: company.updated_at,
  };
}

export default function CompaniesPage() {
  const router = useRouter();
  const {user,loadingUser,canView,canCreate,canEditRecord,canDeleteRecord,hasAllScope,accessibleIds,} = useScopedPermissions("ems.companies",{scopeType:"company"});
  
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

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

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateAddress = (value) => {
    setForm((prev) => ({
      ...prev,
      ...value,
    }));
  };

  const summary = useMemo(() => {
    return {
      total: companies.length,
      active: companies.filter((item) => item.status === "active").length,
      inactive: companies.filter((item) => item.status === "inactive").length,
    };
  }, [companies]);
    const loadCompanies = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }

      const res = await fetch(`/api/admin/companies?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Load companies failed");
      }

      setCompanies((result.data || []).map(mapCompany));
    } catch (err) {
      console.error(err);
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
    if (!canEditRecord(company)) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขบริษัทนี้"
      );
      return;
    }

    setEditingCompany(company);

    setForm({
      ...initialForm,
      ...company,
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const validateForm = () => {
    if (!form.company_code.trim() || !form.company_name_th.trim()) {
      swalError("กรุณากรอกรหัสบริษัทและชื่อบริษัท");
      return false;
    }

    if (form.tax_id && !isValidThaiTaxId(form.tax_id)) {
      swalError("เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง");
      return false;
    }

    if (form.email && !isValidEmail(form.email)) {
      swalError("กรุณากรอก Email ให้ถูกต้อง");
      return false;
    }

    if (form.website && !isValidWebsite(form.website)) {
      swalError("กรุณากรอก Website ให้ถูกต้อง");
      return false;
    }

    if (form.phone && !isValidThaiPhone(form.phone)) {
      swalError("กรุณากรอกเบอร์โทรศัพท์ประเทศไทยให้ถูกต้อง");
      return false;
    }

    if (form.email && !isValidEmail(form.email)) {
      swalError("กรุณากรอก Email ให้ถูกต้อง");
      return false;
    }

    if (form.website && !isValidWebsite(form.website)) {
      swalError("กรุณากรอก Website ให้ถูกต้อง");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      company_code: form.company_code.trim().toUpperCase(),
      company_name_th: form.company_name_th.trim(),
      company_name_en: form.company_name_en.trim() || null,

      tax_id: form.tax_id.trim() || null,
      branch_no: form.branch_no.trim() || null,

      address: form.address.trim() || null,
      country_code: form.country_code || "TH",
      province_code: form.province_code || null,
      district_code: form.district_code || null,
      subdistrict_code: form.subdistrict_code || null,
      province: form.province.trim() || null,
      district: form.district.trim() || null,
      subdistrict: form.subdistrict.trim() || null,
      postcode: form.postcode.trim() || null,

      phone: form.phone ? normalizeThaiPhone(form.phone) : null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,

      logo_url: form.logo_url.trim() || null,
      logo_path: form.logo_path.trim() || null,

      status: form.status || "active",
      sort_order: Number(form.sort_order || 0),
    };
  };

  const handleSave = async () => {
    const isEdit = !!editingCompany;

    if (isEdit && !canEditRecord(editingCompany)) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไขบริษัทนี้"
      );
      return;
    }
    //  

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มบริษัท");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/companies/${editingCompany.id}`
        : "/api/admin/companies";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Save failed");
      }

      const savedCompany = mapCompany(result.data);

      if (isEdit) {
        setCompanies((prev) =>
          prev.map((item) =>
            item.id === savedCompany.id ? savedCompany : item
          )
        );

        swalSuccess("อัปเดตข้อมูลบริษัทเรียบร้อยแล้ว");
      } else {
        setCompanies((prev) => [savedCompany, ...prev]);
        swalSuccess("บันทึกข้อมูลบริษัทเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    if (!canDeleteRecord(company)) {
      swalError(
        "คุณไม่มีสิทธิ์ลบบริษัทนี้"
      );
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบบริษัท "${company.company_name_th}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(company.id);

      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Delete failed");
      }

      setCompanies((prev) => prev.filter((item) => item.id !== company.id));
      swalSuccess("ลบข้อมูลบริษัทเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">บริษัท</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลนิติบุคคล สำหรับ HR, Payroll, ภาษี และ Accounting
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่มบริษัท
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">ทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {summary.total}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">ใช้งาน</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {summary.active}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">ไม่ใช้งาน</p>
          <p className="mt-2 text-3xl font-bold text-red-500">
            {summary.inactive}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหา: รหัสบริษัท / ชื่อบริษัท / Tax ID / Email / Website / ที่อยู่"
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"> 


          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
                <th className="px-6 py-4 text-left font-semibold">บริษัท</th>
                <th className="px-6 py-4 text-left font-semibold">ข้อมูลภาษี</th>
                <th className="px-6 py-4 text-left font-semibold">ติดต่อ</th>
                <th className="px-6 py-4 text-left font-semibold">ที่อยู่</th>
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
                        <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-52 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="ml-auto h-8 w-28 animate-pulse rounded-xl bg-slate-200" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : companies.length > 0 ? (
                companies.map((company, index) => (
                  <tr
                    key={company.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {company.company_code}
                      </div>

                      <div className="mt-1 font-medium text-slate-700">
                        {company.company_name_th || "-"}
                      </div>

                      <div className="text-xs text-slate-400">
                        {company.company_name_en || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div>
                        <span className="text-xs text-slate-400">
                          Tax ID:
                        </span>{" "}
                        {company.tax_id || "-"}
                      </div>

                      <div className="mt-1">
                        <span className="text-xs text-slate-400">
                          Branch:
                        </span>{" "}
                        {company.branch_no || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div>{company.phone || "-"}</div>
                      <div className="text-xs text-slate-400">
                        {company.email || "-"}
                      </div>
                      {company.website ? (
                        <div className="text-xs text-blue-600">
                          {company.website}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="max-w-xs truncate">
                        {company.address || "-"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {[
                          company.subdistrict,
                          company.district,
                          company.province,
                          company.postcode,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "-"}
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
                        {company.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {canEditRecord(company) ||
                      canDeleteRecord(company) ? (
                        <div className="flex justify-end gap-2">

                          {canEditRecord(company) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEdit(
                                  company
                                )
                              }
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDeleteRecord(company) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  company
                                )
                              }
                              disabled={
                                deletingId ===
                                company.id
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId ===
                                company.id
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId ===
                              company.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}

                        </div>
                      ) : (
                        <div className="text-right text-slate-400">
                          -
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
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
          <div className="modal-scrollbar max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCompany ? "แก้ไขบริษัท" : "เพิ่มบริษัท"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                ข้อมูลนิติบุคคลหลัก สำหรับ Payroll, Tax, Accounting และระบบ HR
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <h3 className="text-base font-bold text-slate-800">
                  ข้อมูลบริษัท
                </h3>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสบริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.company_code}
                  onChange={(e) =>
                    updateForm("company_code", e.target.value.toUpperCase())
                  }
                  placeholder="เช่น SKY"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อบริษัท (TH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.company_name_th}
                  onChange={(e) =>
                    updateForm("company_name_th", e.target.value)
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
                  value={form.company_name_en}
                  onChange={(e) =>
                    updateForm("company_name_en", e.target.value)
                  }
                  placeholder="เช่น SKYWORLD ADVENTURE CO., LTD."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="text-base font-bold text-slate-800">
                  ข้อมูลภาษี
                </h3>
              </div>

              <TaxIdField
                value={form.tax_id}
                onChange={(value) => updateForm("tax_id", value)}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  เลขที่สาขาภาษี
                </label>
                <input
                  type="text"
                  value={form.branch_no}
                  maxLength={5}
                  onChange={(e) =>
                    updateForm(
                      "branch_no",
                      e.target.value.replace(/\D/g, "").slice(0, 5)
                    )
                  }
                  placeholder="สำนักงานใหญ่ใช้ 00000"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="text-base font-bold text-slate-800">
                  ที่อยู่บริษัท
                </h3>
              </div>

              <div className="md:col-span-2">
                <AddressField
                  value={{
                    address: form.address,

                    country_code: form.country_code,

                    province_code: form.province_code,
                    province: form.province,

                    district_code: form.district_code,
                    district: form.district,

                    subdistrict_code: form.subdistrict_code,
                    subdistrict: form.subdistrict,

                    postcode: form.postcode,
                  }}
                  onChange={updateAddress}
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="text-base font-bold text-slate-800">
                  ข้อมูลติดต่อ
                </h3>
              </div>

              <PhoneField
                value={form.phone}
                onChange={(value) => updateForm("phone", value)}
              />

              <EmailField
                value={form.email}
                onChange={(value) => updateForm("email", value)}
              />

              <div className="md:col-span-2">
                <WebsiteField
                  value={form.website}
                  onChange={(value) => updateForm("website", value)}
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="text-base font-bold text-slate-800">
                  ตั้งค่าระบบ
                </h3>
              </div>

              <StatusSelect
                value={form.status}
                onChange={(value) => updateForm("status", value)}
              />

              <SortOrderField
                value={form.sort_order}
                onChange={(value) => updateForm("sort_order", value)}
              />
            </div>

            <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingCompany && canEditRecord(editingCompany)) || (!editingCompany && canCreate)) && 
                (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : editingCompany
                      ? "Update"
                      : "Save"}
                </button>
                )
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}  