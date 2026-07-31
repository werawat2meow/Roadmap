"use client";

import { useEffect, useState } from "react";
import {Alert,Button,Card,} from "antd";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "@/app/components/LoadingOrb";
import {swalError,swalSuccess} from "../../../components/Swal";


import UnitPositionSearch from "./components/UnitPositionSearch";
import UnitPositionTable from "./components/UnitPositionTable";
import UnitPositionModal from "./components/UnitPositionModal";

const initialValues = {
  unit_id: "",
  position_id: "",
  headcount_target: 0,
  status: "active",
};

export default function UnitPositionsPage() {

  /* =========================
      Permission
  ========================= */

  const router = useRouter();
  const {user,loadingUser} = useAuth();

  const canView = hasPermission(user,"ems.unit_positions.view");
  const canCreate = hasPermission(user,"ems.unit_positions.create");
  const canEdit = hasPermission(user,"ems.unit_positions.edit");
  const canDelete = hasPermission(user,"ems.unit_positions.delete");

  /* =========================
      State
  ========================= */

  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [rows,setRows] = useState([]);
  const [search,setSearch] = useState("");
  const [page,setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total,setTotal] = useState(0);
  const [totalPages,setTotalPages] = useState(1);
  const [error,setError] = useState("");
  const [openModal,setOpenModal] = useState(false);
  const [editingRow,setEditingRow] = useState(null);
  const [deletingId,setDeletingId] = useState("");
  const [formData,setFormData] = useState(initialValues);

  /* =========================
      Permission Check
  ========================= */

  useEffect(() => {

    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }

  },[
    user,
    loadingUser,
    canView,
    router,
  ]);

  /* =========================
      Load Data
  ========================= */

  const loadUnitPositions = async (
    keyword = "",
    nextPage = 1
  ) => {

    try {

      setLoading(true);

      setError("");

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(nextPage)
      );

      params.set(
        "pageSize",
        String(pageSize)
      );

      if (keyword) {

        params.set(
          "search",
          keyword
        );

      }

      const res = await fetch(

        `/api/admin/unit-positions?${params.toString()}`,

        {
          cache:"no-store",
        }

      );

      const json =
        await res.json();

      if (!res.ok) {

        throw new Error(
          json.error ||
          "Load failed"
        );

      }

      setRows(
        json.data || []
      );

      setPage(
        json.pagination?.page || 1
      );

      setTotal(
        json.pagination?.total || 0
      );

      setTotalPages(
        json.pagination?.totalPages || 1
      );

    }
    catch(err){

      console.error(err);

      setError(
        err.message ||
        "เกิดข้อผิดพลาด"
      );

    }
    finally{

      setLoading(false);

    }

  };

  /* =========================
      First Load
  ========================= */

  useEffect(() => {
    if (!loadingUser && canView) {
      loadUnitPositions();
    }
  },[
    loadingUser,
    canView,
  ]);

  /* =========================
      Search
  ========================= */

  useEffect(() => {

    const timer =
      setTimeout(() => {

        loadUnitPositions(
          search,
          1
        );

      },300);

    return () =>
      clearTimeout(timer);

  },[
    search,
  ]);
   

  const handleOpenCreate = () => {

    if (!canCreate) {

      swalError(
        "คุณไม่มีสิทธิ์เพิ่มข้อมูลกำหนดตำแหน่งตามหน่วย"
      );

      return;

    }

    setEditingRow(null);

    setFormData(initialValues);

    setOpenModal(true);

  };

  /* =========================
      Open Edit
  ========================= */

  const handleOpenEdit = (row) => {

    if (!canEdit) {

      swalError(
        "คุณไม่มีสิทธิ์แก้ไขข้อมูลกำหนดตำแหน่งตามหน่วย"
      );

      return;

    }

    setEditingRow(row);

    setFormData({

      unit_id:
        row.unit_id,

      position_id:
        row.position_id,

      headcount_target:
        row.headcount_target,

      status:
        row.status,

    });

    setOpenModal(true);

  };

  /* =========================
      Close Modal
  ========================= */

  const handleCloseModal = () => {

    setEditingRow(null);

    setFormData(initialValues);

    setOpenModal(false);

  };

  /* =========================
      Save
  ========================= */

  const handleSave = async (
    values
  ) => {

    try {

      setSaving(true);

      const isEdit =
        !!editingRow;

      const url = isEdit
        ? `/api/admin/unit-positions/${editingRow.id}`
        : "/api/admin/unit-positions";

      const method = isEdit
        ? "PATCH"
        : "POST";

      const res = await fetch(
        url,
        {

          method,

          headers:{

            "Content-Type":
              "application/json",

          },

          body:JSON.stringify({

            unit_id:
              values.unit_id,

            position_id:
              values.position_id,

            headcount_target:
              Number(
                values.headcount_target
              ) || 0,

            status:
              values.status,

          }),

        }
      );

      const json =
        await res.json();

      if (!res.ok) {

        throw new Error(

          json.error ||
          "Save failed"

        );

      }

      swalSuccess(

        isEdit
          ? "อัปเดตข้อมูลเรียบร้อยแล้ว"
          : "เพิ่มข้อมูลเรียบร้อยแล้ว"

      );

      handleCloseModal();

      await loadUnitPositions(

        search,

        isEdit
          ? page
          : 1

      );

    }
    catch(err){
      console.error(err);
      swalError(
        err.message ||
        "เกิดข้อผิดพลาดในการบันทึก"
      );
    }
    finally{
      setSaving(false);
    }
  };

  /* =========================
      Delete
  ========================= */

  const handleDelete = async (row) => {
    if (!canDelete) {
      swalError(
        "คุณไม่มีสิทธิ์ลบข้อมูลกำหนดตำแหน่งตามหน่วย"
      );
      return;
    }

    try{
      setDeletingId(row.id);
      const res = await fetch(
          `/api/admin/unit-positions/${row.id}`,
          {
            method:"DELETE",
          }
        );
      const json =
        await res.json();
      if (!res.ok){
        throw new Error(
          json.error ||
          "Delete failed"
        );
      }

      swalSuccess(
        "ลบข้อมูลเรียบร้อยแล้ว"
      );

      const nextPage =
        rows.length === 1 &&
        page > 1
          ? page - 1
          : page;
      await loadUnitPositions(
        search,
        nextPage
      );
    }
    catch(err){
      console.error(err);
      swalError(
        err.message ||
        "เกิดข้อผิดพลาดในการลบข้อมูล"
      );
    }
    finally{
      setDeletingId("");
    }
  };
  
  /* =========================
      Render
  ========================= */

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
    <>
      <Card>
        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              กำหนดตำแหน่งตามหน่วย
            </h2>

            <p className="mt-1 text-gray-500">
              จัดการตำแหน่งที่สามารถใช้งานในแต่ละหน่วยงาน
            </p>
          </div>

          {(!canCreate &&
            !canEdit &&
            !canDelete) && (

            <Alert
              type="warning"
              showIcon
              message="คุณมีสิทธิ์ดูข้อมูลอย่างเดียว"
            />

          )}

        </div>
      </Card>

      <div style={{ marginTop: 16 }}>

        <UnitPositionSearch
          search={search}
          onSearch={setSearch}
          canCreate={canCreate}
          onCreate={handleOpenCreate}
        />

      </div>

      <div style={{ marginTop: 16 }}>

        <UnitPositionTable
          loading={loading}

          rows={rows}

          page={page}
          pageSize={pageSize}
          total={total}

          deletingId={deletingId}

          canEdit={canEdit}
          canDelete={canDelete}

          onEdit={handleOpenEdit}

          onDelete={handleDelete}

          onPageChange={(nextPage) => {

            loadUnitPositions(
              search,
              nextPage
            );

          }}
        />

      </div>

      <UnitPositionModal
        open={openModal}

        editingRow={editingRow}

        saving={saving}

        initialValues={formData}

        onCancel={handleCloseModal}

        onSubmit={handleSave}
      />

      {error && (
        <div
          style={{
            marginTop: 16,
          }}
        >
          <Alert
            showIcon
            type="error"
            message={error}
          />
        </div>
      )}
    </>
  );
}