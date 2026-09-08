"use client";

import { useEffect, useState } from "react";

import { swalConfirm, swalError, swalSuccess } from "../../../components/Swal";
import LoadingOrb from "../../../components/LoadingOrb";
import useScopedPermissions from "@/hooks/useScopedPermissions";

import DepartmentFormModal from "./components/DepartmentFormModal";
import DepartmentHeader from "./components/DepartmentHeader";
import DepartmentMatrixView from "./components/DepartmentMatrixView";
import DepartmentSearch from "./components/DepartmentSearch";
import DepartmentTableView from "./components/DepartmentTableView";
import DepartmentViewSwitcher from "./components/DepartmentViewSwitcher";

const INITIAL_FORM = {
  code: "",
  name: "",
  department_color: "#E2E8F0",
  department_icon: "",
  branch_ids: [],
  status: "active",
};

function mapDepartment(department, fallback = {}) {
  return {
    id: department.id,
    code: department.department_code,
    name: department.department_name,
    branch_ids: department.branch_ids || fallback.branch_ids || [],
    branch_names: department.branch_names || fallback.branch_names || [],
    department_color:
      department.department_color ||
      fallback.department_color ||
      "#E2E8F0",
    department_icon:
      department.department_icon || fallback.department_icon || "",
    status: department.status || fallback.status || "active",
  };
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [openModal, setOpenModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [viewMode, setViewMode] = useState("matrix");

  const {
    user,
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canEditRecord,
    canDeleteRecord,
    hasAllScope,
    accessibleCompanyIds,
    accessibleBranchGroupIds,
    accessibleBranchIds,
  } = useScopedPermissions("ems.departments", {
    scopeType: "department",
  });

  const loadBranches = async () => {
    try {
      const response = await fetch(
        "/api/admin/branches?scope_context=ems.departments",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Load branches failed");
      }

      setBranches(payload.data || []);
    } catch (requestError) {
      console.error(requestError);
      swalError(requestError.message || "ไม่สามารถโหลดข้อมูลสังกัดได้");
    }
  };

  const loadDepartments = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/departments?search=${encodeURIComponent(keyword)}`
        : "/api/admin/departments";

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Load departments failed");
      }

      setDepartments((payload.data || []).map((item) => mapDepartment(item)));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    loadBranches();
  }, [
    loadingUser,
    user,
    canView,
    hasAllScope,
    accessibleCompanyIds,
    accessibleBranchGroupIds,
    accessibleBranchIds,
  ]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    const timer = setTimeout(() => {
      loadDepartments(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingDepartment(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (department) => {
    if (!canEditRecord(department)) {
      swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
      return;
    }

    setEditingDepartment(department);
    setForm({
      code: department.code || "",
      name: department.name || "",
      department_color: department.department_color || "#E2E8F0",
      department_icon: department.department_icon || "",
      branch_ids: department.branch_ids || [],
      status: department.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = Boolean(editingDepartment);

    if (isEdit && !canEditRecord(editingDepartment)) {
      swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
      return;
    }

    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสแผนกและชื่อแผนก");
      return;
    }

    if (!form.branch_ids.length) {
      swalError("กรุณาเลือกสังกัดอย่างน้อย 1 รายการ");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/departments/${editingDepartment.id}`
        : "/api/admin/departments";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department_code: form.code.trim(),
          department_name: form.name.trim(),
          department_color: form.department_color || "#E2E8F0",
          department_icon: form.department_icon || null,
          branch_ids: form.branch_ids,
          status: form.status,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Save failed");
      }

      const savedDepartment = mapDepartment(payload.data, {
        branch_ids: form.branch_ids,
        department_color: form.department_color,
        department_icon: form.department_icon,
        status: form.status,
      });

      if (isEdit) {
        setDepartments((previous) =>
          previous.map((item) =>
            item.id === savedDepartment.id ? savedDepartment : item
          )
        );
        swalSuccess("อัพเดทข้อมูลแผนกเรียบร้อยแล้ว");
      } else {
        setDepartments((previous) => [savedDepartment, ...previous]);
        swalSuccess("บันทึกข้อมูลแผนกเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (requestError) {
      console.error(requestError);
      swalError(requestError.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
    if (!canDeleteRecord(department)) {
      swalError("คุณไม่มีสิทธิ์ลบแผนก");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบแผนก "${department.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(department.id);

      const response = await fetch(`/api/admin/departments/${department.id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Delete failed");
      }

      setDepartments((previous) =>
        previous.filter((item) => item.id !== department.id)
      );

      swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
    } catch (requestError) {
      console.error(requestError);
      swalError(requestError.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  const canSubmitModal = editingDepartment
    ? canEditRecord(editingDepartment)
    : canCreate;

  return (
    <div className="space-y-6">
      <DepartmentHeader canCreate={canCreate} onCreate={handleOpenCreate} />

      <DepartmentSearch value={search} onChange={setSearch} />

      <DepartmentViewSwitcher value={viewMode} onChange={setViewMode} />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {viewMode === "table" && (
        <DepartmentTableView
          loading={loading}
          departments={departments}
          deletingId={deletingId}
          canEditRecord={canEditRecord}
          canDeleteRecord={canDeleteRecord}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {viewMode === "matrix" && (
        <DepartmentMatrixView
          loading={loading}
          departments={departments}
          branches={branches}
          deletingId={deletingId}
          canEdit={canEdit}
          canDelete={canDelete}
          canEditRecord={canEditRecord}
          canDeleteRecord={canDeleteRecord}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      <DepartmentFormModal
        open={openModal}
        form={form}
        setForm={setForm}
        branches={branches}
        editingDepartment={editingDepartment}
        saving={saving}
        canSubmit={canSubmitModal}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}
