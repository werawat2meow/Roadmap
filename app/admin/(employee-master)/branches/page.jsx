"use client";

import { useEffect, useState } from "react";
import { swalSuccess , swalError , swalConfirm} from "../../../components/Swal";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { PhoneOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import ImageCropModal from "../components/ImageCropModal";

const initialForm = {
  code: "",
  name: "",
  company_id: "",
  group_id: "",
  phone: "",
  status: "active",
  branch_image_url: "",
  branch_image_path: "",
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
  const [branchGroups, setBranchGroups] = useState([]);

  // crop image
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "ems.branches.view");
  const canCreate = hasPermission(user, "ems.branches.create");
  const canEdit = hasPermission(user, "ems.branches.edit");
  const canDelete = hasPermission(user, "ems.branches.delete");

  
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


  const loadBranchGroups = async () => {
    const res = await fetch("/api/admin/branch-groups");

    const data = await res.json();

    if (res.ok) {
      setBranchGroups(data.data || []);
    }
  };

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
        branch_image_url: branch.branch_image_url || "",
        branch_image_path: branch.branch_image_path || "",
        group_id: branch.group_id || "",
        group_name: branch.group_name || "",
        group_color: branch.group_color || "#E2E8F0",
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
    loadBranchGroups();
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
      swalError("คุณไม่มีสิทธิ์เพิ่มสังกัด");
      return;
    }
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (branch) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสังกัด");
      return;
    }
    setEditingBranch(branch);
    setForm({
      code: branch.code || "",
      name: branch.name || "",
      company_id: branch.company_id || "",
      phone: branch.phone || "",
      status: branch.status || "active",
      branch_image_url: branch.branch_image_url || "",
      branch_image_path: branch.branch_image_path || "",
      group_id: branch.group_id || "",
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
      swalError("คุณไม่มีสิทธิ์แก้ไขสังกัด");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสังกัด");
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
          phone: form.phone.trim() || null,
          status: form.status,
          branch_image_url: form.branch_image_url || null,
          branch_image_path: form.branch_image_path || null,
          group_id: form.group_id || null,
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
        branch_image_url: data.data.branch_image_url || null,
        branch_image_path: data.data.branch_image_path || null,
        group_id: data.data.group_id || "",
        group_name: data.data.group_name || "",
        group_color: data.data.group_color || "#E2E8F0",
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
      swalError("คุณไม่มีสิทธิ์ลบสังกัด");
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

  const handleUploadImage = async (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      swalError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      swalError("ขนาดไฟล์ต้องไม่เกิน 50MB");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("branchId", editingBranch?.id || "temp");

      const res = await fetch("/api/admin/branches/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "อัปโหลดรูปไม่สำเร็จ");
      }

      setForm((prev) => ({
        ...prev,
        branch_image_url: data.url,
        branch_image_path: data.path,
      }));

      swalSuccess("อัปโหลดรูปสำเร็จ");
    } catch (err) {
      swalError(err.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectImage = (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      swalError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      swalError("ขนาดไฟล์ต้องไม่เกิน 50MB");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result);
      setCropModalOpen(true);
    };

    reader.readAsDataURL(file);
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">แบรนด์</h1>
            <p className="text-sm text-slate-500 mt-1">
              จัดการข้อมูลแบรนด์ของบริษัท
            </p>
            {!canCreate && !canEdit && !canDelete ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                คุณมีสิทธิ์ดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบแบรนด์ได้
              </div>
            ) : null}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              + เพิ่มสังกัด
            </button>
          )}
        </div>
      </div>

      {/* ค้นหา รหัสสังกัด / ชื่อ / บริษัท */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหารหัสสังกัด / ชื่อสังกัด / ชื่อบริษัท"
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

      {/* Card Group By Company */}
      <div className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : branches.length > 0 ? (
          Object.entries(
            branches.reduce((acc, branch) => {
              const key = branch.company || "ไม่ระบุบริษัท";
              if (!acc[key]) acc[key] = [];
              acc[key].push(branch);
              return acc;
            }, {})
          ).map(([companyName, companyBranches]) => (
            <div
              key={companyName}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {companyName}
                  </h2>
                  <p className="text-sm text-slate-500">
                    ทั้งหมด {companyBranches.length} สังกัด
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
                {companyBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className="relative flex h-28 items-center justify-center"
                      style={{ backgroundColor: branch.group_color || "#F8FAFC" }}
                    >
                      {branch.group_name ? (
                        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow">
                          {branch.group_name}
                        </div>
                      ) : null}
                      
                      {branch.branch_image_url ? (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                          <img
                            src={branch.branch_image_url}
                            alt={branch.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                          ไม่มีรูป
                        </div>
                      )}

                      <span
                        className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                          branch.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {branch.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col space-y-2 p-4">
                      <div>
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                          {branch.code}
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-slate-800">
                          {branch.name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          เบอร์โทร: {branch.phone || "-"}
                        </p>
                      </div>

                      {(canEdit || canDelete) ? (
                        <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-4">
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
                                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {deletingId === branch.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-400 shadow-sm">
            ไม่พบข้อมูลสังกัด
          </div>
        )}
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

              {/* รูปภาพสังกัด */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รูปภาพสังกัด
                </label>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  {form.branch_image_url ? (
                    <div className="mb-4 flex h-48 w-full items-center justify-center rounded-2xl bg-white">
                      <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
                        <img
                          src={form.branch_image_url}
                          alt="Branch preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 flex h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400">
                      ยังไม่มีรูปภาพ
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleSelectImage(e.target.files?.[0])}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 50MB
                  </p>
                </div>
              </div>

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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  กลุ่มแบรนด์
                </label>

                <select
                  value={form.group_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      group_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกกลุ่มแบรนด์</option>
                  {branchGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.group_name}
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

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={imageSrc}
        aspect={1}
        saving={saving}
        onClose={() => {
          setCropModalOpen(false);
          setImageSrc("");
        }}
        onComplete={async (croppedFile) => {
          await handleUploadImage(croppedFile);
          setCropModalOpen(false);
          setImageSrc("");
        }}
      />
    </div>
  );
}
