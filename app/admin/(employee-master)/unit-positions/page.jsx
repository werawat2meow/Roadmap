"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Card } from "antd";

import LoadingOrb from "@/app/components/LoadingOrb";
import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";
import useScopedPermissions from "@/hooks/useScopedPermissions";

import UnitPositionSearch from "./components/UnitPositionSearch";
import UnitPositionSummaryCards from "./components/UnitPositionSummaryCards";
import UnitPositionTable from "./components/UnitPositionTable";
import UnitPositionModal from "./components/UnitPositionModal";

const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  search: "",
  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  position_id: "",
  status: "active",
};

const INITIAL_FORM = {
  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  position_id: "",
  headcount_target: 0,
  status: "active",
};

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function UnitPositionsPage() {
  /* =======================================================
     Workforce Planning Permission + Scope
  ======================================================= */

  const planningAccess = useScopedPermissions("ems.unit_positions");
  const orgAccess = useScopedPermissions("ems.org_structure");

  const {
    user,
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = planningAccess;

  const canGenerateSlots = Boolean(canEdit && orgAccess.canCreate);

  /* =======================================================
     State
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({
    plan_count: 0,
    target_total: 0,
    slot_capacity_total: 0,
    filled_total: 0,
    vacant_total: 0,
    gap_total: 0,
    over_plan_total: 0,
  });

  const [options, setOptions] = useState({
    lineages: [],
    companies: [],
    branch_groups: [],
    branches: [],
    branch_departments: [],
    departments: [],
    divisions: [],
    units: [],
    positions: [],
  });

  const [openModal, setOpenModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [deletingId, setDeletingId] = useState("");
  const [generatingId, setGeneratingId] = useState("");

  /* =======================================================
     Load Options
  ======================================================= */

  const loadOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/unit-positions/options", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || "ไม่สามารถโหลดตัวเลือก Workforce Planning ได้"
        );
      }

      setOptions({
        lineages: payload?.data?.lineages || [],
        companies: payload?.data?.companies || [],
        branch_groups: payload?.data?.branch_groups || [],
        branches: payload?.data?.branches || [],
        branch_departments: payload?.data?.branch_departments || [],
        departments: payload?.data?.departments || [],
        divisions: payload?.data?.divisions || [],
        units: payload?.data?.units || [],
        positions: payload?.data?.positions || [],
      });
    } catch (loadError) {
      console.error("LOAD_UNIT_POSITION_OPTIONS_ERROR:", loadError);
      swalError(loadError?.message || "ไม่สามารถโหลดข้อมูลโครงสร้างองค์กรได้");
    }
  }, []);

  /* =======================================================
     Load Workforce Plans
  ======================================================= */

  const loadUnitPositions = useCallback(
    async ({ nextFilters = appliedFilters, nextPage = page } = {}) => {
      if (!canView) return;

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(nextPage),
          pageSize: String(pageSize),
        });

        Object.entries(nextFilters || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && String(value).trim()) {
            params.set(key, String(value).trim());
          }
        });

        const response = await fetch(
          `/api/admin/unit-positions?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload = await safeJson(response);

        if (!response.ok) {
          throw new Error(
            payload?.error || "ไม่สามารถโหลดข้อมูลวางแผนอัตรากำลังได้"
          );
        }

        setRows(payload?.data || []);
        setSummary(payload?.summary || {});
        setPage(payload?.pagination?.page || nextPage);
        setTotal(payload?.pagination?.total || 0);
      } catch (loadError) {
        console.error("LOAD_UNIT_POSITIONS_ERROR:", loadError);
        setRows([]);
        setError(loadError?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, page, pageSize, canView]
  );

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    loadOptions();
    loadUnitPositions({
      nextFilters: INITIAL_FILTERS,
      nextPage: 1,
    });
  }, [loadingUser, user, canView]);

  /* =======================================================
     Filter Cascade
  ======================================================= */

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = {
        ...current,
        [field]: value ?? "",
      };

      if (field === "company_id") {
        next.branch_group_id = "";
        next.branch_id = "";
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      }

      if (field === "branch_group_id") {
        next.branch_id = "";
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      }

      if (field === "branch_id") {
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      }

      if (field === "department_id") {
        next.division_id = "";
        next.unit_id = "";
      }

      if (field === "division_id") {
        next.unit_id = "";
      }

      return next;
    });
  };

  /* =======================================================
     Search / Reset / Refresh
  ======================================================= */

  const handleSearch = async () => {
    const next = { ...filters };
    setAppliedFilters(next);
    setPage(1);

    await loadUnitPositions({
      nextFilters: next,
      nextPage: 1,
    });
  };

  const handleReset = async () => {
    const reset = { ...INITIAL_FILTERS };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);

    await loadUnitPositions({
      nextFilters: reset,
      nextPage: 1,
    });
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadOptions(),
      loadUnitPositions({
        nextFilters: appliedFilters,
        nextPage: page,
      }),
    ]);
  };

  /* =======================================================
     Create / Edit
  ======================================================= */

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Workforce Plan");
      return;
    }

    setEditingRow(null);
    setFormData({
      ...INITIAL_FORM,
      company_id: filters.company_id || "",
      branch_group_id: filters.branch_group_id || "",
      branch_id: filters.branch_id || "",
      department_id: filters.department_id || "",
      division_id: filters.division_id || "",
      unit_id: filters.unit_id || "",
      position_id: filters.position_id || "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (row) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Workforce Plan");
      return;
    }

    setEditingRow(row);
    setFormData({
      company_id: row.company_id || "",
      branch_group_id: row.branch_group_id || "",
      branch_id: row.branch_id || "",
      department_id: row.department_id || "",
      division_id: row.division_id || "",
      unit_id: row.unit_id || "",
      position_id: row.position_id || "",
      headcount_target: Number(row.headcount_target || 0),
      status: row.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setEditingRow(null);
    setFormData(INITIAL_FORM);
    setOpenModal(false);
  };

  /* =======================================================
     Save
  ======================================================= */

  const handleSave = async (values) => {
    const isEdit = Boolean(editingRow?.id);

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไข Workforce Plan");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่ม Workforce Plan");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/unit-positions/${editingRow.id}`
        : "/api/admin/unit-positions";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: values.branch_id,
          unit_id: values.unit_id,
          position_id: values.position_id,
          headcount_target: Number(values.headcount_target ?? 0),
          status: values.status || "active",
        }),
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(payload?.error || "ไม่สามารถบันทึก Workforce Plan ได้");
      }

      swalSuccess(
        payload?.message ||
          (isEdit
            ? "อัปเดต Workforce Plan เรียบร้อยแล้ว"
            : "เพิ่ม Workforce Plan เรียบร้อยแล้ว")
      );

      handleCloseModal();

      await loadUnitPositions({
        nextFilters: appliedFilters,
        nextPage: isEdit ? page : 1,
      });
    } catch (saveError) {
      console.error("SAVE_UNIT_POSITION_ERROR:", saveError);
      swalError(saveError?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Delete
  ======================================================= */

  const handleDelete = async (row) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบ Workforce Plan");
      return;
    }

    if (row.slot_count > 0) {
      swalError("แผนนี้มี Position Slot เชื่อมอยู่แล้ว กรุณาเปลี่ยน Status เป็น Inactive แทน");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบ Workforce Plan "${row.branch_name} / ${row.unit_name} / ${row.position_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);

      const response = await fetch(`/api/admin/unit-positions/${row.id}`, {
        method: "DELETE",
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(payload?.error || "ไม่สามารถลบ Workforce Plan ได้");
      }

      swalSuccess(payload?.message || "ลบ Workforce Plan เรียบร้อยแล้ว");

      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;

      await loadUnitPositions({
        nextFilters: appliedFilters,
        nextPage,
      });
    } catch (deleteError) {
      console.error("DELETE_UNIT_POSITION_ERROR:", deleteError);
      swalError(deleteError?.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  /* =======================================================
     Generate Missing Position Slots
  ======================================================= */

  const handleGenerateSlots = async (row) => {
    if (!canGenerateSlots) {
      swalError(
        "การ Generate Slot ต้องมีทั้ง ems.unit_positions.edit และ ems.org_structure.create"
      );
      return;
    }

    if (row.slot_gap <= 0) {
      swalError("Position Slot ครบตาม Target แล้ว");
      return;
    }

    const confirmed = await swalConfirm(
      `Target ${row.headcount_target} | Slot Capacity ${row.slot_capacity} | Gap ${row.slot_gap}\n\nต้องการ Generate Position Slot ที่ขาดหรือไม่?\nSlot ใหม่จะยังไม่มี Parent Slot และต้องจัดสายบังคับบัญชาที่หน้า Position Slot Master`
    );

    if (!confirmed) return;

    try {
      setGeneratingId(row.id);

      const response = await fetch(
        `/api/admin/unit-positions/${row.id}/generate-slots`,
        {
          method: "POST",
        }
      );

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(payload?.error || "ไม่สามารถ Generate Position Slot ได้");
      }

      swalSuccess(payload?.message || "Generate Position Slot เรียบร้อยแล้ว");

      await loadUnitPositions({
        nextFilters: appliedFilters,
        nextPage: page,
      });
    } catch (generateError) {
      console.error("GENERATE_POSITION_SLOTS_ERROR:", generateError);
      swalError(generateError?.message || "เกิดข้อผิดพลาดในการ Generate Slot");
    } finally {
      setGeneratingId("");
    }
  };

  /* =======================================================
     Guard
  ======================================================= */

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  /* =======================================================
     Render
  ======================================================= */

  return (
    <>
      <Card className="shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">วางแผนอัตรากำลังตามหน่วย</h2>
            <p className="mt-1 text-gray-500">
              Workforce Planning: กำหนด Target Headcount และติดตาม Position Slot / Filled / Vacant / Gap ตามโครงสร้างองค์กร
            </p>
          </div>

          {!canCreate && !canEdit && !canDelete && (
            <Alert
              type="warning"
              showIcon
              title="คุณมีสิทธิ์ดูข้อมูลอย่างเดียว"
            />
          )}
        </div>
      </Card>

      <div className="mt-4">
        <Alert
          type="info"
          showIcon
          title="Workforce Plan → Position Slot → Employee Assignment"
          description="Target เก็บที่ unit_positions, Seat จริงเก็บที่ org_position_slots ผ่าน unit_position_id และผู้ครองตำแหน่งเก็บที่ employee_position_assignments"
        />
      </div>

      <div className="mt-4">
        <UnitPositionSummaryCards summary={summary} />
      </div>

      <div className="mt-4">
        <UnitPositionSearch
          filters={filters}
          options={options}
          loading={loading}
          canCreate={canCreate}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
          onRefresh={handleRefresh}
          onCreate={handleOpenCreate}
        />
      </div>

      <div className="mt-4">
        <Card className="shadow-sm" styles={{ body: { padding: 0 } }}>
          <UnitPositionTable
            loading={loading}
            rows={rows}
            page={page}
            pageSize={pageSize}
            total={total}
            deletingId={deletingId}
            generatingId={generatingId}
            canEdit={canEdit}
            canDelete={canDelete}
            canGenerateSlots={canGenerateSlots}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onGenerateSlots={handleGenerateSlots}
            onPageChange={(nextPage) => {
              loadUnitPositions({
                nextFilters: appliedFilters,
                nextPage,
              });
            }}
          />
        </Card>
      </div>

      <UnitPositionModal
        open={openModal}
        editingRow={editingRow}
        saving={saving}
        initialValues={formData}
        options={options}
        onCancel={handleCloseModal}
        onSubmit={handleSave}
      />

      {error && (
        <div className="mt-4">
          <Alert showIcon type="error" title={error} />
        </div>
      )}
    </>
  );
}
