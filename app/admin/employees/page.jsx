"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import { swalConfirm, swalError, swalSuccess } from "../../components/Swal";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

const initialForm = {
  first_name_th: "",
  last_name_th: "",
  first_name_en: "",
  last_name_en: "",
  nick_name: "",
  gender: "",
  phone: "",
  email: "",
  nationality: "thai",
  hire_date: "",
  employment_type: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  position_id: "",
  employee_status_id: "",
  employee_photo_url: "",
  status: "active",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]);

  // Partition
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);


  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "employees.view");
  const canCreate = hasPermission(user, "employees.create");
  const canEdit = hasPermission(user, "employees.edit");
  const canDelete = hasPermission(user, "employees.delete");

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

  const loadEmploymentTypes = async () => {
    const res = await fetch("/api/admin/employment-types", {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Load employment types failed");
    }

    setEmploymentTypes(data.data || []);
  };

  const loadBranches = async () => {
    const res = await fetch("/api/admin/branches", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load branches failed");
    setBranches(data.data || []);
  };

  const loadDepartments = async () => {
    const res = await fetch("/api/admin/departments", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load departments failed");
    setDepartments(data.data || []);
  };

  const loadDivisions = async () => {
    const res = await fetch("/api/admin/divisions?all=true", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load divisions failed");
    setDivisions(
      (data.data || []).map((item) => ({
        id: item.id,
        division_name: item.division_name,
        department_id: item.department_id,
        department_name: item.department_name || "",
        status: item.status,
      }))
    );
  };

  const loadUnits = async () => {
    const res = await fetch("/api/admin/units?all=true", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load units failed");
    setUnits(
      (data.data || []).map((item) => ({
        id: item.id,
        unit_name: item.unit_name,
        division_id: item.division_id,
        division_name: item.division_name || "",
        department_name: item.department_name || "",
        status: item.status,
      }))
    );
  };

  const loadPositions = async () => {
    const res = await fetch("/api/admin/positions?all=true", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load positions failed");
    setPositions(data.data || []);
  };

  const loadEmployees = async (keyword = "", currentPage = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (keyword) params.set("search", keyword);
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/employees?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load employees failed");
      }

      setEmployees(data.data || []);
      setPage(data.pagination?.page || 1);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeStatuses = async () => {
    const res = await fetch("/api/admin/employee-statuses", {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Load employee statuses failed");
    }

    setEmployeeStatuses(data.data || []);
  };

  useEffect(() => {
    Promise.all([
      loadBranches(),
      loadDepartments(),
      loadDivisions(),
      loadUnits(),
      loadPositions(),
      loadEmploymentTypes(),
      loadEmployeeStatuses(),
    ]).catch((err) => {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูล master ได้");
    });

    loadEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees(search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEmployee(null);
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลพนักงาน");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (employee) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน");
      return;
    }

    setEditingEmployee(employee);
    setForm({
      first_name_th: employee.first_name_th || "",
      last_name_th: employee.last_name_th || "",
      first_name_en: employee.first_name_en || "",
      last_name_en: employee.last_name_en || "",
      nick_name: employee.nick_name || "",
      gender: employee.gender || "",
      phone: employee.phone || "",
      email: employee.email || "",
      nationality: employee.nationality || "thai",
      hire_date: employee.hire_date || "",
      employment_type: employee.employment_type || "",
      branch_id: employee.branch_id || "",
      department_id: employee.department_id || "",
      division_id: employee.division_id || "",
      unit_id: employee.unit_id || "",
      position_id: employee.position_id || "",
      employee_status_id: employee.employee_status_id || "",
      employee_photo_url: employee.employee_photo_url || "",
      status: employee.status || "active",
    });
    setPhotoFile(null);
    setPhotoPreview(employee.employee_photo_url || "");
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const filteredDepartments = useMemo(() => {
    if (!form.branch_id) return departments;
    return departments.filter((dep) =>
      (dep.branch_ids || []).includes(form.branch_id)
    );
  }, [departments, form.branch_id]);

  const filteredDivisions = useMemo(() => {
    if (!form.department_id) return [];
    return divisions.filter((div) => div.department_id === form.department_id);
  }, [divisions, form.department_id]);

  const filteredUnits = useMemo(() => {
    if (!form.division_id) return [];
    return units.filter((unit) => unit.division_id === form.division_id);
  }, [units, form.division_id]);

  const handlePhotoChange = (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      swalError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      swalError("ไฟล์รูปต้องมีขนาดไม่เกิน 50 MB");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadEmployeePhoto = async (file, employeeId = "") => {
    if (!file) return form.employee_photo_url || "";

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", employeeId || "");

      const res = await fetch("/api/admin/employees/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Upload photo failed");
      }

      return data?.url || "";
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const isEdit = !!editingEmployee;
    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลพนักงาน");
      return;
    }

    if (!form.first_name_th.trim() || !form.last_name_th.trim()) {
      swalError("กรุณากรอกชื่อและนามสกุล");
      return;
    }

    if (!form.hire_date) {
      swalError("กรุณาเลือกวันที่เริ่มงาน");
      return;
    }

    if (!form.branch_id) {
      swalError("กรุณาเลือกสาขา");
      return;
    }

    if (!form.department_id) {
      swalError("กรุณาเลือกแผนก");
      return;
    }

    if (!form.division_id) {
      swalError("กรุณาเลือกฝ่าย");
      return;
    }

    if (!form.unit_id) {
      swalError("กรุณาเลือกหน่วยงาน");
      return;
    }

    if (!form.position_id) {
      swalError("กรุณาเลือกตำแหน่ง");
      return;
    }

    if (!form.nationality) {
      swalError("กรุณาเลือกสัญชาติ");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      swalError("กรุณากรอก Email ให้ถูกต้อง");
      return;
    }

    if (!form.employee_status_id) {
      swalError("กรุณาเลือกสถานะพนักงาน");
      return;
    }

    try {
      setSaving(true);

      let employeePhotoUrl = form.employee_photo_url || "";

      if (photoFile) {
        employeePhotoUrl = await uploadEmployeePhoto(
          photoFile,
          editingEmployee?.id || ""
        );
      }

      const payload = {
        ...form,
        employee_photo_url: employeePhotoUrl,
      };

      const url = isEdit
        ? `/api/admin/employees/${editingEmployee.id}`
        : "/api/admin/employees";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      if (isEdit) {
        setEmployees((prev) =>
          prev.map((item) => (item.id === data.data.id ? data.data : item))
        );
        swalSuccess("อัพเดทข้อมูลพนักงานเรียบร้อยแล้ว");
        await loadEmployees(search, page);
      } else {
        swalSuccess("เพิ่มข้อมูลพนักงานเรียบร้อยแล้ว");
        setPage(1);
        await loadEmployees(search, 1);
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูลพนักงาน");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบพนักงาน "${employee.full_name_th}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(employee.id);

      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setEmployees((prev) => prev.filter((item) => item.id !== employee.id));
      swalSuccess("ลบข้อมูลพนักงานเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  // #region Permission
  if (loadingUser) return null;
  if (!user) return null;
  if (!canView) return null;
  // #endregion

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">พนักงาน</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลพนักงานทั้งหมดในระบบ
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่มพนักงาน
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหาชื่อ / รหัสพนักงาน / สาขา / แผนก / ฝ่าย"
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
                <th className="px-6 py-4 text-left">รหัสพนักงาน</th>
                <th className="px-6 py-4 text-left">ชื่อ</th>
                <th className="px-6 py-4 text-left">สาขา</th>
                <th className="px-6 py-4 text-left">ฝ่าย</th>
                <th className="px-6 py-4 text-left">ตำแหน่ง</th>
                <th className="px-6 py-4 text-left">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-36 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : employees.length > 0 ? (
                employees.map((employee) => {
                  const isProtectedEmployee =
                    employee.employee_code === "EMP000001" ||
                    employee.full_name_th?.toLowerCase() === "system admin";

                  return (
                    <tr key={employee.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {employee.employee_code}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {employee.full_name_th}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {employee.branch_name || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {employee.division_name || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {employee.position_name || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.employee_status_color === "green"
                              ? "bg-green-100 text-green-700"
                              : employee.employee_status_color === "yellow"
                              ? "bg-yellow-100 text-yellow-700"
                              : employee.employee_status_color === "red"
                              ? "bg-red-100 text-red-600"
                              : employee.employee_status_color === "orange"
                              ? "bg-orange-100 text-orange-700"
                              : employee.employee_status_color === "blue"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {employee.employee_status_name || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {canEdit || canDelete ? (
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(employee)}
                                disabled={isProtectedEmployee}
                                className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                  isProtectedEmployee
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {isProtectedEmployee ? "Protected" : "Edit"}
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(employee)}
                                disabled={deletingId === employee.id || isProtectedEmployee}
                                className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                                  deletingId === employee.id || isProtectedEmployee
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                }`}
                              >
                                {deletingId === employee.id
                                  ? "Deleting..."
                                  : isProtectedEmployee
                                  ? "Protected"
                                  : "Delete"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-right text-slate-400">-</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    ไม่พบข้อมูลพนักงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              ทั้งหมด {total} รายการ
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => loadEmployees(search, page - 1)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>

              <span className="text-sm text-slate-600">
                หน้า {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => loadEmployees(search, page + 1)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  รูปพนักงาน
                </label>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Employee Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">ไม่มีรูป</span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                          Upload รูป
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                          />
                        </label>

                        {photoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview("");
                              setForm((prev) => ({ ...prev, employee_photo_url: "" }));
                            }}
                            className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            ลบรูป
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 50 MB
                      </p>

                      {uploadingPhoto && (
                        <p className="text-xs text-slate-500">กำลังอัปโหลดรูป...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">ชื่อ (TH)</label>
                <input
                  type="text"
                  value={form.first_name_th}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^ก-๙\s]/g, "");
                    setForm((prev) => ({ ...prev, first_name_th: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">นามสกุล (TH)</label>
                <input
                  type="text"
                  value={form.last_name_th}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^ก-๙\s]/g, "");
                    setForm((prev) => ({ ...prev, last_name_th: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">ชื่อ (EN)</label>
                <input
                  type="text"
                  value={form.first_name_en}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setForm((prev) => ({ ...prev, first_name_en: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">นามสกุล (EN)</label>
                <input
                  type="text"
                  value={form.last_name_en}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setForm((prev) => ({ ...prev, last_name_en: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">ชื่อเล่น</label>
                <input
                  type="text"
                  value={form.nick_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, nick_name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">เพศ</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกเพศ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">โทรศัพท์</label>
                <PhoneInput
                  defaultCountry="th"
                  forceDialCode={true}
                  disableFormatting={false}
                  value={form.phone}
                  onChange={(value) => {
                    let phone = value ?? "";
                    phone = phone.replace(/^\+660/, "+66");
                    setForm((prev) => ({ ...prev, phone }));
                  }}
                  inputClassName="!w-full !rounded-r-2xl !border-slate-300 !px-4 !py-3 !text-sm 
                    focus:!border-slate-500 focus:!ring-4 focus:!ring-slate-100 !h-auto"
                  countrySelectorStyleProps={{
                    buttonClassName: "!rounded-l-2xl !border-slate-300 !px-3 !h-auto !py-3",
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  placeholder="example@email.com"
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">สัญชาติ</label>
                <select
                  value={form.nationality}
                  onChange={(e) => setForm((prev) => ({ ...prev, nationality: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="thai">ไทย</option>
                  <option value="non_b">ต่างชาติ Non-B</option>
                  <option value="myanmar">สัญชาติพม่า</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">วันที่เริ่มงาน</label>
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, hire_date: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ประเภทการจ้าง
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      employment_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกประเภทการจ้าง</option>

                  {employmentTypes
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.type_code}>
                        {item.type_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">สาขา</label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกสาขา"
                  value={form.branch_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      branch_id: value ?? "",
                      department_id: "",
                      division_id: "",
                      unit_id: "",
                    }))
                  }
                  options={branches.map((b) => ({
                    value: b.id,
                    label: b.branch_name,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">แผนก</label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกแผนก"
                  value={form.department_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      department_id: value ?? "",
                      division_id: "",
                      unit_id: "",
                    }))
                  }
                  options={filteredDepartments.map((d) => ({
                    value: d.id,
                    label: d.department_name,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">ฝ่าย</label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกฝ่าย"
                  value={form.division_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      division_id: value ?? "",
                      unit_id: "",
                    }))
                  }
                  options={filteredDivisions.map((d) => ({
                    value: d.id,
                    label: `${d.division_name}${d.department_name ? ` (${d.department_name})` : ""}`,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">หน่วยงาน</label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกหน่วยงาน"
                  value={form.unit_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      unit_id: value ?? "",
                    }))
                  }
                  options={filteredUnits.map((u) => ({
                    value: u.id,
                    label: `${u.unit_name}${u.division_name ? ` (${u.division_name})` : ""}`,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">ตำแหน่ง</label>
                <Select
                  showSearch
                  allowClear
                  placeholder="เลือกตำแหน่ง"
                  value={form.position_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      position_id: value ?? "",
                    }))
                  }
                  options={positions.map((p) => ({
                    value: p.id,
                    label: `${p.position_name}${p.position_level ? ` (${p.position_level})` : ""}`,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะพนักงาน
                </label>
                <select
                  value={form.employee_status_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      employee_status_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกสถานะพนักงาน</option>

                  {employeeStatuses
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.status_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving || uploadingPhoto}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingEmployee && canEdit) || (!editingEmployee && canCreate)) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploadingPhoto}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving || uploadingPhoto
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving || uploadingPhoto
                    ? "Saving..."
                    : editingEmployee
                    ? "Update"
                    : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}