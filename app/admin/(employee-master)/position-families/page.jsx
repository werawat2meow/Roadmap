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

import PositionFamilySearch from "./components/PositionFamilySearch";
import PositionFamilyTable from "./components/PositionFamilyTable";
import PositionFamilyPagination from "./components/PositionFamilyPagination";
import PositionFamilyModal from "./components/PositionFamilyModal";

const initialForm = {
  family_code: "",
  family_name: "",
  description: "",
  sort_order: 0,
  status: "active",
};

export default function PositionFamiliesPage() {
  const router = useRouter();

  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user,"ems.position_families.view");
  const canCreate = hasPermission(user,"ems.position_families.create");
  const canEdit = hasPermission(user,"ems.position_families.edit");
  const canDelete = hasPermission(user,"ems.position_families.delete");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] =useState(false);
  const [editingFamily, setEditingFamily] =useState(null);
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

  const loadFamilies = async (keyword = "",nextPage = 1) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", nextPage);
      params.set("pageSize",pageSize);

      if (keyword) {
        params.set(
          "search",
          keyword
        );
      }

      const res = await fetch(
        `/api/admin/position-families?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error
        );
      }

      setFamilies(json.data || []);

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
    loadFamilies();
  }, []);

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadFamilies(
          search,
          1
        );
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setEditingFamily(null);

    setForm(initialForm);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (family) => {
    setEditingFamily(
      family
    );
    setForm({
      family_code: family.family_code,
      family_name: family.family_name,
      description:family.description || "",
      sort_order:family.sort_order,
      status:family.status,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
      resetForm();
      setOpenModal(false);
    };

  const handleSave =
    async () => {
      if (
        !form.family_code.trim()
      ) {
        swalError(
          "กรุณากรอก Family Code"
        );

        return;
      }

      if (
        !form.family_name.trim()
      ) {
        swalError(
          "กรุณากรอก Family Name"
        );

        return;
      }

      try {
        setSaving(true);

        const isEdit =
          !!editingFamily;

        const res =
          await fetch(
            isEdit
              ? `/api/admin/position-families/${editingFamily.id}`
              : "/api/admin/position-families",
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

        const json =
          await res.json();

        if (!res.ok) {
          throw new Error(
            json.error
          );
        }

        swalSuccess(
          isEdit
            ? "แก้ไขสำเร็จ"
            : "เพิ่มสำเร็จ"
        );

        await loadFamilies(
          search,
          page
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
      const handleDelete = async (family) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูล");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบ Position Family "${family.family_name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(family.id);

      const res = await fetch(
        `/api/admin/position-families/${family.id}`,
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
        families.length === 1 &&
        page > 1
          ? page - 1
          : page;

      await loadFamilies(
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
              Position Families
            </h1>

            <p className="text-slate-500 mt-1">
              Master Position Family Management
            </p>

          </div>

          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              + Add Position Family
            </button>
          )}

        </div>

      </div>

      <PositionFamilySearch
        value={search}
        onChange={setSearch}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          {error}
        </div>
      )}

      <PositionFamilyTable
        loading={loading}
        families={families}
        page={page}
        pageSize={pageSize}
        canEdit={canEdit}
        canDelete={canDelete}
        deletingId={deletingId}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <PositionFamilyPagination
        page={page}
        total={total}
        totalPages={totalPages}
        loading={loading}
        onPrevious={() =>
          loadFamilies(
            search,
            page - 1
          )
        }
        onNext={() =>
          loadFamilies(
            search,
            page + 1
          )
        }
      />

      <PositionFamilyModal
        open={openModal}
        saving={saving}
        editingFamily={editingFamily}
        form={form}
        setForm={setForm}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

    </div>
  );
}