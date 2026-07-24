"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "../../../components/Swal";

import LoadingOrb from "../../../components/LoadingOrb";

import PositionTable from "./components/PositionTable";
import PositionModal from "./components/PositionModal";
import PositionSearch from "./components/PositionSearch";
import PositionPagination from "./components/PositionPagination";

const initialForm = {
  code: "",
  name: "",
  group: "",
  position_family_id: "",
  position_levels: [],
  status: "active",
};

export default function PositionsPage() {
  const router = useRouter();

  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "ems.positions.view");
  const canCreate = hasPermission(user, "ems.positions.create");
  const canEdit = hasPermission(user, "ems.positions.edit");
  const canDelete = hasPermission(user, "ems.positions.delete");

  const [search, setSearch] = useState("");

  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [editingPosition, setEditingPosition] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [page, setPage] = useState(1);

  const [pageSize] = useState(20);

  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [
    loadingUser,
    user,
    canView,
    router,
  ]);

  const loadPositions = async (
    keyword = "",
    nextPage = 1
  ) => {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      params.set("page", nextPage);

      params.set("pageSize", pageSize);

      if (keyword) {
        params.set("search", keyword);
      }

      const res = await fetch(
        `/api/admin/positions?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "Load failed"
        );
      }

      const mapped = (json.data || []).map(
        (item) => ({
          id: item.id,

          code: item.position_code,

          name: item.position_name,

          group:
            item.position_group || "",

          family_name:
            item.position_family
              ?.family_name || "",

          position_family_id:
            item.position_family_id || "",

          position_levels:
            item.position_levels || [],

          status: item.status,
        })
      );

      setPositions(mapped);

      setPage(
        json.pagination.page
      );

      setTotal(
        json.pagination.total
      );

      setTotalPages(
        json.pagination.totalPages
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Load Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPositions(search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setEditingPosition(null);

    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่มข้อมูล"
      );

      return;
    }

    resetForm();

    setOpenModal(true);
  };

  const handleOpenEdit = (
    position
  ) => {
    if (!canEdit) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไข"
      );

      return;
    }

    setEditingPosition(position);

    setForm({
      code: position.code,

      name: position.name,

      group: position.group,

      position_family_id:
        position.position_family_id,

      position_levels:
        (
          position.position_levels ||
          []
        ).map(
          (x) => x.id
        ),

      status:
        position.status ||
        "active",
    });

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();

    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit =
      !!editingPosition;

    if (
      isEdit &&
      !canEdit
    ) {
      swalError(
        "คุณไม่มีสิทธิ์แก้ไข"
      );

      return;
    }

    if (
      !isEdit &&
      !canCreate
    ) {
      swalError(
        "คุณไม่มีสิทธิ์เพิ่ม"
      );

      return;
    }

    if (
      !form.code.trim() ||
      !form.name.trim()
    ) {
      swalError(
        "กรุณากรอกรหัสและชื่อตำแหน่ง"
      );

      return;
    }

    if (
      !form.position_family_id
    ) {
      swalError(
        "กรุณาเลือก Position Family"
      );

      return;
    }

    if (
      form.position_levels
        .length === 0
    ) {
      swalError(
        "กรุณาเลือก Position Level"
      );

      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/positions/${editingPosition.id}`
        : "/api/admin/positions";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            position_code:
              form.code.trim(),

            position_name:
              form.name.trim(),

            position_group:
              form.group || null,

            position_family_id:
              form.position_family_id,

            position_levels:
              form.position_levels,

            status:
              form.status,
          }),
        });

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ||
            "Save Failed"
        );
      }

      swalSuccess(
        isEdit
          ? "อัปเดตข้อมูลเรียบร้อย"
          : "บันทึกข้อมูลเรียบร้อย"
      );

      await loadPositions(
        search,
        isEdit
          ? page
          : 1
      );

      handleCloseModal();
    } catch (err) {
      console.error(err);

      swalError(
        err.message
      );
    } finally {
      setSaving(false);
    }
  };

    const handleDelete = async (position) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูล");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบตำแหน่ง "${position.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(position.id);

      const res = await fetch(
        `/api/admin/positions/${position.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "Delete Failed"
        );
      }

      swalSuccess(
        "ลบข้อมูลเรียบร้อยแล้ว"
      );

      const nextPage =
        positions.length === 1 &&
        page > 1
          ? page - 1
          : page;

      await loadPositions(
        search,
        nextPage
      );
    } catch (err) {
      console.error(err);

      swalError(err.message);
    } finally {
      setDeletingId("");
    }
  };

  if (loadingUser) {
    return <LoadingOrb />;
  }

  if (!user) {
    return null;
  }

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-800">
              Position Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Enterprise Position Master
            </p>

          </div>

          {canCreate && (

            <button
              onClick={handleOpenCreate}
              className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              + Add Position
            </button>

          )}

        </div>

      </div>

      {/* Search */}

      <PositionSearch
        value={search}
        onChange={setSearch}
      />

      {/* Error */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">

          {error}

        </div>

      )}

      {/* Table */}

      <PositionTable
        loading={loading}
        positions={positions}
        page={page}
        pageSize={pageSize}
        canEdit={canEdit}
        canDelete={canDelete}
        deletingId={deletingId}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}

      <PositionPagination
        page={page}
        total={total}
        totalPages={totalPages}
        loading={loading}
        onPrevious={() =>
          loadPositions(
            search,
            page - 1
          )
        }
        onNext={() =>
          loadPositions(
            search,
            page + 1
          )
        }
      />

      {/* Modal */}

      <PositionModal
        open={openModal}
        saving={saving}
        editingPosition={
          editingPosition
        }
        form={form}
        setForm={setForm}
        onClose={
          handleCloseModal
        }
        onSave={handleSave}
      />

    </div>
  );
}