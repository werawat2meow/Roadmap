"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import { swalSuccess, swalError, swalConfirm } from "../../../components/Swal";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";

const initialForm = {
  employee_id: "",
  management_level: "",
  scope_type: "",
  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  supervisor_employee_id: "",
  is_primary: true,
  status: "active",
  sort_order: 0,
};

const managementLevels = ["P9", "P10", "P11", "P12"];

const scopeOptions = [
  { value: "all", label: "ทั้งหมด / Entire Organization" },
  { value: "company", label: "บริษัท / Company" },
  { value: "branch_group", label: "กรุ๊ปสังกัด / Branch Group" },
  { value: "branch", label: "สังกัด / Branch" },
  { value: "department", label: "แผนก / Department" },
  { value: "division", label: "ฝ่าย / Division" },
  { value: "unit", label: "หน่วยงาน / Unit" },
];

export default function ManagementAssignmentsPage() {
  const [search, setSearch] = useState("");
  const [assignments, setAssignments] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [branchGroups, setBranchGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewMode, setViewMode] = useState("orgchart");
  
  // #region Permissions
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.management_assignments.view");
  const canCreate = hasPermission(user, "ems.management_assignments.create");
  const canEdit = hasPermission(user, "ems.management_assignments.edit");
  const canDelete = hasPermission(user, "ems.management_assignments.delete");
  // #endregion

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

  const loadAssignments = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/management-assignments?search=${encodeURIComponent(keyword)}`
        : "/api/admin/management-assignments";

      const res = await fetch(url, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load management assignments failed");
      }

      setAssignments(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadMasters = async () => {
    try {
      const [
        employeesRes,
        companiesRes,
        groupsRes,
        branchesRes,
        departmentsRes,
        divisionsRes,
        unitsRes,
      ] = await Promise.all([
        fetch("/api/admin/employees?page=1&pageSize=200", { cache: "no-store" }),
        fetch("/api/admin/companies", { cache: "no-store" }),
        fetch("/api/admin/branch-groups", { cache: "no-store" }),
        fetch("/api/admin/branches", { cache: "no-store" }),
        fetch("/api/admin/departments?all=true", { cache: "no-store" }),
        fetch("/api/admin/divisions?all=true", { cache: "no-store" }),
        fetch("/api/admin/units?all=true", { cache: "no-store" }),
      ]);

      const [
        employeesData,
        companiesData,
        groupsData,
        branchesData,
        departmentsData,
        divisionsData,
        unitsData,
      ] = await Promise.all([
        employeesRes.json(),
        companiesRes.json(),
        groupsRes.json(),
        branchesRes.json(),
        departmentsRes.json(),
        divisionsRes.json(),
        unitsRes.json(),
      ]);

      if (!employeesRes.ok) throw new Error(employeesData?.error || "Load employees failed");
      if (!companiesRes.ok) throw new Error(companiesData?.error || "Load companies failed");
      if (!groupsRes.ok) throw new Error(groupsData?.error || "Load branch groups failed");
      if (!branchesRes.ok) throw new Error(branchesData?.error || "Load branches failed");
      if (!departmentsRes.ok) throw new Error(departmentsData?.error || "Load departments failed");
      if (!divisionsRes.ok) throw new Error(divisionsData?.error || "Load divisions failed");
      if (!unitsRes.ok) throw new Error(unitsData?.error || "Load units failed");

      setEmployees(employeesData.data || []);
      setCompanies(companiesData.data || []);
      setBranchGroups(groupsData.data || []);
      setBranches(branchesData.data || []);
      setDepartments(departmentsData.data || []);
      setDivisions(divisionsData.data || []);
      setUnits(unitsData.data || []);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูล Master ได้");
    }
  };

  useEffect(() => {
    loadMasters();
    loadAssignments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssignments(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);
    const resetForm = () => {
    setForm(initialForm);
    setEditingAssignment(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสายบังคับบัญชา");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสายบังคับบัญชา");
      return;
    }

    setEditingAssignment(item);
    setForm({
      employee_id: item.employee_id || "",
      management_level: item.management_level || "",
      scope_type: item.scope_type || "",
      company_id: item.company_id || "",
      branch_group_id: item.branch_group_id || "",
      branch_id: item.branch_id || "",
      department_id: item.department_id || "",
      division_id: item.division_id || "",
      unit_id: item.unit_id || "",
      supervisor_employee_id: item.supervisor_employee_id || "",
      is_primary: item.is_primary ?? true,
      status: item.status || "active",
      sort_order: item.sort_order || 0,
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const clearScopeByType = (scopeType) => {
    setForm((prev) => ({
      ...prev,
      scope_type: scopeType,
      company_id: "",
      branch_group_id: "",
      branch_id: "",
      department_id: "",
      division_id: "",
      unit_id: "",
    }));
  };

  const handleSave = async () => {
    const isEdit = !!editingAssignment;

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขสายบังคับบัญชา");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มสายบังคับบัญชา");
      return;
    }

    if (!form.employee_id) {
      swalError("กรุณาเลือกพนักงาน");
      return;
    }

    if (!form.management_level) {
      swalError("กรุณาเลือกระดับผู้บริหาร");
      return;
    }

    if (!form.scope_type) {
      swalError("กรุณาเลือกขอบเขตการดูแล");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/management-assignments/${editingAssignment.id}`
        : "/api/admin/management-assignments";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      swalSuccess(
        isEdit
          ? "อัพเดทสายบังคับบัญชาเรียบร้อยแล้ว"
          : "บันทึกสายบังคับบัญชาเรียบร้อยแล้ว"
      );

      handleCloseModal();
      await loadAssignments(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบสายบังคับบัญชา");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบสายบังคับบัญชาของ "${item.employee_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      const res = await fetch(`/api/admin/management-assignments/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      swalSuccess("ลบสายบังคับบัญชาเรียบร้อยแล้ว");
      await loadAssignments(search);
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const getScopeLabel = (item) => {
    if (item.scope_type === "all") return "Entire Organization";
    if (item.scope_type === "company") return item.company_name || "-";
    if (item.scope_type === "branch_group") return item.branch_group_name || "-";
    if (item.scope_type === "branch") return item.branch_name || "-";
    if (item.scope_type === "department") return item.department_name || "-";
    if (item.scope_type === "division") return item.division_name || "-";
    if (item.scope_type === "unit") return item.unit_name || "-";
    return "-";
  };

  const levelGroups = useMemo(() => {
    return {
      P12: assignments.filter((item) => item.management_level === "P12"),
      P11: assignments.filter((item) => item.management_level === "P11"),
      P10: assignments.filter((item) => item.management_level === "P10"),
      P9: assignments.filter((item) => item.management_level === "P9"),
    };
  }, [assignments]);

  const renderScopeField = () => {
    if (!form.scope_type || form.scope_type === "all") return null;

    if (form.scope_type === "company") {
      return (
        <Select
          showSearch
          allowClear
          placeholder="เลือกบริษัท"
          value={form.company_id || undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, company_id: value || "" }))
          }
          options={companies.map((c) => ({
            value: c.id,
            label: c.company_name_th || c.company_name_en,
          }))}
          size="large"
        />
      );
    }

    if (form.scope_type === "branch_group") {
      return (
        <Select
          showSearch
          allowClear
          placeholder="เลือกกรุ๊ปสังกัด"
          value={form.branch_group_id || undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, branch_group_id: value || "" }))
          }
          options={branchGroups.map((g) => ({
            value: g.id,
            label: g.group_name,
          }))}
          size="large"
        />
      );
    }

    if (form.scope_type === "branch") {
      return (
        <Select
          showSearch
          allowClear
          placeholder="เลือกสังกัด"
          value={form.branch_id || undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, branch_id: value || "" }))
          }
          options={branches.map((b) => ({
            value: b.id,
            label: b.branch_name,
          }))}
          size="large"
        />
      );
    }

    if (form.scope_type === "department") {
      return (
        <Select
          showSearch
          allowClear
          placeholder="เลือกแผนก"
          value={form.department_id || undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, department_id: value || "" }))
          }
          options={departments.map((d) => ({
            value: d.id,
            label: d.department_name,
          }))}
          size="large"
        />
      );
    }

    if (form.scope_type === "division") {
      return (
        <Select
          showSearch
          allowClear
          placeholder="เลือกฝ่าย"
          value={form.division_id || undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, division_id: value || "" }))
          }
          options={divisions.map((d) => ({
            value: d.id,
            label: d.division_name,
          }))}
          size="large"
        />
      );
    }

    if (form.scope_type === "unit") {
      return (
        <Select
          showSearch
          allowClear
          placeholder="เลือกหน่วยงาน"
          value={form.unit_id || undefined}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, unit_id: value || "" }))
          }
          options={units.map((u) => ({
            value: u.id,
            label: u.unit_name,
          }))}
          size="large"
        />
      );
    }

    return null;
  };
  

  console.log("user", assignments);
  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              สายบังคับบัญชา
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              กำหนดโครงสร้างผู้บริหารแบบ Tree / Org Chart ตาม P9 - P12
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + เพิ่มสายบังคับบัญชา
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหา: พนักงาน / ระดับ / ขอบเขต / ผู้บังคับบัญชา"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setViewMode("orgchart")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            viewMode === "orgchart"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-600"
          }`}
        >
          Org Chart
        </button>

        <button
          type="button"
          onClick={() => setViewMode("tree")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            viewMode === "tree"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-600"
          }`}
        >
          Tree View
        </button>

        <button
          type="button"
          onClick={() => setViewMode("table")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            viewMode === "table"
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-600"
          }`}
        >
          Table View
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {viewMode === "orgchart" && (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="min-w-[1100px]">
            {["P12", "P11", "P10", "P9"].map((level, levelIndex) => (
              <div key={level} className="relative">
                <div className="mb-8 flex justify-center gap-6">
                  {(levelGroups[level] || []).length > 0 ? (
                    levelGroups[level].map((item) => (
                      <div key={item.id} className="relative">
                        {levelIndex > 0 && (
                          <div className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-slate-300" />
                        )}

                        <div
                          className="w-72 rounded-3xl border bg-white p-4 shadow-sm"
                          style={{
                            borderColor:
                              item.branch_group_color ||
                              item.department_color ||
                              "#CBD5E1",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                {item.management_level}
                              </span>

                              <h3 className="mt-3 text-base font-bold text-slate-800">
                                {item.employee_name}
                              </h3>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.employee_code || "-"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              ⋮
                            </button>
                          </div>

                          <div
                            className="mt-4 rounded-2xl px-4 py-3 text-sm"
                            style={{
                              backgroundColor:
                                item.branch_group_color ||
                                item.department_color ||
                                "#E2E8F0",
                            }}
                          >
                            <p className="text-xs font-semibold text-slate-500">
                              {item.scope_type}
                            </p>
                            <p className="mt-1 font-bold text-slate-800">
                              {getScopeLabel(item)}
                            </p>
                          </div>

                          {item.supervisor_name ? (
                            <p className="mt-3 text-xs text-slate-500">
                              Reports to:{" "}
                              <span className="font-semibold">
                                {item.supervisor_name}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-72 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-400">
                      ยังไม่มีข้อมูล {level}
                    </div>
                  )}
                </div>

                {levelIndex < 3 && (
                  <div className="mx-auto mb-8 h-8 w-px bg-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "tree" && (
        <div className="space-y-5">
          {["P12", "P11", "P10", "P9"].map((level) => (
            <div
              key={level}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{level}</h2>
                  <p className="text-sm text-slate-500">
                    ทั้งหมด {levelGroups[level]?.length || 0} รายการ
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-36 animate-pulse rounded-3xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : levelGroups[level]?.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {levelGroups[level].map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                            {item.management_level}
                          </div>

                          <h3 className="mt-3 text-base font-bold text-slate-800">
                            {item.employee_name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.employee_code || "-"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {item.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div
                        className="mt-4 rounded-2xl px-4 py-3 text-sm"
                        style={{
                          backgroundColor:
                            item.branch_group_color ||
                            item.department_color ||
                            "#E2E8F0",
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-500">
                          Scope: {item.scope_type}
                        </p>
                        <p className="mt-1 font-bold text-slate-800">
                          {getScopeLabel(item)}
                        </p>
                      </div>

                      {item.supervisor_name ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Supervisor:{" "}
                          <span className="font-semibold">
                            {item.supervisor_name}
                          </span>
                        </p>
                      ) : null}

                      {(canEdit || canDelete) && (
                        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-3">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              {deletingId === item.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
                  ยังไม่มีข้อมูลระดับ {level}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left">พนักงาน</th>
                  <th className="px-6 py-4 text-left">Level</th>
                  <th className="px-6 py-4 text-left">Scope</th>
                  <th className="px-6 py-4 text-left">ผู้บังคับบัญชา</th>
                  <th className="px-6 py-4 text-left">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {item.employee_name}
                    </td>
                    <td className="px-6 py-4">{item.management_level}</td>
                    <td className="px-6 py-4">
                      {item.scope_type} / {getScopeLabel(item)}
                    </td>
                    <td className="px-6 py-4">
                      {item.supervisor_name || "-"}
                    </td>
                    <td className="px-6 py-4">{item.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAssignment
                  ? "แก้ไขสายบังคับบัญชา"
                  : "เพิ่มสายบังคับบัญชา"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  พนักงาน
                </label>
                <Select
                  showSearch
                  allowClear
                  value={form.employee_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, employee_id: value || "" }))
                  }
                  options={employees.map((e) => ({
                    value: e.id,
                    label:
                      `${e.employee_code || ""} - ${
                        e.full_name_th ||
                        `${e.first_name_th || ""} ${e.last_name_th || ""}`
                      }`.trim(),
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Management Level
                </label>
                <Select
                  value={form.management_level || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      management_level: value || "",
                    }))
                  }
                  options={managementLevels.map((level) => ({
                    value: level,
                    label: level,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Scope Type
                </label>
                <Select
                  value={form.scope_type || undefined}
                  onChange={(value) => clearScopeByType(value || "")}
                  options={scopeOptions}
                  className="w-full"
                  size="large"
                />
              </div>

              {form.scope_type && form.scope_type !== "all" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Scope Target
                  </label>
                  {renderScopeField()}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Supervisor
                </label>
                <Select
                  showSearch
                  allowClear
                  value={form.supervisor_employee_id || undefined}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      supervisor_employee_id: value || "",
                    }))
                  }
                  options={employees.map((e) => ({
                    value: e.id,
                    label:
                      `${e.employee_code || ""} - ${
                        e.full_name_th ||
                        `${e.first_name_th || ""} ${e.last_name_th || ""}`
                      }`.trim(),
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
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
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
              >
                {saving ? "Saving..." : editingAssignment ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}