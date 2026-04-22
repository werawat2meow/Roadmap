"use client";

import { useEffect, useState } from "react";
import { swalSuccess , swalError , swalConfirm} from "../../components/Swal";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { PhoneOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../components/LoadingOrb";

const initialForm = {
  code: "",
  name: "",
  company_id: "",
  phone: "",
  status: "active",
};

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [companies, setCompanies] = useState([]);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "branches.view");
  const canCreate = hasPermission(user, "branches.create");
  const canEdit = hasPermission(user, "branches.edit");
  const canDelete = hasPermission(user, "branches.delete");

  
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

  const loadCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load companies failed");
      }

      setCompanies(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBranches = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");
      const url = keyword ? `/api/admin/branches?search=${encodeURIComponent(keyword)}` : "/api/admin/branches";
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load branches failed");
      }

      const mapped = (data.data || []).map((branch) => ({
        id: branch.id,
        code: branch.branch_code,
        name: branch.branch_name,
        company_id: branch.company_id || "",
        company: branch.company_name || "",
        phone: branch.phone || "",
        status: branch.status,
      }));

      setBranches(mapped);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBranches(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingBranch(null);
    setPhoneError("");
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสาขา");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (branch) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสาขา");
      return;
    }
    setEditingBranch(branch);
    setForm({
      code: branch.code || "",
      name: branch.name || "",
      company_id: branch.company_id || "",
      phone: branch.phone || "",
      status: branch.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = !!editingBranch;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสาขา");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสาขา");
      return;
    }
    
    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสสังกัดและชื่อสังกัด");
      return;
    }

    if (form.phone && !isValidPhoneNumber(form.phone)) {
      swalError("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      return;
    }

    if(!form.company_id){
      swalError("กรุณาเลือกบริษัทให้ถูกต้อง");
      return;
    }

    try {
      setSaving(true);

      const isEdit = !!editingBranch;
      const url = isEdit ? `/api/admin/branches/${editingBranch.id}` : "/api/admin/branches";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_code: form.code.trim(),
          branch_name: form.name.trim(),
          company_id: form.company_id || null,
          phone: form.phone.trim(),
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      const savedBranch = {
        id: data.data.id,
        code: data.data.branch_code,
        name: data.data.branch_name,
        company_id: data.data.company_id || "",
        company: data.data.company_name || "",
        phone: data.data.phone || "",
        status: data.data.status,
      };

      if (isEdit) {
        setBranches((prev) =>
          prev.map((item) => (item.id === savedBranch.id ? savedBranch : item))
        );
        swalSuccess("ระบบอัพเดทข้อมูลเรียบร้อยแล้ว!");
      } else {
        setBranches((prev) => [savedBranch, ...prev]);
        swalSuccess("ระบบบันทึกข้อมูลเรียบร้อยแล้ว!");
      }

      handleCloseModal();
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการบันทึก");
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบสาขา");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบสังกัด "${branch.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(branch.id);

      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setBranches((prev) => prev.filter((item) => item.id !== branch.id));
      swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
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
            <h1 className="text-2xl font-bold text-slate-800">สาขา</h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการข้อมูลสังกัดของพนักงานในระบบ Employee Master
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบสาขาได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              + เพิ่มสาขา
            </button>
          )}
        </div>
      </div>

      {/* ค้นหา รหัสสังกัด / ชื่อ / บริษัท */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสสังกัด / ชื่อสังกัด / บริษัท"
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
                <th className="px-6 py-4 text-left font-semibold">รหัส</th>
                <th className="px-6 py-4 text-left font-semibold">ชื่อสาขา</th>
                <th className="px-6 py-4 text-left font-semibold">บริษัท</th>
                <th className="px-6 py-4 text-left font-semibold">เบอร์โทร</th>
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
                        <div className="h-3.5 w-12 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-24 animate-pulse rounded-md bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 w-20 animate-pulse rounded-md bg-slate-200" />
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
              ) : branches.length > 0 ? (
                branches.map((branch,index) => (
                  <tr
                    key={branch.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {branch.code}
                    </td>

                    <td className="px-6 py-4 text-slate-700">{branch.name}</td>

                    <td className="px-6 py-4 text-slate-600">
                      {branch.company || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {branch.phone || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          branch.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {branch.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {(canEdit || canDelete) ? (
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(branch)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(branch)}
                              disabled={deletingId === branch.id}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                deletingId === branch.id
                                  ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === branch.id ? "Deleting..." : "Delete"}
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
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลสังกัด
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Madal แสดงข้อมูล  */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBranch ? "แก้ไขสังกัด" : "เพิ่มสังกัด"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {editingBranch ? "ปรับปรุงข้อมูลสังกัด" : "กรอกข้อมูลสังกัดใหม่"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {/* สังกัด */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รหัสสังกัด
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
                  placeholder="เช่น HQ"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อสังกัด
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="เช่น Hanuman World"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  บริษัท
                </label>

                <select
                  value={form.company_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      company_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกบริษัท</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name_th}
                    </option>
                  ))}
                </select>
              </div>

              {/* เบอร์โทร */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  เบอร์โทร
                </label>

                <div
                  className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                    phoneError
                      ? "border-red-300 ring-4 ring-red-100"
                      : "border-slate-200 hover:border-slate-300 focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-100"
                  }`}
                >
                  {/* Left Icon */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
                    <PhoneOutlined className="text-base" />
                  </div>

                  {/* Divider */}
                  <div className="absolute left-[52px] top-3 bottom-3 w-px bg-slate-200" />

                  <div className="px-4 py-3">
                    <PhoneInput
                      international
                      defaultCountry="TH"
                      countryCallingCodeEditable={false}
                      value={form.phone}
                      onChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          phone: value || "",
                        }));

                        if (!value) {
                          setPhoneError("");
                          return;
                        }

                        const cleaned = value.replace(/[^0-9+]/g, "");

                        const isThaiPhoneValid =
                          /^0[0-9]{8,9}$/.test(cleaned) ||
                          /^\+66[0-9]{8,9}$/.test(cleaned);

                        if (!isThaiPhoneValid) {
                          setPhoneError("รูปแบบเบอร์โทรไม่ถูกต้อง");
                        } else {
                          setPhoneError("");
                        }
                      }}
                      placeholder="เช่น 0812345678 หรือ 07525466"
                      className="phone-input-modern w-full"
                    />
                  </div>
                </div>

                {phoneError ? (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <InfoCircleOutlined />
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    รองรับเบอร์มือถือ เบอร์บ้าน และเบอร์สำนักงาน
                  </p>
                )}
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

              {((editingBranch && canEdit) || (!editingBranch && canCreate)) && (
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
                  {saving ? "Saving..." : editingBranch ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}