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

import PositionLevelSearch from "./components/PositionLevelSearch";
import PositionLevelTable from "./components/PositionLevelTable";
import PositionLevelPagination from "./components/PositionLevelPagination";
import PositionLevelModal from "./components/PositionLevelModal";

const initialForm = {
  level_code: "",
  level_name: "",
  sort_order: 0,
  status: "active",
};

export default function PositionLevelsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user,"ems.position_levels.view");
  const canCreate = hasPermission(user,"ems.position_levels.create");
  const canEdit = hasPermission(user,"ems.position_levels.edit");
  const canDelete = hasPermission(user,"ems.position_levels.delete");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =useState(1);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] =useState(false);
  const [editingLevel, setEditingLevel] =useState(null);
  const [deletingId, setDeletingId] =useState("");
  const [form, setForm] =useState(initialForm);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [loadingUser,user,canView,router,]);

  const loadLevels = async (keyword = "",nextPage = 1) => {
    try {
      setLoading(true);

      setError("");

      const params =
        new URLSearchParams();

      params.set("page", nextPage);

      params.set(
        "pageSize",
        pageSize
      );

      if (keyword) {
        params.set(
          "search",
          keyword
        );
      }

      const res = await fetch(
        `/api/admin/position-levels?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ||
            "Load Failed"
        );
      }

      setLevels(json.data || []);

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
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLevels(search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setEditingLevel(null);

    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    resetForm();

    setOpenModal(true);
  };

  const handleOpenEdit = (level) => {
    setEditingLevel(level);

    setForm({
      level_code: level.level_code,
      level_name: level.level_name,
      sort_order: level.sort_order,
      status: level.status,
    });

    setOpenModal(true);
  };

  const handleCloseModal =() => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    if (!form.level_code.trim()) {
      swalError(
        "กรุณากรอก Level Code"
      );
      return;
    }

    if (!form.level_name.trim()) {
      swalError(
        "กรุณากรอก Level Name"
      );
      return;
    }

    try {
      setSaving(true);
      const isEdit = !!editingLevel;

      const res = await fetch(
          isEdit
            ? `/api/admin/position-levels/${editingLevel.id}`
            : "/api/admin/position-levels",
          {
            method:
              isEdit
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              form
            ),
          }
        );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error
        );
      }

      swalSuccess(isEdit? "แก้ไขสำเร็จ": "เพิ่มสำเร็จ");

      await loadLevels(search,page);
      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message);
    } finally {
      setSaving(false);
    }
  };
      
  const handleDelete = async (level) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูล");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบ Position Level "${level.level_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(level.id);

      const res = await fetch(
        `/api/admin/position-levels/${level.id}`,
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

      swalSuccess("ลบข้อมูลเรียบร้อย");

      const nextPage =
        levels.length === 1 && page > 1
          ? page - 1
          : page;

      await loadLevels(
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

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;
  
  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              Position Levels
            </h1>
            <p className="mt-1 text-slate-500">
              Master Position Level Management
            </p>
          </div>
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              + Add Position Level
            </button>
          )}

        </div>

      </div>

      {/* Search */}
      <PositionLevelSearch
        value={search}
        onChange={setSearch}
      />
      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <PositionLevelTable
        loading={loading}
        levels={levels}
        page={page}
        pageSize={pageSize}
        canEdit={canEdit}
        canDelete={canDelete}
        deletingId={deletingId}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />
      {/* Pagination */}

      <PositionLevelPagination
        page={page}
        total={total}
        totalPages={totalPages}
        loading={loading}
        onPrevious={() =>
          loadLevels(
            search,
            page - 1
          )
        }
        onNext={() =>
          loadLevels(
            search,
            page + 1
          )
        }
      />

      {/* Modal */}
      <PositionLevelModal
        open={openModal}
        saving={saving}
        editingLevel={editingLevel}
        form={form}
        setForm={setForm}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}